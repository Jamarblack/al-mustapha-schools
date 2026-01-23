import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, FileCheck, LogOut, Menu, Upload, Search, ShieldCheck, X, Phone, Mail, CheckCircle, Loader2, ArrowRightCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myPassport, setMyPassport] = useState<File | null>(null);

  const [stats, setStats] = useState({ students: 0, staff: 0, pendingResults: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [pendingResults, setPendingResults] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]); // Added for promotion dropdowns
  const [searchTerm, setSearchTerm] = useState("");

  // --- PROMOTION STATE ---
  const [promoteSourceClass, setPromoteSourceClass] = useState("");
  const [promoteTargetClass, setPromoteTargetClass] = useState("");
  const [studentsToPromoteList, setStudentsToPromoteList] = useState<any[]>([]);
  const [selectedForPromotion, setSelectedForPromotion] = useState<string[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    const parsedUser = JSON.parse(data);
    setUser(parsedUser);
    if (parsedUser.role !== 'principal') { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // 1. Stats & Lists
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('section', 'secondary');
    const { data: staff } = await supabase.from('staff').select('*').or('assigned_section.eq.secondary,assigned_section.eq.all').neq('role', 'proprietor').order('full_name');
    if (staff) setStaffList(staff);
    const { data: students } = await supabase.from('students').select('*, class:classes(name)').eq('section', 'secondary').order('full_name');
    if (students) setStudentList(students);
    const { data: results } = await supabase.from('academic_results').select(`*, student:students!inner(full_name, section, class:classes(name)), subject:subjects(name)`).eq('is_approved', false).eq('student.section', 'secondary'); 
    if (results) setPendingResults(results);
    setStats({ students: sCount || 0, staff: staff?.length || 0, pendingResults: results?.length || 0 });

    // 2. Fetch Secondary Classes for Promotion Dropdowns
    const { data: classes } = await supabase.from('classes').select('*').eq('section', 'secondary').order('name');
    if (classes) setClassList(classes);

    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('academic_results').update({ is_approved: true }).eq('id', id);
    if (!error) {
      toast({ title: "Approved", description: "Result is now published." });
      setPendingResults(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, pendingResults: prev.pendingResults - 1 }));
    }
  };

  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    setLoading(true);
    try {
        const fileExt = myPassport.name.split('.').pop();
        const fileName = `principal_${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('passports').upload(fileName, myPassport);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('staff').update({ passport_url: data.publicUrl }).eq('id', user.id);
        if (dbError) throw dbError;
        toast({ title: "Success", description: "Passport Updated" });
        const updatedUser = { ...user, passport_url: data.publicUrl };
        setUser(updatedUser);
        localStorage.setItem("staffData", JSON.stringify(updatedUser));
    } catch (error: any) { toast({ variant: "destructive", title: "Upload Failed", description: error.message }); } finally { setLoading(false); }
  };

   // --- PROMOTION HANDLERS ---
   const fetchStudentsForPromotion = async (sourceClassId: string) => {
    setLoading(true);
    // Ensure we only fetch active students in the selected secondary class
    const { data } = await supabase.from('students').select('id, full_name, admission_number').eq('class_id', sourceClassId).eq('is_active', true).eq('section', 'secondary').order('full_name');
    setStudentsToPromoteList(data || []);
    setSelectedForPromotion(data ? data.map(s => s.id) : []); // Select all by default
    setLoading(false);
  };

  const handleExecutePromotion = async () => {
    if (!promoteSourceClass || !promoteTargetClass || selectedForPromotion.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "Select source, target, and at least one student." }); return;
    }
    setLoading(true);
    // We don't need to fetch targetClassData for section, as the dropdown only contains secondary classes anyway.
    const { error } = await supabase.from('students').update({ class_id: promoteTargetClass }).in('id', selectedForPromotion);
    
    setLoading(false);
    if (error) toast({ variant: "destructive", title: "Promotion Failed", description: error.message });
    else { 
        toast({ title: "Success", description: `${selectedForPromotion.length} students promoted successfully.` });
        // Reset UI & Refresh Data
        setPromoteSourceClass(""); setPromoteTargetClass(""); setStudentsToPromoteList([]); setSelectedForPromotion([]);
        loadData(); 
    }
  };

  if (!user) return null;

  const StaffCard = ({ s }: { s: any }) => (<Card className="mb-4 shadow-sm border-l-4 border-l-blue-500"><CardContent className="pt-6"><div className="flex items-start gap-4"><Avatar className="w-14 h-14"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div className="flex-1 overflow-hidden"><h3 className="font-bold text-base truncate">{s.full_name}</h3><Badge variant="secondary" className="mb-2 capitalize text-xs">{s.role.replace('_', ' ')}</Badge><div className="text-xs text-gray-600 space-y-1"><div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {s.phone_number || 'N/A'}</div><div className="flex items-center gap-2"><Mail className="w-3 h-3"/> {s.email}</div></div></div></div></CardContent></Card>);
  const StudentCard = ({ s }: { s: any }) => (<Card className="mb-4 shadow-sm border-l-4 border-l-indigo-500"><CardContent className="pt-6"><div className="flex items-start gap-4"><Avatar className="w-14 h-14"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div className="flex-1 overflow-hidden"><h3 className="font-bold text-base truncate">{s.full_name}</h3><div className="flex gap-2 mb-2"><Badge variant="outline" className="text-xs">{s.class?.name}</Badge><span className="text-xs text-gray-400 self-center">{s.admission_number}</span></div><div className="bg-blue-50 p-2 rounded flex justify-between items-center"><span className="text-xs text-blue-600 font-bold">LOGIN PIN</span><span className="font-mono font-bold text-blue-800 tracking-widest">{s.pin_code}</span></div><div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3"/> Parent: {s.emergency_contact}</div></div></div></CardContent></Card>);
  const ResultCard = ({ r }: { r: any }) => (<Card className="mb-3 border border-orange-200 shadow-sm"><CardContent className="p-4"><div className="flex justify-between items-start mb-2"><div><div className="font-bold text-sm">{r.student?.full_name}</div><div className="text-xs text-gray-500">{r.student?.class?.name}</div></div><Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{r.subject?.name}</Badge></div><div className="flex justify-between items-center bg-gray-50 p-2 rounded mb-3"><div className="text-xs"><span className="block text-gray-400">CA / Exam</span><span className="font-medium">{r.ca_score} / {r.exam_score}</span></div><div className="text-right"><span className="block text-xs text-gray-400">Total</span><span className="font-bold text-lg">{r.total_score} <span className={`text-xs ml-1 ${r.grade === 'F' ? 'text-red-500' : 'text-green-500'}`}>{r.grade}</span></span></div></div><Button onClick={() => handleApprove(r.id)} size="sm" className="w-full bg-green-600 hover:bg-green-700 h-9"><CheckCircle className="w-4 h-4 mr-2"/> Approve Result</Button></CardContent></Card>);

  return (
    <div className="flex h-screen bg-blue-50 font-sans overflow-hidden">
      {isSidebarOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />)}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-xl`}>
        <div className="p-6 flex flex-col items-center border-b border-blue-800 relative">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 md:hidden text-blue-300" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5"/></Button>
          <Avatar className="w-20 h-20 border-4 border-blue-400 shadow-lg mb-3"><AvatarImage src={user.passport_url} /><AvatarFallback>PR</AvatarFallback></Avatar>
          <div className="text-center"><h2 className="font-bold text-lg truncate w-48">{user.full_name}</h2><Badge variant="secondary" className="mt-1 bg-blue-700 text-blue-100 hover:bg-blue-600">Principal</Badge></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[{ id: 'overview', label: 'Dashboard', icon: ShieldCheck }, { id: 'promotion', label: 'Promotion', icon: ArrowRightCircle }, { id: 'staff', label: 'Secondary Staff', icon: Users }, { id: 'students', label: 'Secondary Students', icon: GraduationCap }, { id: 'results', label: 'Approve Results', icon: FileCheck }, { id: 'profile', label: 'My Profile', icon: Users }].map((item) => (
            <Button key={item.id} variant="ghost" onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full justify-start py-6 text-base ${activeTab === item.id ? 'bg-blue-800 text-white shadow-md' : 'text-blue-100 hover:bg-blue-800/50'}`}>
              <item.icon className="w-5 h-5 mr-3" />{item.label}
            </Button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800"><Button variant="destructive" className="w-full" onClick={() => navigate('/login')}><LogOut className="w-4 h-4 mr-2" /> Logout</Button></div>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6 text-blue-900" /></Button><h1 className="text-lg md:text-xl font-bold text-blue-900 capitalize truncate">{activeTab.replace('_', ' ')}</h1></div>
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2"><Search className="w-4 h-4 text-gray-500 mr-2" /><input placeholder="Search..." className="bg-transparent border-none focus:outline-none text-sm w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 pb-24">
          {activeTab === 'overview' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg"><CardHeader className="pb-2"><CardTitle className="text-sm opacity-90">Secondary Students</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">{stats.students}</div></CardContent></Card><Card className="bg-white border-l-4 border-blue-600 shadow-md"><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Staff Count</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold text-blue-900">{stats.staff}</div></CardContent></Card><Card className="bg-white border-l-4 border-orange-500 shadow-md"><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Pending Results</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold text-orange-600">{stats.pendingResults}</div>{stats.pendingResults > 0 && <Button variant="link" onClick={() => setActiveTab('results')} className="px-0 h-auto text-orange-600">Review Now &rarr;</Button>}</CardContent></Card></div>)}
          
          {/* --- NEW PROMOTION TAB (SECONDARY ONLY) --- */}
          {activeTab === 'promotion' && (
            <Card className="max-w-4xl mx-auto border-t-4 border-t-blue-800 shadow-lg">
                <CardHeader>
                    <CardTitle>Secondary Section Promotion</CardTitle>
                    <CardDescription>Move students to their next class. Only Secondary classes are available here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="space-y-2">
                            <Label>1. Current Class (Source)</Label>
                            <Select onValueChange={(v) => { setPromoteSourceClass(v); fetchStudentsForPromotion(v); }}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>{classList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>2. Next Session Class (Target)</Label>
                            <Select onValueChange={setPromoteTargetClass} disabled={!promoteSourceClass}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>{classList.filter(c => c.id !== promoteSourceClass).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    {studentsToPromoteList.length > 0 && (
                        <div className="border rounded-md overflow-hidden">
                            <div className="bg-blue-100 p-3 flex justify-between items-center border-b border-blue-200">
                                <h3 className="font-bold text-blue-900">3. Select Students ({selectedForPromotion.length}/{studentsToPromoteList.length})</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedForPromotion(studentsToPromoteList.map(s => s.id))} className="border-blue-300 text-blue-700 hover:bg-blue-50">Select All</Button>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedForPromotion([])} className="border-blue-300 text-blue-700 hover:bg-blue-50">Deselect All</Button>
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Student Name</TableHead><TableHead>Admission No.</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {studentsToPromoteList.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell><Checkbox checked={selectedForPromotion.includes(s.id)} onCheckedChange={(checked) => { if (checked) setSelectedForPromotion([...selectedForPromotion, s.id]); else setSelectedForPromotion(selectedForPromotion.filter(id => id !== s.id)); }}/></TableCell>
                                                <TableCell className="font-medium">{s.full_name}</TableCell>
                                                <TableCell>{s.admission_number}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full py-6 text-lg bg-blue-800 hover:bg-blue-900 font-bold shadow-md" disabled={selectedForPromotion.length === 0 || !promoteTargetClass || loading}>
                                {loading ? <Loader2 className="animate-spin mr-2" /> : `Promote ${selectedForPromotion.length} Students`}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Confirm Promotion</AlertDialogTitle><AlertDialogDescription>Are you sure you want to move {selectedForPromotion.length} students to the new class?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleExecutePromotion} className="bg-blue-800">Yes, Promote Them</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
          )}
          
          {activeTab === 'staff' && (<div><div className="mb-4 md:hidden"><Input placeholder="Search staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white" /></div><div className="md:hidden">{staffList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <StaffCard key={s.id} s={s} />)}</div><Card className="hidden md:block shadow-md"><CardHeader><CardTitle>Secondary School Staff</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Passport</TableHead><TableHead>Full Name</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead></TableRow></TableHeader><TableBody>{staffList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((s) => (<TableRow key={s.id}><TableCell><Avatar className="w-10 h-10"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar></TableCell><TableCell className="font-medium">{s.full_name}</TableCell><TableCell><Badge variant="outline" className="capitalize">{s.role.replace('_', ' ')}</Badge></TableCell><TableCell>{s.phone_number || '-'}</TableCell><TableCell>{s.email}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>)}
          {activeTab === 'students' && (<div><div className="mb-4 md:hidden"><Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white" /></div><div className="md:hidden">{studentList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <StudentCard key={s.id} s={s} />)}</div><Card className="hidden md:block shadow-md"><CardHeader><CardTitle>Secondary School Students</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Passport</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>ID</TableHead><TableHead className="text-blue-600 font-bold">PIN</TableHead><TableHead>Parent Phone</TableHead></TableRow></TableHeader><TableBody>{studentList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((s) => (<TableRow key={s.id}><TableCell><Avatar className="w-10 h-10"><AvatarImage src={s.passport_url} /></Avatar></TableCell><TableCell className="font-bold text-blue-900">{s.full_name}</TableCell><TableCell><Badge variant="secondary">{s.class?.name}</Badge></TableCell><TableCell>{s.admission_number}</TableCell><TableCell className="font-mono text-lg font-bold text-blue-600">{s.pin_code}</TableCell><TableCell>{s.emergency_contact}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>)}
          {activeTab === 'results' && (<div><div className="md:hidden">{pendingResults.length === 0 ? <div className="text-center py-10 text-gray-400">No Pending Results</div> : pendingResults.map(r => <ResultCard key={r.id} r={r} />)}</div><Card className="hidden md:block shadow-md"><CardHeader><CardTitle>Pending Result Approvals</CardTitle></CardHeader><CardContent>{pendingResults.length === 0 ? <div className="text-center py-12 text-gray-500">No results awaiting approval.</div> : (<Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead>Scores</TableHead><TableHead>Total</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{pendingResults.map((r) => (<TableRow key={r.id}><TableCell className="font-medium"><div>{r.student?.full_name}</div><div className="text-xs text-gray-500">{r.student?.class?.name}</div></TableCell><TableCell>{r.subject?.name}</TableCell><TableCell>{r.ca_score} / {r.exam_score}</TableCell><TableCell><span className="font-bold">{r.total_score}</span> <Badge className={`ml-2 ${r.grade === 'F' ? 'bg-red-500' : 'bg-green-600'}`}>{r.grade}</Badge></TableCell><TableCell><Button size="sm" onClick={() => handleApprove(r.id)} className="bg-green-600 hover:bg-green-700">Approve</Button></TableCell></TableRow>))}</TableBody></Table>)}</CardContent></Card></div>)}
          {activeTab === 'profile' && (<div className="flex justify-center"><Card className="w-full max-w-md shadow-lg"><CardHeader className="text-center border-b bg-gray-50"><CardTitle>Principal Profile</CardTitle></CardHeader><CardContent className="pt-8 space-y-6"><div className="flex flex-col items-center"><div className="relative mb-4"><Avatar className="w-32 h-32 border-4 border-white shadow-xl"><AvatarImage src={user.passport_url} /><AvatarFallback className="text-4xl bg-blue-100 text-blue-600">{user.full_name[0]}</AvatarFallback></Avatar><label htmlFor="passport-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm"><Upload className="w-4 h-4" /></label><input id="passport-upload" type="file" className="hidden" onChange={(e) => e.target.files && setMyPassport(e.target.files[0])} /></div>{myPassport && <Button onClick={handleProfileUpdate} disabled={loading} size="sm" className="mb-4">{loading ? <Loader2 className="animate-spin" /> : "Save New Photo"}</Button>}<h2 className="text-2xl font-bold text-gray-800">{user.full_name}</h2><p className="text-blue-600 font-medium">Principal</p></div><div className="bg-gray-50 p-4 rounded-lg space-y-3"><div><Label className="text-xs text-gray-500">EMAIL</Label><div className="font-medium">{user.email}</div></div><div><Label className="text-xs text-gray-500">PHONE</Label><div className="font-medium">{user.phone_number || "Not set"}</div></div></div></CardContent></Card></div>)}
        </div>
      </main>
    </div>
  );
};

export default PrincipalDashboard;