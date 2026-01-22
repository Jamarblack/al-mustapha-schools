import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  // Selection State
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("1st Term");

  // Data State
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { ca: string; exam: string }>>({});
  const [loading, setLoading] = useState(false);

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [reportData, setReportData] = useState({
    opened: "120", present: "115", absent: "5",
    formRemark: "A well behaved student.", houseRemark: "Maintains good hygiene.", principalRemark: "Good result, keep it up.",
    skills: { Handwriting: 5, Fluency: 5, Sports: 4, Drawing: 3, Punctuality: 5, Neatness: 5, Politeness: 5, Honesty: 5, Leadership: 4, Attentiveness: 5 }
  });

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    setUser(JSON.parse(data));
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    const { data: c } = await supabase.from('classes').select('*').order('name');
    if (c) setClasses(c);
    const { data: s } = await supabase.from('subjects').select('*').order('name');
    if (s) setSubjects(s);
  };

  const fetchClassList = async () => {
    if (!selectedClass) return;
    setLoading(true);
    
    // 1. Get Students
    const { data: stud } = await supabase.from('students').select('*').eq('class_id', selectedClass).eq('is_active', true).order('full_name');
    setStudents(stud || []);

    // 2. Get Scores
    if (selectedSubject && stud) {
        const { data: existing } = await supabase.from('academic_results').select('*')
            .eq('class_id', selectedClass).eq('subject_id', selectedSubject)
            .eq('session', selectedSession).eq('term', selectedTerm);
        
        const initialScores: any = {};
        stud.forEach(s => {
            const found = existing?.find(e => e.student_id === s.id);
            initialScores[s.id] = { ca: found ? found.ca_score : "", exam: found ? found.exam_score : "" };
        });
        setScores(initialScores);
    }
    setLoading(false);
  };

  const handleScoreChange = (id: string, field: 'ca' | 'exam', val: string) => {
    setScores(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const submitScores = async () => {
    if (!selectedSubject) { toast({variant: "destructive", title: "Select a Subject first"}); return; }
    setLoading(true);
    
    const updates = students.map(s => {
        const ca = Number(scores[s.id]?.ca || 0);
        const exam = Number(scores[s.id]?.exam || 0);
        
        // We calculate Grade for display/logic, but we do NOT send total_score if DB handles it
        const total = ca + exam; 
        let grade = 'F';
        if (total >= 75) grade = 'A'; else if (total >= 65) grade = 'B'; else if (total >= 50) grade = 'C'; else if (total >= 40) grade = 'D';
        
        return {
            student_id: s.id, 
            class_id: selectedClass, 
            subject_id: selectedSubject, 
            session: selectedSession, 
            term: selectedTerm,
            ca_score: ca, 
            exam_score: exam,
            // ⚠️ REMOVED 'total_score' to fix your error (The DB likely generates this)
            grade: grade, 
            is_approved: false
        };
    });
    
    // We use the new constraint 'unique_result_per_term' automatically by specifying the conflict columns
    const { error } = await supabase.from('academic_results').upsert(updates, { onConflict: 'student_id, subject_id, session, term' });
    
    setLoading(false);
    if (!error) toast({ title: "Saved", description: "Academic scores uploaded successfully." });
    else toast({ variant: "destructive", title: "Error", description: error.message });
  };

  const openReportModal = async (s: any) => {
    setSelectedStudent(s);
    const { data } = await supabase.from('report_card_details').select('*')
        .eq('student_id', s.id).eq('session', selectedSession).eq('term', selectedTerm).maybeSingle();
    
    if (data) {
        setReportData({
            opened: data.school_opened, present: data.times_present, absent: data.times_absent,
            formRemark: data.form_master_remark || "", houseRemark: data.house_master_remark || "", principalRemark: data.principal_remark || "",
            skills: data.psychomotor_skills || reportData.skills
        });
    }
  };

  const saveReportDetails = async () => {
    if (!selectedStudent) return;
    const payload = {
        student_id: selectedStudent.id, session: selectedSession, term: selectedTerm,
        school_opened: reportData.opened, times_present: reportData.present, times_absent: reportData.absent,
        form_master_remark: reportData.formRemark, house_master_remark: reportData.houseRemark, principal_remark: reportData.principalRemark,
        psychomotor_skills: reportData.skills
    };
    
    const { error } = await supabase.from('report_card_details').upsert(payload, { onConflict: 'student_id, session, term' });
    if (!error) {
        toast({ title: "Saved", description: "Report card details updated." });
        setSelectedStudent(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b px-6 py-4 flex justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
            <Avatar><AvatarImage src={user.passport_url} /><AvatarFallback>TC</AvatarFallback></Avatar>
            <div><h1 className="font-bold">{user.full_name}</h1><p className="text-xs text-slate-500">Teacher Portal</p></div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => navigate('/login')}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>

      <main className="p-6 container mx-auto max-w-6xl">
        <Card className="mb-6 border-t-4 border-t-blue-600">
            <CardHeader><CardTitle>Class Sheet Loader</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Select value={selectedSession} onValueChange={setSelectedSession}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="2025/2026">2025/2026</SelectItem></SelectContent></Select>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1st Term">1st Term</SelectItem></SelectContent></Select>
                <Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger><SelectValue placeholder="Select Subject"/></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                <Button onClick={fetchClassList} disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : "Load Data"}</Button>
            </CardContent>
        </Card>

        {students.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. ACADEMIC SCORES TABLE */}
                <Card className="lg:col-span-2 shadow-md">
                    <CardHeader className="flex flex-row justify-between bg-gray-50 border-b py-3 items-center">
                        <CardTitle className="text-sm uppercase tracking-wide">Academic Scores</CardTitle>
                        <Button onClick={submitScores} size="sm" className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2"/> Save Marks</Button>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[600px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Student</TableHead>
                                    <TableHead>CA (40)</TableHead>
                                    <TableHead>Exam (60)</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.full_name}</TableCell>
                                        <TableCell><Input type="number" className="w-20" value={scores[s.id]?.ca || ''} onChange={e => handleScoreChange(s.id, 'ca', e.target.value)} /></TableCell>
                                        <TableCell><Input type="number" className="w-20" value={scores[s.id]?.exam || ''} onChange={e => handleScoreChange(s.id, 'exam', e.target.value)} /></TableCell>
                                        <TableCell className="font-bold text-lg">{Number(scores[s.id]?.ca||0) + Number(scores[s.id]?.exam||0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 2. REPORT DETAILS ENTRY */}
                <Card className="shadow-md h-fit">
                    <CardHeader className="bg-blue-50 border-b py-3"><CardTitle className="text-sm uppercase tracking-wide">Report Card Details</CardTitle></CardHeader>
                    <CardContent className="pt-4">
                        <p className="text-xs text-gray-500 mb-4">Click a student to enter Attendance, Skills & Remarks.</p>
                        <div className="space-y-2 max-h-[500px] overflow-auto">
                            {students.map(s => (
                                <Dialog key={s.id}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between h-auto py-3 text-left" onClick={() => openReportModal(s)}>
                                            <span className="truncate">{s.full_name}</span> 
                                            <FileText className="w-4 h-4 text-blue-500 shrink-0"/>
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* --- MODAL FOR ATTENDANCE & SKILLS --- */}
        <Dialog open={!!selectedStudent} onOpenChange={(o) => !o && setSelectedStudent(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl">Report Details: <span className="text-blue-600">{selectedStudent?.full_name}</span></DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-sm mb-3 uppercase text-gray-500">Attendance</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div><Label>School Opened</Label><Input value={reportData.opened} onChange={e => setReportData({...reportData, opened: e.target.value})}/></div>
                            <div><Label>Times Present</Label><Input value={reportData.present} onChange={e => setReportData({...reportData, present: e.target.value})}/></div>
                            <div><Label>Times Absent</Label><Input value={reportData.absent} onChange={e => setReportData({...reportData, absent: e.target.value})}/></div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-sm mb-3 uppercase text-gray-500">Psychomotor Skills (Rate 1-5)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-4">
                            {Object.keys(reportData.skills).map(skill => (
                                <div key={skill}>
                                    <Label className="text-[10px] uppercase font-bold text-gray-400">{skill}</Label>
                                    <Input 
                                        type="number" max={5} min={1} 
                                        value={(reportData.skills as any)[skill]} 
                                        onChange={(e) => setReportData({...reportData, skills: {...reportData.skills, [skill]: Number(e.target.value)}})} 
                                        className="h-8"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-sm mb-3 uppercase text-gray-500">Remarks</h4>
                        <div className="space-y-3">
                            <div><Label>Form Master's Remark</Label><Input value={reportData.formRemark} onChange={e => setReportData({...reportData, formRemark: e.target.value})}/></div>
                            <div><Label>House Master's Remark</Label><Input value={reportData.houseRemark} onChange={e => setReportData({...reportData, houseRemark: e.target.value})}/></div>
                            <div><Label>Principal's Remark</Label><Input value={reportData.principalRemark} onChange={e => setReportData({...reportData, principalRemark: e.target.value})}/></div>
                        </div>
                    </div>
                </div>

                <Button onClick={saveReportDetails} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
                    <CheckCircle2 className="w-5 h-5 mr-2"/> Save Report Details
                </Button>
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TeacherDashboard;