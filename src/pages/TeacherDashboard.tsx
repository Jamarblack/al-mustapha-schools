import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { LogOut, Save, Users, BookOpen, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentRow {
  id: string;
  name: string;
  admission_number: string;
  ca_score: number | string;
  exam_score: number | string;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<any>(null);

  // Filters
  const [section, setSection] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  
  // Data Lists
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Load Teacher Info
  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) {
      navigate("/login");
      return;
    }
    setTeacher(JSON.parse(data));
  }, []);

  // 2. Fetch Classes when Section Changes
  useEffect(() => {
    if (!section) return;
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').eq('section', section).order('name');
      if (data) setClassList(data);
      setSubjectList([]); // Reset subjects
      setStudents([]);    // Reset students
    };
    fetchClasses();
  }, [section]);

  // 3. Fetch Subjects when Section Changes (Filtered by Department logic if needed)
  useEffect(() => {
    if (!section) return;
    const fetchSubjects = async () => {
      // Simple fetch: Get all subjects for this section
      // You can add more complex logic here to filter by 'department' if the class has one
      const { data } = await supabase.from('subjects').select('*').eq('section', section).order('name');
      if (data) setSubjectList(data);
    };
    fetchSubjects();
  }, [section]);

  // 4. Fetch Students when Class is Selected
  const handleLoadStudents = async () => {
    if (!classId || !subjectId) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please select a Class and Subject." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, admission_number')
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;

      // Transform to include score fields
      const rows = data.map(s => ({
        id: s.id,
        name: s.full_name,
        admission_number: s.admission_number,
        ca_score: "",
        exam_score: ""
      }));
      
      setStudents(rows);
      if (rows.length === 0) toast({ description: "No students found in this class." });

    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Score Input
  const updateScore = (id: string, field: 'ca_score' | 'exam_score', value: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // 6. Submit Results
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const resultsToUpload = students
        .filter(s => s.ca_score !== "" || s.exam_score !== "") // Only upload if entered
        .map(s => {
          const ca = Number(s.ca_score) || 0;
          const exam = Number(s.exam_score) || 0;
          const total = ca + exam;
          
          let grade = 'F';
          if (total >= 70) grade = 'A';
          else if (total >= 60) grade = 'B';
          else if (total >= 50) grade = 'C';
          else if (total >= 45) grade = 'D';
          else if (total >= 40) grade = 'E';

          return {
            student_id: s.id,
            subject_id: subjectId,
            ca_score: ca,
            exam_score: exam,
            grade: grade,
            uploaded_by: teacher.id,
            term: "1st Term",      // Hardcoded for MVP, make dynamic later
            session: "2025/2026",  // Hardcoded for MVP
            is_approved: false     // Pending Principal Approval
          };
        });

      if (resultsToUpload.length === 0) {
        toast({ title: "Nothing to save", description: "Enter scores first." });
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('academic_results').upsert(resultsToUpload); // UPSERT handles updates if ID matches, but we don't have result ID here. 
      // Note: A true UPSERT needs a unique constraint on (student_id, subject_id, term, session). 
      // For now, this effectively inserts new rows. We can add a constraint later to prevent duplicates.
      
      if (error) throw error;

      toast({ title: "Success!", description: `Uploaded results for ${resultsToUpload.length} students.` });
      setStudents([]); // Clear list or keep it? Clearing is safer.

    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!teacher) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
             <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border border-border">
                <AvatarImage src={teacher.passport_url} />
                <AvatarFallback>{teacher.full_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Teacher Dashboard</h1>
                <p className="text-muted-foreground">{teacher.full_name} | {teacher.role.toUpperCase()}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => { localStorage.clear(); navigate("/login"); }}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>

          {/* Controls */}
          <Card className="mb-8 shadow-soft border-border">
            <CardHeader><CardTitle>Upload Class Results</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Select Section */}
                <div className="space-y-2">
                  <Label>School Section</Label>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger><SelectValue placeholder="Choose Section" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nursery">Nursery & KG</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Select Class (Dependent on Section) */}
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={classId} onValueChange={setClassId} disabled={!section}>
                    <SelectTrigger><SelectValue placeholder="Choose Class" /></SelectTrigger>
                    <SelectContent>
                      {classList.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} {c.department ? `(${c.department})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Select Subject (Dependent on Section) */}
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subjectId} onValueChange={setSubjectId} disabled={!section}>
                    <SelectTrigger><SelectValue placeholder="Choose Subject" /></SelectTrigger>
                    <SelectContent>
                      {subjectList.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} {s.department ? `[${s.department}]` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleLoadStudents} disabled={loading || !classId || !subjectId} className="w-full md:w-auto">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                Load Student List
              </Button>
            </CardContent>
          </Card>

          {/* Student List for Scoring */}
          {students.length > 0 && (
            <Card className="animate-in fade-in slide-in-from-bottom-2">
              <CardHeader className="flex flex-row justify-between items-center border-b">
                <CardTitle>Enter Scores</CardTitle>
                <div className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {students.length} Students
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-4 text-left font-medium">Student Name</th>
                        <th className="p-4 text-left font-medium w-32">Admission No</th>
                        <th className="p-4 w-24">CA (40)</th>
                        <th className="p-4 w-24">Exam (60)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium">{student.name}</td>
                          <td className="p-4 text-muted-foreground">{student.admission_number}</td>
                          <td className="p-4">
                            <Input 
                              type="number" 
                              max={40}
                              className="w-20 text-center"
                              value={student.ca_score}
                              onChange={(e) => updateScore(student.id, 'ca_score', e.target.value)}
                            />
                          </td>
                          <td className="p-4">
                            <Input 
                              type="number" 
                              max={60}
                              className="w-20 text-center"
                              value={student.exam_score}
                              onChange={(e) => updateScore(student.id, 'exam_score', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-muted/30 border-t flex justify-end">
                  <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save & Submit Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;