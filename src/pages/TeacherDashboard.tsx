import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, FileText, Loader2, User, BookOpen, School, Upload, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [myPassport, setMyPassport] = useState<File | null>(null);
  
  const [activeTab, setActiveTab] = useState("profile");

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("1st Term");

  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { test: string; mid: string; ass: string; exam: string }>>({});
  const [loading, setLoading] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false); // Controls the inline clear confirmation

  const [myClassStudents, setMyClassStudents] = useState<any[]>([]);
  const [myClassDetails, setMyClassDetails] = useState<any>(null);
  const [selectedStudentReport, setSelectedStudentReport] = useState<any>(null);
  const [studentPreviewResults, setStudentPreviewResults] = useState<any[]>([]);
  
  const [reportData, setReportData] = useState({
    opened: "", present: "", absent: "",
    teacherRemark: "", principalRemark: "Satisfactory",
    nextTerm: "",
    skills: { Handwriting: 5, Fluency: 5, Sports: 4, Drawing: 3, Punctuality: 5, Neatness: 5, Politeness: 5, Honesty: 5, Leadership: 4, Attentiveness: 5 }
  });

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    const parsedUser = JSON.parse(data);
    setUser(parsedUser);
    loadMetadata(parsedUser);
  }, []);

  const loadMetadata = async (currentUser: any) => {
    const { data: c } = await supabase.from('classes').select('*').order('name');
    if (c) setClasses(c);
    const { data: s } = await supabase.from('subjects').select('*').order('name');
    if (s) setSubjects(s);

    if (currentUser.class_teacher_of) {
        const { data: cls } = await supabase.from('classes').select('*').eq('id', currentUser.class_teacher_of).single();
        setMyClassDetails(cls);
        fetchMyClassStudents(currentUser.class_teacher_of);
    }

    const { data: settings } = await supabase.from('school_settings').select('*').maybeSingle();
    if (settings) {
        setSelectedSession(settings.current_session);
        setSelectedTerm(settings.current_term);
    }
  };

  const getSubjectGroupForClass = (className: string) => {
      const name = className.toUpperCase();
      if (name.includes('KG')) return 'KG';
      if (name.includes('PRE-NURSERY') || name.includes('PRE NURSERY')) return 'Pre-Nursery';
      if (name === 'NURSERY 1') return 'Nursery';
      if (name === 'NURSERY 2') return 'Nursery'; 
      if (name === 'BASIC 1' || name === 'BASIC 2') return 'Lower Primary';
      if (name.includes('BASIC 3') || name.includes('BASIC 4') || name.includes('BASIC 5')) return 'Upper Primary';
      if (name.includes('JSS')) return 'JSS';
      if (name.includes('SS') || name.includes('SSS')) return 'SSS';
      return 'General'; 
  };

  const filteredSubjects = subjects.filter(sub => {
      if (!selectedClass) return false;
      const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";
      const targetGroup = getSubjectGroupForClass(selectedClassName);
      return sub.class_group === targetGroup;
  });

  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    setLoading(true);
    try {
        const fileExt = myPassport.name.split('.').pop();
        const fileName = `staff_${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('passports').upload(fileName, myPassport);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('staff').update({ passport_url: data.publicUrl }).eq('id', user.id);
        if (dbError) throw dbError;
        const updatedUser = { ...user, passport_url: data.publicUrl };
        setUser(updatedUser);
        localStorage.setItem("staffData", JSON.stringify(updatedUser));
        toast({ title: "Success", description: "Passport Updated" });
        setMyPassport(null);
    } catch (error: any) { toast({ variant: "destructive", title: "Upload Failed", description: error.message }); } finally { setLoading(false); }
  };

  const fetchClassList = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setClearConfirm(false); // Reset confirmation state on new load
    const { data: stud } = await supabase.from('students').select('*').eq('class_id', selectedClass).eq('is_active', true).order('full_name');
    setStudents(stud || []);
    if (selectedSubject && stud) {
        const { data: existing } = await supabase.from('academic_results').select('*')
            .eq('class_id', selectedClass).eq('subject_id', selectedSubject)
            .eq('session', selectedSession).eq('term', selectedTerm);
        const initialScores: any = {};
        stud.forEach(s => {
            const found = existing?.find(e => e.student_id === s.id);
            initialScores[s.id] = { test: found ? found.class_test : "", mid: found ? found.mid_term_test : "", ass: found ? found.assignment : "", exam: found ? found.exam_score : "" };
        });
        setScores(initialScores);
    }
    setLoading(false);
  };

  const handleScoreChange = (id: string, field: 'test' | 'mid' | 'ass' | 'exam', val: string) => {
    setScores(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const submitScores = async () => {
    if (!selectedSubject) { toast({variant: "destructive", title: "Select a Subject first"}); return; }
    setLoading(true);
    
    const updates = students.map(s => {
        const t1 = Number(scores[s.id]?.test || 0); const t2 = Number(scores[s.id]?.mid || 0); const t3 = Number(scores[s.id]?.ass || 0); const ex = Number(scores[s.id]?.exam || 0);
        const totalCA = t1 + t2 + t3; const total = totalCA + ex;
        let grade = 'F'; if (total >= 75) grade = 'A'; else if (total >= 65) grade = 'B'; else if (total >= 50) grade = 'C'; else if (total >= 40) grade = 'D';
        
        return { 
            student_id: s.id, class_id: selectedClass, subject_id: selectedSubject, 
            session: selectedSession, term: selectedTerm, 
            class_test: t1, mid_term_test: t2, assignment: t3, ca_score: totalCA, exam_score: ex, grade: grade, 
            is_approved: false,
            uploaded_by_name: user.full_name
        };
    });
    
    const { error } = await supabase.from('academic_results').upsert(updates, { onConflict: 'student_id, subject_id, session, term' });
    setLoading(false);
    if (!error) toast({ title: "Saved", description: "Academic scores uploaded." });
    else toast({ variant: "destructive", title: "Error", description: error.message });
  };

  const handleClearScores = async () => {
    if (!selectedSubject || !selectedClass) return;
    setLoading(true);
    
    // Delete the scores from the database for this specific class, subject, session, and term
    const { error } = await supabase
      .from('academic_results')
      .delete()
      .eq('class_id', selectedClass)
      .eq('subject_id', selectedSubject)
      .eq('session', selectedSession)
      .eq('term', selectedTerm);

    setLoading(false);
    setClearConfirm(false);

    if (!error) {
        toast({ title: "Cleared", description: "All scores for this sheet have been wiped." });
        // Reset the local input fields on the screen
        const emptyScores: any = {};
        students.forEach(s => {
            emptyScores[s.id] = { test: "", mid: "", ass: "", exam: "" };
        });
        setScores(emptyScores);
    } else {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const fetchMyClassStudents = async (classId: string) => {
      const { data } = await supabase.from('students').select('*').eq('class_id', classId).eq('is_active', true).order('full_name');
      setMyClassStudents(data || []);
  };

  const openReportModal = async (s: any) => {
    setSelectedStudentReport(s);
    setStudentPreviewResults([]); 
    const { data: results } = await supabase.from('academic_results').select('*, subject:subjects(name)').eq('student_id', s.id).eq('session', selectedSession).eq('term', selectedTerm);
    if (results) setStudentPreviewResults(results);
    const { data } = await supabase.from('report_card_details').select('*').eq('student_id', s.id).eq('session', selectedSession).eq('term', selectedTerm).maybeSingle();
    if (data) {
        setReportData({ opened: data.school_opened || "", present: data.times_present || "", absent: data.times_absent || "", teacherRemark: data.form_master_remark || "", principalRemark: data.principal_remark || "Satisfactory", nextTerm: data.next_term_begins || "", skills: data.psychomotor_skills || reportData.skills });
    } else {
        setReportData({ opened: "", present: "", absent: "", teacherRemark: "", principalRemark: "Satisfactory", nextTerm: "", skills: { Handwriting: 5, Fluency: 5, Sports: 4, Drawing: 3, Punctuality: 5, Neatness: 5, Politeness: 5, Honesty: 5, Leadership: 4, Attentiveness: 5 } });
    }
  };

 const saveReportDetails = async () => {
    if (!selectedStudentReport) return;
    
    const payload = { 
        student_id: selectedStudentReport.id, 
        session: selectedSession, 
        term: selectedTerm, 
        school_opened: reportData.opened, 
        times_present: reportData.present, 
        times_absent: reportData.absent, 
        form_master_remark: reportData.teacherRemark, 
        principal_remark: reportData.principalRemark, 
        next_term_begins: reportData.nextTerm || null, 
        psychomotor_skills: reportData.skills 
    };
    
    const { error } = await supabase.from('report_card_details').upsert(payload, { onConflict: 'student_id, session, term' });
    if (!error) { 
        toast({ title: "Saved", description: "Report details updated." }); 
        setSelectedStudentReport(null); 
    } else { 
        toast({ variant: "destructive", title: "Error", description: error.message }); 
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b px-6 py-4 flex justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3"><Avatar><AvatarImage src={user.passport_url} /><AvatarFallback>TC</AvatarFallback></Avatar><div><h1 className="font-bold">{user.full_name}</h1><p className="text-xs text-slate-500">Teacher Portal</p></div></div>
        <Button variant="destructive" size="sm" onClick={() => navigate('/login')}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>

      <main className="p-4 md:p-6 container mx-auto max-w-6xl">
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[600px]"><TabsTrigger value="profile"><User className="w-4 h-4 mr-2"/> Profile</TabsTrigger><TabsTrigger value="results"><BookOpen className="w-4 h-4 mr-2"/> Subject Entry</TabsTrigger><TabsTrigger value="class" disabled={!myClassDetails}><School className="w-4 h-4 mr-2"/> My Class</TabsTrigger></TabsList>

            <TabsContent value="profile"><Card><CardHeader><CardTitle>Teacher Profile</CardTitle></CardHeader><CardContent className="space-y-6 text-center md:text-left"><div className="flex flex-col md:flex-row gap-8 items-center"><div className="relative group"><Avatar className="w-32 h-32 border-4 border-slate-100 shadow-sm"><AvatarImage src={user.passport_url} /><AvatarFallback className="text-4xl">TC</AvatarFallback></Avatar><label htmlFor="upload-pass" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700"><Upload className="w-4 h-4" /></label><input id="upload-pass" type="file" className="hidden" onChange={e => e.target.files && setMyPassport(e.target.files[0])} /></div><div className="space-y-2 flex-1"><div className="text-2xl font-bold">{user.full_name}</div><div className="text-gray-500 flex items-center gap-2 justify-center md:justify-start"><School className="w-4 h-4"/> {user.role.toUpperCase().replace('_', ' ')}</div>{myPassport && <Button onClick={handleProfileUpdate} disabled={loading} size="sm" className="mt-2 bg-blue-600">{loading ? <Loader2 className="animate-spin"/> : "Save New Photo"}</Button>}<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-left"><div className="bg-slate-50 p-3 rounded border"><span className="text-xs font-bold text-slate-400 block uppercase">Email</span><span className="font-medium">{user.email}</span></div><div className="bg-slate-50 p-3 rounded border"><span className="text-xs font-bold text-slate-400 block uppercase">Login Password</span><span className="font-mono font-bold tracking-widest text-blue-600">{user.password}</span></div></div>{myClassDetails && <div className="mt-4 p-3 bg-purple-50 text-purple-700 rounded-md border border-purple-100 text-sm font-bold">⭐ You are the Class Teacher for {myClassDetails.name}</div>}</div></div></CardContent></Card></TabsContent>

            <TabsContent value="results">
                <Card className="border-t-4 border-t-blue-600">
                    <CardHeader><CardTitle>Input Results</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                                    <SelectItem value="2026/2027">2026/2027</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1st Term">1st Term</SelectItem>
                                    <SelectItem value="2nd Term">2nd Term</SelectItem>
                                    <SelectItem value="3rd Term">3rd Term</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                            
                            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                                <SelectTrigger><SelectValue placeholder={!selectedClass ? "Select Class First" : "Subject"}/></SelectTrigger>
                                <SelectContent>
                                    {filteredSubjects.length > 0 
                                      ? filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                                      : <SelectItem value="none" disabled>No subjects for this class group</SelectItem>
                                    }
                                </SelectContent>
                            </Select>
                            
                            <Button onClick={fetchClassList} disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : "Load Sheet"}</Button>
                        </div>

                        {students.length > 0 && (
                            <>
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader><TableRow className="bg-gray-50"><TableHead className="w-[300px]">Student Name</TableHead><TableHead className="w-[80px]">Test(10)</TableHead><TableHead className="w-[80px]">CA(20)</TableHead><TableHead className="w-[80px]">Ass(10)</TableHead><TableHead className="w-[80px]">Exam(60)</TableHead><TableHead className="w-[80px] font-bold">Total</TableHead></TableRow></TableHeader>
                                        <TableBody>{students.map((s) => {const t1 = Number(scores[s.id]?.test || 0); const t2 = Number(scores[s.id]?.mid || 0); const t3 = Number(scores[s.id]?.ass || 0); const ex = Number(scores[s.id]?.exam || 0); const tot = t1 + t2 + t3 + ex; return (<TableRow key={s.id}><TableCell className="font-medium">{s.full_name}</TableCell><TableCell><Input type="number" max={10} className="w-16 h-8" value={scores[s.id]?.test || ''} onChange={e => handleScoreChange(s.id, 'test', e.target.value)} /></TableCell><TableCell><Input type="number" max={20} className="w-16 h-8" value={scores[s.id]?.mid || ''} onChange={e => handleScoreChange(s.id, 'mid', e.target.value)} /></TableCell><TableCell><Input type="number" max={10} className="w-16 h-8" value={scores[s.id]?.ass || ''} onChange={e => handleScoreChange(s.id, 'ass', e.target.value)} /></TableCell><TableCell><Input type="number" max={60} className="w-16 h-8" value={scores[s.id]?.exam || ''} onChange={e => handleScoreChange(s.id, 'exam', e.target.value)} /></TableCell><TableCell className={`font-bold text-lg ${tot >= 50 ? 'text-green-600' : 'text-red-500'}`}>{tot}</TableCell></TableRow>);})}</TableBody>
                                    </Table>
                                </div>
                                
                                {/* UPDATED BUTTON AREA WITH INLINE CONFIRMATION */}
                                <div className="mt-6 flex flex-col md:flex-row justify-end items-center gap-4">
                                    {clearConfirm ? (
                                        <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-200 bg-red-50 p-2 rounded-lg border border-red-100 w-full md:w-auto justify-between">
                                            <span className="text-red-600 font-bold text-sm ml-2">Clear all scores?</span>
                                            <div className="flex gap-2">
                                                <Button onClick={() => setClearConfirm(false)} variant="outline" size="sm" className="bg-white hover:bg-gray-100 text-gray-700 border-gray-200">Cancel</Button>
                                                <Button onClick={handleClearScores} variant="destructive" size="sm" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Yes, WIPE"}</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button onClick={() => setClearConfirm(true)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full md:w-auto">
                                            <Trash2 className="w-4 h-4 mr-2"/> Clear Sheet
                                        </Button>
                                    )}
                                    <Button onClick={submitScores} disabled={loading} className="bg-green-600 hover:bg-green-700 w-full md:w-48">
                                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} Save All Results
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="class"><Card className="border-t-4 border-t-purple-600"><CardHeader><CardTitle>Manage Class: {myClassDetails?.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-gray-500 mb-4">Click on a student to enter Attendance, Remarks, and Skills.</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{myClassStudents.map(s => (<Dialog key={s.id}><DialogTrigger asChild><div onClick={() => openReportModal(s)} className="p-4 border rounded-lg cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between shadow-sm"><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={s.passport_url}/><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><span className="font-medium truncate max-w-[150px]">{s.full_name}</span></div><FileText className="w-4 h-4 text-purple-400"/></div></DialogTrigger></Dialog>))}</div></CardContent></Card></TabsContent>
        </Tabs>

        <Dialog open={!!selectedStudentReport} onOpenChange={(o) => !o && setSelectedStudentReport(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4"><DialogTitle className="text-xl">Report Card: <span className="text-purple-700">{selectedStudentReport?.full_name}</span></DialogTitle></DialogHeader>
                <div className="my-2 bg-slate-50 p-4 rounded-lg border"><h4 className="font-bold text-sm text-gray-500 mb-2 uppercase">Academic Performance Snapshot</h4><div className="overflow-x-auto max-h-[150px]"><Table><TableHeader><TableRow><TableHead className="py-2">Subject</TableHead><TableHead className="py-2">Total</TableHead><TableHead className="py-2">Grade</TableHead></TableRow></TableHeader><TableBody>{studentPreviewResults.length > 0 ? studentPreviewResults.map(res => {const total = (res.class_test||0) + (res.mid_term_test||0) + (res.assignment||0) + (res.exam_score||0); return (<TableRow key={res.id}><TableCell className="py-1 font-medium">{res.subject?.name}</TableCell><TableCell className="py-1">{total}</TableCell><TableCell className="py-1"><Badge variant={total >= 50 ? "outline" : "destructive"}>{res.grade}</Badge></TableCell></TableRow>);}) : <TableRow><TableCell colSpan={3} className="text-center text-gray-400">No results uploaded yet.</TableCell></TableRow>}</TableBody></Table></div></div>
                <div className="grid gap-6 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border shadow-sm"><h4 className="font-bold text-sm mb-3 text-purple-700">Attendance</h4><div className="grid grid-cols-3 gap-2"><div><Label>Opened</Label><Input value={reportData.opened} onChange={e => setReportData({...reportData, opened: e.target.value})}/></div><div><Label>Present</Label><Input value={reportData.present} onChange={e => setReportData({...reportData, present: e.target.value})}/></div><div><Label>Absent</Label><Input value={reportData.absent} onChange={e => setReportData({...reportData, absent: e.target.value})}/></div></div><div className="mt-2"><Label>Next Term Begins</Label><Input type="date" value={reportData.nextTerm} onChange={e => setReportData({...reportData, nextTerm: e.target.value})}/></div></div>
                        <div className="bg-white p-4 rounded-lg border shadow-sm"><h4 className="font-bold text-sm mb-3 text-purple-700">Remarks</h4><div className="space-y-3"><div><Label>Class Teacher's Remark</Label><Input placeholder="e.g. He is a diligent student..." value={reportData.teacherRemark} onChange={e => setReportData({...reportData, teacherRemark: e.target.value})}/></div><div><Label>Principal's Remark</Label><Input value={reportData.principalRemark} onChange={e => setReportData({...reportData, principalRemark: e.target.value})}/></div></div></div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border shadow-sm"><h4 className="font-bold text-sm mb-3 text-purple-700">Psychomotor Skills (1-5)</h4><div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2">{Object.keys(reportData.skills).map(skill => (<div key={skill}><Label className="text-[10px] uppercase font-bold text-gray-500">{skill}</Label><Input type="number" max={5} className="h-8" value={(reportData.skills as any)[skill]} onChange={(e) => setReportData({...reportData, skills: {...reportData.skills, [skill]: Number(e.target.value)}})} /></div>))}</div></div>
                </div>
                <Button onClick={saveReportDetails} className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg">Save Report Details</Button>
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TeacherDashboard;