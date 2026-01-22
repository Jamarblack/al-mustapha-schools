import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, FileCheck, LogOut, Menu, Upload, Search, BarChart3, X, Phone, Mail, CheckCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HeadTeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myPassport, setMyPassport] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ students: 0, pendingResults: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [pendingResults, setPendingResults] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    const parsedUser = JSON.parse(data);
    setUser(parsedUser);
    if (parsedUser.role !== 'head_teacher') { navigate('/login'); return; }
    loadPrimaryData();
  }, []);

  const loadPrimaryData = async () => {
    setLoading(true);
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).in('section', ['primary', 'nursery']);
    const { data: staff } = await supabase.from('staff').select('*').or('assigned_section.eq.primary,assigned_section.eq.nursery,assigned_section.eq.all').neq('role', 'proprietor').order('full_name');
    if (staff) setStaffList(staff);
    const { data: students } = await supabase.from('students').select('*, class:classes(name)').in('section', ['primary', 'nursery']).order('full_name');
    if (students) setStudentList(students);
    const { data: results } = await supabase.from('academic_results').select(`*, student:students!inner(full_name, section, class:classes(name)), subject:subjects(name)`).eq('is_approved', false).in('student.section', ['primary', 'nursery']);
    if (results) setPendingResults(results);
    setStats({ students: sCount || 0, pendingResults: results?.length || 0 });
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('academic_results').update({ is_approved: true }).eq('id', id);
    if (!error) {
        toast({ title: "Approved", description: "Result Published" });
        setPendingResults(prev => prev.filter(r => r.id !== id));
        setStats(prev => ({ ...prev, pendingResults: prev.pendingResults - 1 }));
    }
  };

  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    setLoading(true);
    try {
        const fileExt = myPassport.name.split('.').pop();
        const fileName = `headteacher_${user.id}_${Date.now()}.${fileExt}`;
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

  if (!user) return null;

  const StaffCard = ({ s }: { s: any }) => (<Card className="mb-4 shadow-sm border-l-4 border-l-green-600"><CardContent className="pt-6"><div className="flex items-start gap-4"><Avatar className="w-14 h-14"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div className="flex-1 overflow-hidden"><h3 className="font-bold text-base truncate">{s.full_name}</h3><Badge variant="outline" className="mb-2 capitalize text-xs text-green-700 border-green-200 bg-green-50">{s.role.replace('_', ' ')}</Badge><div className="text-xs text-gray-600 space-y-1"><div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {s.phone_number || 'N/A'}</div></div></div></div></CardContent></Card>);
  const StudentCard = ({ s }: { s: any }) => (<Card className="mb-4 shadow-sm border-l-4 border-l-teal-500"><CardContent className="pt-6"><div className="flex items-start gap-4"><Avatar className="w-14 h-14"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div className="flex-1 overflow-hidden"><h3 className="font-bold text-base truncate">{s.full_name}</h3><div className="flex gap-2 mb-2"><Badge variant="secondary" className="text-xs">{s.class?.name}</Badge><span className="text-xs text-gray-400 self-center">{s.admission_number}</span></div><div className="bg-green-50 p-2 rounded flex justify-between items-center"><span className="text-xs text-green-700 font-bold">LOGIN PIN</span><span className="font-mono font-bold text-green-900 tracking-widest">{s.pin_code}</span></div><div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3"/> Parent: {s.emergency_contact}</div></div></div></CardContent></Card>);
  const ResultCard = ({ r }: { r: any }) => (<Card className="mb-3 border border-orange-200 shadow-sm"><CardContent className="p-4"><div className="flex justify-between items-start mb-2"><div><div className="font-bold text-sm">{r.student?.full_name}</div><div className="text-xs text-gray-500">{r.student?.class?.name}</div></div><Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{r.subject?.name}</Badge></div><div className="flex justify-between items-center bg-gray-50 p-2 rounded mb-3"><div className="text-xs"><span className="block text-gray-400">CA / Exam</span><span className="font-medium">{r.ca_score} / {r.exam_score}</span></div><div className="text-right"><span className="block text-xs text-gray-400">Total</span><span className="font-bold text-lg">{r.total_score} <span className={`text-xs ml-1 ${r.grade === 'F' ? 'text-red-500' : 'text-green-500'}`}>{r.grade}</span></span></div></div><Button onClick={() => handleApprove(r.id)} size="sm" className="w-full bg-green-600 hover:bg-green-700 h-9"><CheckCircle className="w-4 h-4 mr-2"/> Approve Result</Button></CardContent></Card>);

  return (
    <div className="flex h-screen bg-green-50 font-sans overflow-hidden">
      {isSidebarOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />)}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-xl`}>
        <div className="p-6 flex flex-col items-center border-b border-green-800 relative">
           <Button variant="ghost" size="icon" className="absolute right-2 top-2 md:hidden text-green-300" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5"/></Button>
           <Avatar className="w-20 h-20 border-4 border-white shadow-lg mb-3"><AvatarImage src={user.passport_url} /><AvatarFallback>HT</AvatarFallback></Avatar>
           <div className="text-center"><h2 className="font-bold text-lg truncate w-48">{user.full_name}</h2><Badge variant="secondary" className="mt-1 bg-green-700 text-green-100 hover:bg-green-600">Head Teacher</Badge></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[{ id: 'overview', icon: BarChart3, label: 'Overview' }, { id: 'staff_list', icon: Users, label: 'Pri/Nur Staff' }, { id: 'student_list', icon: GraduationCap, label: 'Pri/Nur Students' }, { id: 'results', icon: FileCheck, label: 'Approve Results' }, { id: 'profile', icon: Users, label: 'My Profile' }].map(item => (
                <Button key={item.id} variant="ghost" className={`w-full justify-start py-6 text-base ${activeTab === item.id ? 'bg-green-800 text-white shadow-md' : 'text-green-100 hover:bg-green-800/50'}`} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}>
                    <item.icon className="mr-3 h-5 w-5" /> {item.label}
                </Button>
            ))}
        </nav>
        <div className="p-4 border-t border-green-800"><Button variant="destructive" className="w-full" onClick={() => navigate('/login')}><LogOut className="mr-2 h-4 w-4" /> Logout</Button></div>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden text-green-900" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></Button><h1 className="text-lg md:text-xl font-bold capitalize text-green-900 truncate">{activeTab.replace('_', ' ')}</h1></div>
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2"><Search className="w-4 h-4 text-gray-500 mr-2" /><input placeholder="Search records..." className="bg-transparent border-none focus:outline-none text-sm w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 pb-24">
          {activeTab === 'overview' && 
          (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-600 text-white border-none shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm opacity-90">Total Students</CardTitle>
                </CardHeader><CardContent className="text-4xl font-bold">{stats.students}</CardContent></Card>
                <Card className="bg-white border-l-4 border-orange-500 shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Pending Results</CardTitle>
                    </CardHeader><CardContent>
                        <div className="text-4xl font-bold text-orange-600">{stats.pendingResults}</div>{stats.pendingResults > 0 && <Button variant="link" onClick={() => setActiveTab('results')} className="px-0 h-auto text-orange-600">Review Now &rarr;</Button>}
                        </CardContent></Card></div>)}
          {activeTab === 'staff_list' && (<div><div className="mb-4 md:hidden"><Input placeholder="Search staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white" /></div><div className="md:hidden">{staffList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <StaffCard key={s.id} s={s} />)}</div><Card className="hidden md:block shadow-md"><CardHeader><CardTitle>Primary & Nursery Staff</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead></TableRow></TableHeader><TableBody>{staffList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (<TableRow key={s.id}><TableCell className="font-bold flex items-center gap-2"><Avatar className="w-8 h-8"><AvatarImage src={s.passport_url} /></Avatar> {s.full_name}</TableCell><TableCell className="capitalize"><Badge variant="outline">{s.role.replace('_', ' ')}</Badge></TableCell><TableCell>{s.phone_number}</TableCell><TableCell>{s.email}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>)}
          {activeTab === 'student_list' && (<div><div className="mb-4 md:hidden"><Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white" /></div><div className="md:hidden">{studentList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <StudentCard key={s.id} s={s} />)}</div><Card className="hidden md:block shadow-md"><CardHeader><CardTitle>Primary & Nursery Students</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>ID</TableHead><TableHead className="text-green-600 font-bold">PIN</TableHead><TableHead>Parent Phone</TableHead></TableRow></TableHeader><TableBody>{studentList.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (<TableRow key={s.id}><TableCell className="font-bold flex items-center gap-2"><Avatar className="w-8 h-8"><AvatarImage src={s.passport_url} /></Avatar> {s.full_name}</TableCell><TableCell>{s.class?.name}</TableCell><TableCell>{s.admission_number}</TableCell><TableCell className="font-mono font-bold text-green-600">{s.pin_code}</TableCell><TableCell>{s.emergency_contact}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>)}
          {activeTab === 'results' && (<div><div className="md:hidden">{pendingResults.length === 0 ? <div className="text-center py-10 text-gray-400">No Pending Results</div> : pendingResults.map(r => <ResultCard key={r.id} r={r} />)}</div><Card className="hidden md:block shadow-md"><CardHeader><CardTitle>Results Awaiting Approval</CardTitle></CardHeader><CardContent>{pendingResults.length === 0 ? <p className="text-muted-foreground text-center py-10">All clear! No results pending.</p> : (<Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead>Score</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{pendingResults.map(r => (<TableRow key={r.id}><TableCell><div>{r.student?.full_name}</div><div className="text-xs text-gray-500">{r.student?.class?.name}</div></TableCell><TableCell>{r.subject?.name}</TableCell><TableCell>{r.total_score} <Badge className={r.grade === 'F' ? 'bg-red-500' : 'bg-green-600'}>{r.grade}</Badge></TableCell><TableCell><Button size="sm" onClick={() => handleApprove(r.id)} className="bg-green-600 hover:bg-green-700">Approve</Button></TableCell></TableRow>))}</TableBody></Table>)}</CardContent></Card></div>)}
          {activeTab === 'profile' && (<div className="flex justify-center"><Card className="max-w-md w-full shadow-lg"><CardHeader className="text-center border-b bg-green-50"><CardTitle>Head Teacher Profile</CardTitle></CardHeader><CardContent className="space-y-6 pt-8 text-center"><div className="relative inline-block"><Avatar className="w-32 h-32 mx-auto border-4 border-white shadow-lg"><AvatarImage src={user.passport_url} /><AvatarFallback>HT</AvatarFallback></Avatar><label htmlFor="upload" className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full cursor-pointer shadow-md"><Upload className="w-4 h-4" /></label><input id="upload" type="file" className="hidden" onChange={e => e.target.files && setMyPassport(e.target.files[0])} /></div>{myPassport && <Button onClick={handleProfileUpdate} disabled={loading} className="w-full bg-green-700 hover:bg-green-800">{loading ? <Loader2 className="animate-spin" /> : "Save New Photo"}</Button>}<div className="bg-green-50 p-4 rounded-lg text-left space-y-3"><div><Label className="text-xs text-gray-500">NAME</Label><div className="font-medium">{user.full_name}</div></div><div><Label className="text-xs text-gray-500">EMAIL</Label><div className="font-medium">{user.email}</div></div></div></CardContent></Card></div>)}
        </div>
      </main>
    </div>
  );
};

export default HeadTeacherDashboard;