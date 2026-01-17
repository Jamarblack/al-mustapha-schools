import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  Users, GraduationCap, FileCheck, LogOut, Menu, 
  Upload, Search, ShieldCheck 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, staff, students, results, profile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [myPassport, setMyPassport] = useState<File | null>(null);

  // Data
  const [stats, setStats] = useState({ students: 0, staff: 0, pendingResults: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [pendingResults, setPendingResults] = useState<any[]>([]);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    const parsedUser = JSON.parse(data);
    setUser(parsedUser);
    
    // Security Check: Kick out if not Principal
    if (parsedUser.role !== 'principal') {
      navigate('/login'); 
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // 1. STATS (Secondary Only)
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('section', 'secondary');
    
    // 2. STAFF LIST (Secondary + Admin)
    const { data: staff } = await supabase.from('staff')
      .select('*')
      .or('assigned_section.eq.secondary,assigned_section.eq.all')
      .neq('role', 'proprietor') // Don't show the boss
      .order('full_name');
    if (staff) setStaffList(staff);

    // 3. STUDENTS LIST (Secondary Only)
    const { data: students } = await supabase.from('students')
      .select('*, class:classes(name)')
      .eq('section', 'secondary')
      .order('full_name');
    if (students) setStudentList(students);

    // 4. PENDING RESULTS (Secondary Only)
    const { data: results } = await supabase.from('academic_results')
      .select(`*, student:students!inner(full_name, section, class:classes(name)), subject:subjects(name)`)
      .eq('is_approved', false)
      .eq('student.section', 'secondary'); // Strict Filter

    if (results) setPendingResults(results);

    setStats({ 
      students: sCount || 0, 
      staff: staff?.length || 0, 
      pendingResults: results?.length || 0 
    });
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
    const fileName = `principal_${Date.now()}`;
    await supabase.storage.from('passports').upload(fileName, myPassport);
    const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
    await supabase.from('staff').update({ passport_url: data.publicUrl }).eq('id', user.id);
    
    setUser({ ...user, passport_url: data.publicUrl });
    localStorage.setItem("staffData", JSON.stringify({ ...user, passport_url: data.publicUrl }));
    toast({ title: "Success", description: "Profile photo updated." });
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-blue-50 font-sans">
      
      {/* SIDEBAR (BLUE THEME) */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-yellow-100 text-green-500 transition-all duration-300 flex flex-col shadow-xl`}>
        <div className="p-6 flex flex-col items-center border-b border-green-800">
          <Avatar className="w-20 h-20 border-4 border-green-400 shadow-lg mb-3">
            <AvatarImage src={user.passport_url} />
            <AvatarFallback>PR</AvatarFallback>
          </Avatar>
          {isSidebarOpen && (
            <div className="text-center animate-in fade-in">
              <h2 className="font-bold text-lg">{user.full_name}</h2>
              <Badge variant="secondary" className="mt-1 bg-blue-950 text-green-500 hover:bg-blue-950">Principal</Badge>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: ShieldCheck },
            { id: 'staff', label: 'Secondary Staff', icon: Users },
            { id: 'students', label: 'Secondary Students', icon: GraduationCap },
            { id: 'results', label: 'Approve Results', icon: FileCheck },
            { id: 'profile', label: 'My Profile', icon: Users },
          ].map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActiveTab(item.id)}
              className={`w-full justify-start py-6 text-base ${activeTab === item.id ? 'bg-blue-950 text-green-600 shadow-md' : 'text-green-500 hover:bg-blue-950/10'}`}
            >
              <item.icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {isSidebarOpen && item.label}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <Button variant="destructive" className="w-full" onClick={() => navigate('/login')}>
            <LogOut className="w-4 h-4 mr-2" /> {isSidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></Button>
            <h1 className="text-xl font-bold text-blue-900 capitalize">{activeTab.replace('_', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input 
                placeholder="Search records..." 
                className="bg-transparent border-none focus:outline-none text-sm w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          
          {/* VIEW: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg">
                <CardHeader className="pb-2"><CardTitle className="text-sm opacity-90">Secondary Students</CardTitle></CardHeader>
                <CardContent><div className="text-4xl font-bold">{stats.students}</div></CardContent>
              </Card>
              <Card className="bg-white border-l-4 border-blue-600 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Staff Count</CardTitle></CardHeader>
                <CardContent><div className="text-4xl font-bold text-blue-900">{stats.staff}</div></CardContent>
              </Card>
              <Card className="bg-white border-l-4 border-orange-500 shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Pending Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-orange-600">{stats.pendingResults}</div>
                  <Button variant="link" onClick={() => setActiveTab('results')} className="px-0 h-auto text-orange-600">Review Now &rarr;</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* VIEW: STAFF LIST (Secondary) */}
          {activeTab === 'staff' && (
            <Card className="shadow-md">
              <CardHeader><CardTitle>Secondary School Staff</CardTitle><CardDescription>Teachers and administrators in the secondary section.</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Passport</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-red-500 font-bold">Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList
                      .filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Avatar className="w-10 h-10 border border-gray-200">
                            <AvatarImage src={s.passport_url} />
                            <AvatarFallback>{s.full_name[0]}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{s.role.replace('_', ' ')}</Badge></TableCell>
                        <TableCell>{s.phone_number || '-'}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell className="font-mono text-xs text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                          {s.password}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* VIEW: STUDENTS LIST (Secondary) */}
          {activeTab === 'students' && (
            <Card className="shadow-md">
              <CardHeader><CardTitle>Secondary School Students</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Passport</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead className="text-blue-600 font-bold">Login PIN</TableHead>
                      <TableHead>Parent Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentList
                      .filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Avatar className="w-10 h-10 border border-gray-200">
                            <AvatarImage src={s.passport_url} />
                            <AvatarFallback>{s.full_name[0]}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-bold text-blue-900">{s.full_name}</TableCell>
                        <TableCell><Badge variant="secondary">{s.class?.name}</Badge></TableCell>
                        <TableCell>{s.admission_number}</TableCell>
                        <TableCell className="font-mono text-lg font-bold text-blue-600 tracking-wider">
                          {s.pin_code}
                        </TableCell>
                        <TableCell>{s.emergency_contact}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* VIEW: RESULTS APPROVAL */}
          {activeTab === 'results' && (
            <Card className="shadow-md">
              <CardHeader><CardTitle>Pending Result Approvals</CardTitle></CardHeader>
              <CardContent>
                {pendingResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                    <FileCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No results awaiting approval.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Scores (CA/Exam)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.student?.full_name}</TableCell>
                          <TableCell>{r.student?.class?.name}</TableCell>
                          <TableCell>{r.subject?.name}</TableCell>
                          <TableCell>{r.ca_score} / {r.exam_score}</TableCell>
                          <TableCell>
                            <span className="font-bold">{r.total_score}</span> 
                            <Badge className={`ml-2 ${r.grade === 'F' ? 'bg-red-500' : 'bg-green-600'}`}>
                              {r.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => handleApprove(r.id)} className="bg-green-600 hover:bg-green-700">
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* VIEW: PROFILE */}
          {activeTab === 'profile' && (
            <div className="flex justify-center">
              <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center border-b bg-gray-50">
                  <CardTitle>My Profile</CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                        <AvatarImage src={user.passport_url} />
                        <AvatarFallback className="text-4xl bg-blue-100 text-blue-600">
                          {user.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0">
                        <Input 
                          type="file" 
                          id="passport-upload" 
                          className="hidden" 
                          onChange={(e) => e.target.files && setMyPassport(e.target.files[0])} 
                        />
                        <label htmlFor="passport-upload" className="bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm flex">
                           <Upload className="w-4 h-4" />
                        </label>
                      </div>
                    </div>
                    {myPassport && (
                      <Button onClick={handleProfileUpdate} disabled={loading} size="sm" className="mb-4">
                        {loading ? "Uploading..." : "Save New Photo"}
                      </Button>
                    )}
                    <h2 className="text-2xl font-bold text-gray-800">{user.full_name}</h2>
                    <p className="text-blue-600 font-medium">Principal</p>
                  </div>
                  
                  <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium">{user.phone_number || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Section</span>
                      <span className="font-medium capitalize">Secondary</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PrincipalDashboard;