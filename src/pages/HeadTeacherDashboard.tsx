import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, FileCheck, LogOut, Menu, Upload, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const HeadTeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [myPassport, setMyPassport] = useState<File | null>(null);

  // Data
  const [stats, setStats] = useState({ students: 0, pendingResults: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [pendingResults, setPendingResults] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    setUser(JSON.parse(data));
    loadPrimaryData();
  }, []);

  const loadPrimaryData = async () => {
    // Stats (Nursery + Primary)
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).in('section', ['primary', 'nursery']);
    setStats(prev => ({ ...prev, students: sCount || 0 }));

    // Primary Staff 
    const { data: staff } = await supabase.from('staff')
        .select('*')
        .or('assigned_section.eq.primary,assigned_section.eq.nursery,assigned_section.eq.all')
        .order('full_name');
    if (staff) setStaffList(staff);

    // Primary Students
    const { data: students } = await supabase.from('students')
        .select('*, class:classes(name)')
        .in('section', ['primary', 'nursery'])
        .order('full_name');
    if (students) setStudentList(students);

    // Pending Results
    const { data: results } = await supabase.from('academic_results')
        .select(`*, student:students(full_name, section, class:classes(name)), subject:subjects(name)`)
        .eq('is_approved', false);
    
    // Filter
    const priResults = results?.filter((r: any) => ['primary', 'nursery'].includes(r.student?.section)) || [];
    setPendingResults(priResults);
    setStats(prev => ({ ...prev, pendingResults: priResults.length }));
  };

  const handleApprove = async (id: string) => {
    await supabase.from('academic_results').update({ is_approved: true }).eq('id', id);
    toast({ title: "Approved", description: "Result Published" });
    setPendingResults(prev => prev.filter(r => r.id !== id));
  };

  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    const fileName = `headteacher_${Date.now()}`;
    await supabase.storage.from('passports').upload(fileName, myPassport);
    const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
    await supabase.from('staff').update({ passport_url: data.publicUrl }).eq('id', user.id);
    toast({ title: "Success", description: "Passport Updated" });
    setUser({ ...user, passport_url: data.publicUrl });
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-green-50 font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-green-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex flex-col items-center border-b border-green-800">
           <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-white"><AvatarImage src={user.passport_url} /><AvatarFallback>HT</AvatarFallback></Avatar>
           {isSidebarOpen && <div className="font-bold">{user.full_name}</div>}
           {isSidebarOpen && <div className="text-xs opacity-70">Head Teacher</div>}
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {[
                { id: 'overview', icon: BarChart3, label: 'Overview' },
                { id: 'staff_list', icon: Users, label: 'Primary/Nursery Staff' },
                { id: 'student_list', icon: GraduationCap, label: 'Primary/Nursery Students' },
                { id: 'results', icon: FileCheck, label: 'Approve Results' },
                { id: 'profile', icon: Users, label: 'My Profile' }
            ].map(item => (
                <Button 
                    key={item.id} 
                    variant="ghost" 
                    className={`w-full justify-start hover:bg-green-800 ${activeTab === item.id ? 'bg-green-800' : ''}`} 
                    onClick={() => setActiveTab(item.id)}
                >
                    <item.icon className="mr-2 h-4 w-4" /> {isSidebarOpen && item.label}
                </Button>
            ))}
        </nav>
        <div className="p-4"><Button variant="destructive" className="w-full" onClick={() => navigate('/login')}><LogOut className="mr-2 h-4 w-4 " /> Logout</Button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></Button>
            <h1 className="text-xl font-bold capitalize text-green-900">{activeTab.replace('_', ' ')}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card><CardHeader><CardTitle>Total Students</CardTitle></CardHeader><CardContent className="text-4xl font-bold">{stats.students}</CardContent></Card>
              <Card><CardHeader><CardTitle>Pending Results</CardTitle></CardHeader><CardContent className="text-4xl font-bold text-orange-600">{stats.pendingResults}</CardContent></Card>
            </div>
          )}

          {activeTab === 'staff_list' && (
            <Card>
                <CardHeader><CardTitle>Primary & Nursery Staff</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Password</TableHead></TableRow></TableHeader>
                        <TableBody>{staffList.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-bold flex items-center gap-2">
                                    <Avatar className="w-8 h-8"><AvatarImage src={s.passport_url} /></Avatar> {s.full_name}
                                </TableCell>
                                <TableCell className="capitalize">{s.role.replace('_', ' ')}</TableCell>
                                <TableCell>{s.phone_number}</TableCell>
                                <TableCell>{s.email}</TableCell>
                                <TableCell className="font-mono text-xs">{s.password}</TableCell>
                            </TableRow>
                        ))}</TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

          {activeTab === 'student_list' && (
            <Card>
                <CardHeader><CardTitle>Primary & Nursery Students</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Admission No</TableHead><TableHead>PIN</TableHead><TableHead>Parent Phone</TableHead></TableRow></TableHeader>
                        <TableBody>{studentList.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-bold flex items-center gap-2">
                                    <Avatar className="w-8 h-8"><AvatarImage src={s.passport_url} /></Avatar> {s.full_name}
                                </TableCell>
                                <TableCell>{s.class?.name}</TableCell>
                                <TableCell>{s.admission_number}</TableCell>
                                <TableCell className="font-mono font-bold text-blue-600">{s.pin_code}</TableCell>
                                <TableCell>{s.emergency_contact}</TableCell>
                            </TableRow>
                        ))}</TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

          {activeTab === 'results' && (
             <Card>
                <CardHeader><CardTitle>Results Awaiting Approval</CardTitle></CardHeader>
                <CardContent>
                    {pendingResults.length === 0 ? <p className="text-muted-foreground">All clear!</p> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Subject</TableHead><TableHead>Score</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                            <TableBody>{pendingResults.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.student?.full_name} ({r.student?.class?.name})</TableCell>
                                    <TableCell>{r.subject?.name}</TableCell>
                                    <TableCell>{r.total_score} <Badge className={r.grade === 'F' ? 'bg-red-500' : 'bg-green-600'}>{r.grade}</Badge></TableCell>
                                    <TableCell><Button size="sm" onClick={() => handleApprove(r.id)}>Approve</Button></TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table>
                    )}
                </CardContent>
             </Card>
          )}

          {activeTab === 'profile' && (
            <Card className="max-w-md mx-auto">
                <CardHeader><CardTitle>Head Teacher Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-center">
                    <Avatar className="w-32 h-32 mx-auto"><AvatarImage src={user.passport_url} /></Avatar>
                    <Input type="file" onChange={e => e.target.files && setMyPassport(e.target.files[0])} />
                    <Button onClick={handleProfileUpdate}><Upload className="w-4 h-4 mr-2"/> Update Passport</Button>
                </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default HeadTeacherDashboard;