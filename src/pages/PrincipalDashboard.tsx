import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, GraduationCap, School, Loader2, Upload, Phone, FileCheck, FileSpreadsheet, FileText, User, Plus, Settings, Trash2, EyeOff, Eye, ArchiveX, Printer } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState({ id: "", current_session: "2025/2026", current_term: "1st Term" });
  const [stats, setStats] = useState({ students: 0, staff: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [pendingBatches, setPendingBatches] = useState<any[]>([]);
  const [approvedBatches, setApprovedBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false); // Controls the beautiful inline delete confirmation

  const [broadsheetClass, setBroadsheetClass] = useState("");
  const [broadsheetData, setBroadsheetData] = useState<{headers: string[], rows: any[]}|null>(null);

  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", role: "", section: "secondary", phone: "", assignedClass: "unassigned" });
  const [newStudent, setNewStudent] = useState({ name: "", classId: "", parentPhone: "", gender: "Male", dob: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [classFilter, setClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    setUser(JSON.parse(data));
    loadData();
  }, []);

  const loadData = async () => {
    const { data: settings } = await supabase.from('school_settings').select('*').maybeSingle();
    if (settings) setSchoolSettings(settings);

    const { data: cls } = await supabase.from('classes').select('*').eq('section', 'secondary').order('name');
    if (cls) setClasses(cls);

    if (cls && cls.length > 0) {
        const classIds = cls.map(c => c.id);
        const { data: st } = await supabase.from('students').select('*, class:classes(name)').in('class_id', classIds).order('full_name');
        if (st) { setStudents(st); setStats(prev => ({ ...prev, students: st.length })); }
        fetchBatches(classIds);
    }

    const { data: sf } = await supabase.from('staff').select('*, class_teacher_of(name)').order('role');
    if (sf) {
        const secStaff = sf.filter(s => s.assigned_section === 'secondary' || s.assigned_section === 'all' || s.role === 'principal' || s.role === 'proprietor');
        setStaff(secStaff); setStats(prev => ({ ...prev, staff: secStaff.length }));
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    const { error } = await supabase.from('school_settings').update({ current_session: schoolSettings.current_session, current_term: schoolSettings.current_term }).eq('id', schoolSettings.id);
    setLoading(false);
    if(error) toast({ variant: "destructive", title: "Error", description: error.message});
    else { toast({ title: "Updated", description: "School Session & Term Updated!"}); loadData(); }
  };

  const handleRegisterStudent = async () => {
    setLoading(true);
    const selectedClass = classes.find(c => c.id === newStudent.classId);
    if (!selectedClass) { toast({variant: "destructive", title: "Select Class"}); setLoading(false); return;}
    const rand = Math.floor(1000 + Math.random() * 9000);
    const autoAdmissionNo = `AMS/${selectedClass.name.substring(0,3)}/${rand}`;
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    const { error } = await supabase.from('students').insert({ full_name: newStudent.name, admission_number: autoAdmissionNo, class_id: newStudent.classId, section: selectedClass.section, gender: newStudent.gender, date_of_birth: newStudent.dob || null, pin_code: pin, emergency_contact: newStudent.parentPhone, is_active: true });
    setLoading(false);
    if (!error) { toast({ title: "Student Registered!" }); loadData(); setNewStudent({ name: "", classId: "", parentPhone: "", gender: "Male", dob: "" }); }
  };

  const handleNameChange = (name: string) => { const updated = { ...newStaff, name }; if (newStaff.role === 'teacher' && name.length > 3) generateCredentials(name, 'teacher', updated); else setNewStaff(updated); };
  const handleRoleChange = (role: string) => { const updated = { ...newStaff, role }; if (role === 'teacher' && newStaff.name.length > 3) generateCredentials(newStaff.name, role, updated); else setNewStaff(updated); };
  const generateCredentials = (fullName: string, role: string, current: any) => { const parts = fullName.trim().toLowerCase().split(' '); let emailPrefix = parts.length > 1 ? parts.slice(0, -1).map(p => p[0]).join('') + parts[parts.length - 1] : parts[0]; emailPrefix = emailPrefix.replace(/[^a-z0-9]/g, ''); setNewStaff({ ...current, email: `${emailPrefix}@almustaphaschools.com`, password: Math.floor(100000 + Math.random() * 900000).toString() }); };

  const handleRegisterStaff = async () => {
    setLoading(true);
    const classToAssign = (newStaff.assignedClass && newStaff.assignedClass !== "unassigned") ? newStaff.assignedClass : null;
    const { error } = await supabase.from('staff').insert({ full_name: newStaff.name, email: newStaff.email, password: newStaff.password, role: newStaff.role, assigned_section: newStaff.section, phone_number: newStaff.phone, class_teacher_of: classToAssign });
    setLoading(false);
    if (!error) { toast({ title: "Success", description: "Staff created." }); loadData(); setNewStaff({ name: "", email: "", password: "", role: "", section: "secondary", phone: "", assignedClass: "unassigned" }); }
  };

  const fetchBatches = async (secondaryClassIds: string[]) => {
      const { data } = await supabase.from('academic_results').select('*, subject:subjects(name), class:classes(name), student:students(full_name)').in('class_id', secondaryClassIds).limit(10000);
      if (!data) return;
      const pending: any = {}; const approved: any = {};
      data.forEach((r: any) => {
          const key = `${r.class_id}_${r.subject_id}_${r.session}_${r.term}`;
          const batchObj = { id: key, class_name: r.class?.name, subject_name: r.subject?.name, session: r.session, term: r.term, uploaded_by: r.uploaded_by_name || 'Subject Teacher', submitted_at: r.created_at, records: [] };
          if(!r.is_approved) { if(!pending[key]) pending[key] = {...batchObj}; pending[key].records.push(r); } 
          else { if(!approved[key]) approved[key] = {...batchObj}; approved[key].records.push(r); }
      });
      setPendingBatches(Object.values(pending)); setApprovedBatches(Object.values(approved));
  };

  const handleApproveBatch = async (batch: any) => {
      setLoading(true); const recordIds = batch.records.map((r: any) => r.id);
      await supabase.from('academic_results').update({ is_approved: true }).in('id', recordIds);
      setLoading(false); toast({ title: "Batch Approved" }); setSelectedBatch(null); loadData(); if(broadsheetClass) generateBroadsheetPreview(); 
  };

  const handleDeleteBatch = async (batch: any, isApproved: boolean) => {
      setLoading(true); const recordIds = batch.records.map((r: any) => r.id);
      await supabase.from('academic_results').delete().in('id', recordIds);
      setLoading(false); toast({ title: "Batch Deleted" }); setSelectedBatch(null); setDeleteConfirm(false); loadData(); if(broadsheetClass) generateBroadsheetPreview(); 
  };

  const handleDeleteAllApproved = async () => {
      if(!confirm("DANGER: Delete ALL approved results for the secondary section?")) return;
      setLoading(true); const classIds = classes.map(c => c.id);
      await supabase.from('academic_results').delete().eq('is_approved', true).in('class_id', classIds);
      setLoading(false); toast({ title: "All Approved Cleared" }); loadData(); 
  };

  useEffect(() => { if (broadsheetClass) generateBroadsheetPreview(); else setBroadsheetData(null); }, [broadsheetClass, schoolSettings]);

  const generateBroadsheetPreview = async () => {
      setLoading(true);
      const { data: studs } = await supabase.from('students').select('*').eq('class_id', broadsheetClass).eq('is_active', true).order('full_name');
      const { data: res } = await supabase.from('academic_results').select('*, subject:subjects(name)').eq('class_id', broadsheetClass).eq('session', schoolSettings.current_session).eq('term', schoolSettings.current_term).eq('is_approved', true);
      setLoading(false);
      if(!studs || studs.length === 0 || !res || res.length === 0) { setBroadsheetData(null); return; }
      
      const uniqueSubjects = Array.from(new Set(res.map((r: any) => r.subject?.name))).filter(Boolean) as string[];
      const headers = ["Admission No", "Student Name", ...uniqueSubjects, "Total Score", "Average"];
      const rows = studs.map(student => {
          const rowObj: any = { "Admission No": student.admission_number, "Student Name": student.full_name };
          let grandTotal = 0; let subCount = 0;
          uniqueSubjects.forEach(subName => {
              const scoreRec = res.find(r => r.student_id === student.id && r.subject?.name === subName);
              if(scoreRec) { rowObj[subName] = scoreRec.total_score; grandTotal += scoreRec.total_score; subCount++; } else rowObj[subName] = "-"; 
          });
          rowObj["Total Score"] = grandTotal; rowObj["Average"] = subCount > 0 ? (grandTotal / subCount).toFixed(2) : 0;
          return rowObj;
      });
      setBroadsheetData({ headers, rows });
  };

  const downloadBroadsheet = () => {
      if(!broadsheetData || !broadsheetClass) return;
      const cls = classes.find(c => c.id === broadsheetClass);
      let csvContent = broadsheetData.headers.join(",") + "\n";
      broadsheetData.rows.forEach(row => { csvContent += broadsheetData.headers.map(h => `"${row[h]}"`).join(",") + "\n"; });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.setAttribute("download", `Secondary_Broadsheet_${cls?.name}_${schoolSettings.current_term}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const toggleStudentStatus = async (id: string, currentStatus: boolean) => { await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id); setStudents(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s)); };
  
  if (!user) return null;
  const filteredStudents = students.filter(s => { const matchesClass = classFilter === 'all' || s.class_id === classFilter; const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.admission_number.toLowerCase().includes(searchQuery.toLowerCase()); return matchesClass && matchesSearch; });

  const BatchCard = ({ batch, isApproved }: { batch: any, isApproved: boolean }) => (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-all cursor-pointer border hover:border-blue-400 group" onClick={() => setSelectedBatch(batch)}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4"><div className={`p-3 rounded-xl transition-colors ${isApproved ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}><FileText className="w-6 h-6" /></div><Badge variant="outline" className={isApproved ? "bg-green-50 text-green-600 border-green-200" : "bg-orange-50 text-orange-600 border-orange-200"}>{isApproved ? 'Approved' : 'Pending'}</Badge></div>
                        <h3 className="font-bold text-xl text-slate-900 font-serif mb-1">{batch.subject_name}</h3>
                        <p className="text-sm font-bold text-red-500 border-b pb-4 mb-4">{batch.class_name} | {batch.term} | {batch.session}</p>
                        <div className="flex justify-between items-end text-sm text-gray-500">
                            <div className="flex flex-col">
                                <span className="flex items-center gap-2 font-medium"><User className="w-4 h-4"/> <span className="truncate max-w-[150px]">{batch.uploaded_by}</span></span>
                                {batch.submitted_at && <span className="text-[11px] text-gray-400 mt-1">Submitted: {new Date(batch.submitted_at).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
                            </div>
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{batch.records.length} Students</span>
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>
        </Dialog>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <style>{`
        @media print {
            body * { visibility: hidden; }
            #printable-broadsheet, #printable-broadsheet * { visibility: visible; }
            #printable-broadsheet { position: absolute; left: 0; top: 0; width: 100%; background: white; padding: 0 !important; }
            .print-hide { display: none !important; }
            @page { size: landscape; margin: 10mm; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000 !important; padding: 4px !important; text-align: center; font-size: 10px !important; color: #000 !important;}
            th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
        }
      `}</style>

      <header className="bg-white border-b px-6 py-4 flex justify-between sticky top-0 z-20 shadow-sm print-hide">
        <div className="flex items-center gap-3"><Avatar><AvatarImage src={user.passport_url} /><AvatarFallback>PR</AvatarFallback></Avatar><div><h1 className="font-bold">{user.full_name}</h1><p className="text-xs text-slate-500">Principal's Office</p></div></div>
        <Button variant="destructive" size="sm" onClick={() => navigate('/login')}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>

      <main className="p-4 md:p-6 container mx-auto max-w-6xl">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-1 bg-slate-200/50 justify-start print-hide">
                <TabsTrigger value="overview"><School className="w-4 h-4 mr-2"/> Overview</TabsTrigger>
                <TabsTrigger value="registration"><Plus className="w-4 h-4 mr-2"/> Register</TabsTrigger>
                <TabsTrigger value="approvals" className="relative"><FileCheck className="w-4 h-4 mr-2"/> Pending {pendingBatches.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">{pendingBatches.length}</span>}</TabsTrigger>
                <TabsTrigger value="approved"><FileCheck className="w-4 h-4 mr-2 text-green-600"/> Approved</TabsTrigger>
                <TabsTrigger value="broadsheet"><FileSpreadsheet className="w-4 h-4 mr-2"/> Broadsheets</TabsTrigger>
                <TabsTrigger value="students"><GraduationCap className="w-4 h-4 mr-2"/> Students</TabsTrigger>
                <TabsTrigger value="staff"><Users className="w-4 h-4 mr-2"/> Staff</TabsTrigger>
                <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2"/> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="print-hide"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Card className="bg-[#1e3a8a] text-white"><CardHeader><CardTitle className="opacity-80 text-sm">Total Secondary Students</CardTitle></CardHeader><CardContent className="text-4xl font-bold">{stats.students}</CardContent></Card><Card className="bg-white text-slate-900 border-l-4 border-l-gold shadow-sm"><CardHeader><CardTitle className="opacity-80 text-sm">Total Assigned Staff</CardTitle></CardHeader><CardContent className="text-4xl font-bold">{stats.staff}</CardContent></Card></div></TabsContent>

            <TabsContent value="registration" className="print-hide">
                <Tabs defaultValue="student" className="w-full max-w-4xl mx-auto">
                    <TabsList className="w-full h-auto flex flex-col md:grid md:grid-cols-2 gap-2 mb-6 bg-transparent">
                        <TabsTrigger value="student" className="w-full border py-3 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white">Register Sec. Student</TabsTrigger>
                        <TabsTrigger value="staff" className="w-full border py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">Register Sec. Staff</TabsTrigger>
                    </TabsList>
                    <TabsContent value="student"><Card><CardHeader><CardTitle>Admission</CardTitle></CardHeader><CardContent className="space-y-4"><Input placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Select onValueChange={v => setNewStudent({...newStudent, classId: v})}><SelectTrigger><SelectValue placeholder="Select Secondary Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><Select onValueChange={v => setNewStudent({...newStudent, gender: v})} defaultValue="Male"><SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label className="text-xs text-gray-500 mb-1 block">Parent Phone</Label><Input value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} /></div><div><Label className="text-xs text-gray-500 mb-1 block">Date of Birth</Label><Input type="date" value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} /></div></div><Button onClick={handleRegisterStudent} disabled={loading} className="w-full bg-[#1e3a8a] text-white hover:bg-blue-900 py-6 mt-4">{loading ? <Loader2 className="animate-spin" /> : "Admit Student"}</Button></CardContent></Card></TabsContent>
                    <TabsContent value="staff"><Card><CardHeader><CardTitle>Staff Onboarding</CardTitle></CardHeader><CardContent className="space-y-4"><Input placeholder="Full Name" value={newStaff.name} onChange={e => handleNameChange(e.target.value)} /><Select onValueChange={handleRoleChange} value={newStaff.role}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="teacher">Teacher</SelectItem></SelectContent></Select><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label className="text-xs text-gray-500 mb-1 block">Email (Auto)</Label><Input value={newStaff.email} readOnly /></div><div><Label className="text-xs text-gray-500 mb-1 block">Password</Label><div className="relative"><Input type={showPassword ? "text" : "password"} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})}/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">{showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label className="text-xs text-gray-500 mb-1 block">Phone Number</Label><Input value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} /></div><div><Label className="text-xs text-gray-500 mb-1 block">Assign Class Teacher</Label><Select onValueChange={v => setNewStaff({...newStaff, assignedClass: v})} value={newStaff.assignedClass}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="unassigned">None</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div></div><Button onClick={handleRegisterStaff} disabled={loading} className="w-full py-6 mt-4 bg-slate-900">Create Account</Button></CardContent></Card></TabsContent>
                </Tabs>
            </TabsContent>

            <TabsContent value="settings" className="print-hide"><Card className="max-w-xl mx-auto border-t-4 border-t-[#1e3a8a]"><CardHeader><CardTitle>Global School Settings</CardTitle><CardDescription>Update this to control the active Term and Broadsheets.</CardDescription></CardHeader><CardContent className="space-y-6"><div><Label>Current Session (e.g. 2025/2026)</Label><Input value={schoolSettings.current_session} onChange={(e) => setSchoolSettings({...schoolSettings, current_session: e.target.value})} className="font-mono text-lg" /></div><div><Label>Current Term</Label><Select value={schoolSettings.current_term} onValueChange={(v) => setSchoolSettings({...schoolSettings, current_term: v})}><SelectTrigger className="font-mono text-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1st Term">1st Term</SelectItem><SelectItem value="2nd Term">2nd Term</SelectItem><SelectItem value="3rd Term">3rd Term</SelectItem></SelectContent></Select></div><Button onClick={handleUpdateSettings} disabled={loading} className="w-full bg-[#1e3a8a] text-white font-bold">{loading ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button></CardContent></Card></TabsContent>
            
            <TabsContent value="approvals" className="print-hide"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold font-serif text-blue-950">Pending Approvals</h2></div>{pendingBatches.length === 0 ? <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed">No pending results.</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pendingBatches.map(b => <BatchCard key={b.id} batch={b} isApproved={false}/>)}</div>}</TabsContent>
            <TabsContent value="approved" className="print-hide"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold font-serif text-green-900">Approved Results</h2>{approvedBatches.length > 0 && <Button variant="destructive" onClick={handleDeleteAllApproved}><ArchiveX className="w-4 h-4 mr-2"/> Clear All</Button>}</div>{approvedBatches.length === 0 ? <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed">No approved results.</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{approvedBatches.map(b => <BatchCard key={b.id} batch={b} isApproved={true}/>)}</div>}</TabsContent>

            <Dialog open={!!selectedBatch} onOpenChange={(o) => { if(!o) { setSelectedBatch(null); setDeleteConfirm(false); } }}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-xl border-none print-hide">
                    <DialogHeader className="bg-[#1e3a8a] text-white p-6 pb-8"><DialogTitle className="text-2xl font-serif">{selectedBatch?.class_name} - {selectedBatch?.subject_name}</DialogTitle><p className="text-blue-200 text-sm mt-1">{selectedBatch?.records.length} Students | {selectedBatch?.term}</p></DialogHeader>
                    <div className="p-6 max-h-[50vh] overflow-y-auto">
                        <Table><TableHeader><TableRow className="bg-slate-50 border-none"><TableHead>Student Name</TableHead><TableHead className="text-center">CA</TableHead><TableHead className="text-center">Exam</TableHead><TableHead className="text-center">Total</TableHead><TableHead className="text-center">Grade</TableHead></TableRow></TableHeader><TableBody>{selectedBatch?.records.map((r: any) => (<TableRow key={r.id}><TableCell className="font-medium text-slate-800">{r.student?.full_name}</TableCell><TableCell className="text-center">{r.ca_score}</TableCell><TableCell className="text-center">{r.exam_score}</TableCell><TableCell className="text-center font-bold text-[#1e3a8a]">{r.total_score || (r.ca_score + r.exam_score)}</TableCell><TableCell className={`text-center font-bold ${r.grade === 'F' ? 'text-red-500' : 'text-green-600'}`}>{r.grade}</TableCell></TableRow>))}</TableBody></Table>
                        <div className="mt-8 text-right border-t pt-4"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Uploaded By</p><p className="font-bold text-[#1e3a8a] text-lg font-serif">{selectedBatch?.uploaded_by}</p></div>
                    </div>

                    {/* BEAUTIFUL INLINE CONFIRMATION UI REPLACES THE UGLY BROWSER ALERT */}
                    <div className="p-6 bg-slate-50 border-t flex justify-end gap-4">
                        {deleteConfirm ? (
                            <div className="flex items-center justify-between w-full animate-in fade-in zoom-in duration-200">
                                <span className="text-red-600 font-bold text-sm">Are you sure? This cannot be undone.</span>
                                <div className="flex gap-2">
                                    <Button onClick={() => setDeleteConfirm(false)} variant="outline">Cancel</Button>
                                    <Button onClick={() => handleDeleteBatch(selectedBatch, !!selectedBatch?.records[0]?.is_approved)} variant="destructive">Yes, Delete</Button>
                                </div>
                            </div>
                        ) : (
                            !selectedBatch?.records[0]?.is_approved ? ( 
                                <>
                                    <Button onClick={() => setDeleteConfirm(true)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">Reject Batch</Button>
                                    <Button onClick={() => handleApproveBatch(selectedBatch)} className="bg-[#1e3a8a] text-white hover:bg-blue-900">Approve Batch</Button>
                                </> 
                            ) : ( 
                                <Button onClick={() => setDeleteConfirm(true)} variant="destructive"><Trash2 className="w-4 h-4 mr-2"/> Delete Approved Batch</Button> 
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <TabsContent value="broadsheet">
                <Card className="print-hide border-none shadow-none md:border-solid md:shadow-sm">
                    <CardHeader className="print-hide">
                        <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="text-blue-900"/> Secondary Broadsheet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-center justify-between print-hide">
                            <div><p className="text-sm font-bold text-blue-900 uppercase">Current Term Output</p><p className="text-xs text-blue-700">{schoolSettings.current_term} - {schoolSettings.current_session}</p></div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Select value={broadsheetClass} onValueChange={setBroadsheetClass}><SelectTrigger className="w-full md:w-[250px] bg-white"><SelectValue placeholder="Select Class to Preview"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                                <Button onClick={() => window.print()} disabled={!broadsheetData || loading} variant="outline" className="border-blue-900 text-blue-900 hover:bg-blue-50"><Printer className="w-4 h-4 mr-2"/> Print / Save PDF</Button>
                                <Button onClick={downloadBroadsheet} disabled={!broadsheetData || loading} className="bg-blue-900 text-white hover:bg-blue-800 whitespace-nowrap">{loading ? <Loader2 className="animate-spin"/> : "Download CSV"}</Button>
                            </div>
                        </div>
                        
                        {loading ? (
                            <div className="flex justify-center py-12 print-hide"><Loader2 className="w-8 h-8 animate-spin text-blue-900"/></div>
                        ) : broadsheetData ? (
                            <div id="printable-broadsheet" className="bg-white p-2 md:p-8 rounded-lg">
                                <div className="text-center mb-6 hidden print:block border-b-2 border-black pb-4">
                                    <h1 className="text-2xl font-bold font-serif text-[#1e3a8a] tracking-wider">AL-MUSTAPHA MODEL COLLEGE</h1>
                                    <p className="text-[12px] font-medium text-gray-800">1, Ajao Mustapha Street Idi-Emi, Ogidi Area Ilorin, Kwara State.</p>
                                    <div className="mt-4 flex justify-between items-end">
                                        <div className="text-left">
                                            <p className="text-sm font-bold uppercase underline">MASTER BROADSHEET</p>
                                            <p className="text-xs mt-1">CLASS: <span className="font-bold">{classes.find(c => c.id === broadsheetClass)?.name}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold">{schoolSettings.current_term.toUpperCase()}</p>
                                            <p className="text-xs">{schoolSettings.current_session} Session</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto w-full">
                                    <Table className="w-full text-[10px] md:text-sm">
                                        <TableHeader>
                                            <TableRow className="bg-blue-50 print:bg-gray-100">
                                                {broadsheetData.headers.map((h, i) => <TableHead key={i} className="whitespace-nowrap font-bold text-blue-900 print:text-black border print:border-black p-2">{h}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {broadsheetData.rows.map((row, i) => (
                                                <TableRow key={i} className="hover:bg-slate-50">
                                                    {broadsheetData.headers.map((h, j) => (
                                                        <TableCell key={j} className="whitespace-nowrap border print:border-black p-2 text-center first:text-left">{row[h]}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400 bg-slate-50 border rounded-lg border-dashed print-hide">Select a class to preview.</div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="students" className="print-hide"><Card><CardHeader><CardTitle>Secondary Students</CardTitle></CardHeader><CardContent><div className="flex flex-col md:flex-row gap-4 mb-4"><Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="md:w-1/3"/><Select value={classFilter} onValueChange={setClassFilter}><SelectTrigger className="md:w-1/4"><SelectValue placeholder="Filter by Class"/></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div className="rounded-md border h-[500px] overflow-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Portal Access</TableHead></TableRow></TableHeader><TableBody>{filteredStudents.map(s => (<TableRow key={s.id}><TableCell className="font-medium"><div className="flex items-center gap-2"><Avatar className="w-8 h-8"><AvatarImage src={s.passport_url}/><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div><div>{s.full_name}</div><div className="text-xs text-gray-500">{s.admission_number}</div></div></div></TableCell><TableCell><Badge variant="outline">{s.class?.name}</Badge></TableCell><TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleStudentStatus(s.id, s.is_active)} /></TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card></TabsContent>
            <TabsContent value="staff" className="print-hide"><Card><CardHeader><CardTitle>Secondary Staff</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{staff.map(s => (<div key={s.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm"><Avatar className="h-12 w-12"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div className="overflow-hidden"><div className="font-bold truncate">{s.full_name}</div><div className="text-xs text-gray-500 capitalize mb-1">{s.role.replace('_', ' ')}</div>{s.class_teacher_of && <Badge className="text-[10px] bg-purple-100 text-purple-700 hover:bg-purple-100">Class: {s.class_teacher_of.name}</Badge>}</div></div>))}</div></CardContent></Card></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PrincipalDashboard;