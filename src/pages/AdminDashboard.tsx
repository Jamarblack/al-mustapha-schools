import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch"; 
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, School, LogOut, Plus, Loader2, Menu, Upload, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Data
  const [stats, setStats] = useState({ students: 0, staff: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);

  // Filters
  const [staffSectionFilter, setStaffSectionFilter] = useState("all");
  const [studentClassFilter, setStudentClassFilter] = useState("all");

  // Forms
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", role: "", section: "", phone: "" });
  // Removed admissionNo from state as it is now auto-generated
  const [newStudent, setNewStudent] = useState({ name: "", classId: "", parentPhone: "" });
  const [myPassport, setMyPassport] = useState<File | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    setUser(JSON.parse(data));
    loadAllData();
  }, []);

  const loadAllData = async () => {
    // Stats
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: tCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
    setStats({ students: sCount || 0, staff: tCount || 0 });

    // Lists
    const { data: staff } = await supabase.from('staff').select('*').order('role');
    if (staff) setStaffList(staff);

    const { data: students } = await supabase.from('students').select('*, class:classes(name)').order('full_name');
    if (students) setStudentList(students);

    const { data: classes } = await supabase.from('classes').select('*').order('name');
    if (classes) setClassList(classes);
  };

  // --- ACTIONS ---

  const handleRegisterStaff = async () => {
    setLoading(true);
    const { error } = await supabase.from('staff').insert({
      full_name: newStaff.name,
      email: newStaff.email,
      password: newStaff.password,
      role: newStaff.role,
      assigned_section: newStaff.section,
      phone_number: newStaff.phone
    });
    setLoading(false);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { 
        toast({ title: "Success", description: "Staff created." }); 
        loadAllData(); 
        setNewStaff({ name: "", email: "", password: "", role: "", section: "", phone: "" });
    }
  };

  const handleRegisterStudent = async () => {
    setLoading(true);
    
    // 1. Get Class Details
    const selectedClass = classList.find(c => c.id === newStudent.classId);
    if (!selectedClass) {
        toast({ variant: "destructive", title: "Error", description: "Please select a class first." });
        setLoading(false);
        return;
    }

    // 2. Generate Auto-Admission Number
    const rand = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const currentYear = new Date().getFullYear();
    let autoAdmissionNo = "";

    // Logic for Admission Number Prefix
    if (selectedClass.name.toUpperCase().includes('KG')) {
        autoAdmissionNo = `AMS/${currentYear}/${rand}`;
    } else if (selectedClass.section === 'nursery') {
        autoAdmissionNo = `AMS/NUR/${rand}`;
    } else if (selectedClass.section === 'primary') {
        autoAdmissionNo = `AMS/PRI/${rand}`;
    } else if (selectedClass.section === 'secondary') {
        if (selectedClass.name.toUpperCase().startsWith('JSS')) {
            autoAdmissionNo = `AMS/JSS/${rand}`;
        } else {
            // Assumes SSS or SS
            autoAdmissionNo = `AMS/SS/${rand}`;
        }
    } else {
        // Fallback
        autoAdmissionNo = `AMS/${rand}`;
    }

    // 3. Generate Login PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 4. Insert into Database
    const { error } = await supabase.from('students').insert({
      full_name: newStudent.name,
      admission_number: autoAdmissionNo, // Auto-filled
      class_id: newStudent.classId,
      section: selectedClass.section,
      pin_code: pin,
      emergency_contact: newStudent.parentPhone,
      is_active: true
    });

    setLoading(false);
    
    if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } else { 
        // Success Message showing the generated details
        toast({ 
            title: "Student Registered!", 
            description: `Admission No: ${autoAdmissionNo} | PIN: ${pin}` 
        }); 
        loadAllData();
        setNewStudent({ name: "", classId: "", parentPhone: "" });
    }
  };

  const toggleStudentStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
        toast({ title: "Updated", description: `Access ${!currentStatus ? 'Restored' : 'Revoked'}` });
        setStudentList(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    }
  };

  const handleDelete = async (table: 'staff' | 'students', id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: "Cannot delete. Remove related results first or check permissions." });
    } else {
        toast({ title: "Deleted", description: "Record removed permanently." });
        loadAllData();
    }
  };

  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    setLoading(true);

    try {
        const fileExt = myPassport.name.split('.').pop();
        const fileName = `proprietor_${user.id}_${Date.now()}.${fileExt}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage.from('passports').upload(fileName, myPassport);
        if (uploadError) throw uploadError;

        // 2. Get the Public URL
        const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
        
        // 3. Update the Database
        const { error: dbError } = await supabase.from('staff').update({ passport_url: data.publicUrl }).eq('id', user.id);
        if (dbError) throw dbError;

        toast({ title: "Success", description: "Passport Updated" });

        // 4. PREPARE NEW USER DATA
        const updatedUser = { ...user, passport_url: data.publicUrl };

        // 5. UPDATE STATE (Shows it now)
        setUser(updatedUser);

        // 6. CRITICAL: UPDATE LOCAL STORAGE (Keeps it after reload)
        localStorage.setItem("staffData", JSON.stringify(updatedUser));
        
    } catch (error: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  if (!user) return null;

  // Filter Logic
  const filteredStaff = staffSectionFilter === 'all' 
    ? staffList 
    : staffList.filter(s => s.assigned_section === staffSectionFilter || s.assigned_section === 'all');
  
  const filteredStudents = studentClassFilter === 'all'
    ? studentList
    : studentList.filter(s => s.class_id === studentClassFilter);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex flex-col items-center border-b border-slate-800">
          <div className="relative group">
            <Avatar className="w-20 h-20 border-2 border-gold mb-3">
                <AvatarImage src={user.passport_url} />
                <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
          {isSidebarOpen && (
            <div className="text-center">
                <h2 className="font-bold text-lg">Proprietor</h2>
                <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {['overview', 'registration', 'staff_list', 'student_list', 'profile'].map((view) => (
            <Button 
                key={view} 
                variant={activeTab === view ? "secondary" : "ghost"} 
                className={`w-full justify-start ${activeTab === view ? 'bg-gold text-slate-900' : 'text-slate-300'}`}
                onClick={() => setActiveTab(view)}
            >
                {view === 'overview' && <School className="mr-2 h-4 w-4" />}
                {view === 'registration' && <Plus className="mr-2 h-4 w-4" />}
                {view === 'staff_list' && <Users className="mr-2 h-4 w-4" />}
                {view === 'student_list' && <GraduationCap className="mr-2 h-4 w-4" />}
                {view === 'profile' && <Users className="mr-2 h-4 w-4" />}
                {isSidebarOpen && view.replace('_', ' ').toUpperCase()}
            </Button>
          ))}
        </nav>
        <div className="p-4">
            <Button variant="destructive" className="w-full" onClick={() => navigate('/login')}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></Button>
            <h1 className="text-xl font-bold capitalize text-slate-800">{activeTab.replace('_', ' ')}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-blue-600 text-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm opacity-80">Total Students</CardTitle></CardHeader>
                <CardContent className="text-4xl font-bold">{stats.students}</CardContent>
              </Card>
              <Card className="bg-slate-700 text-white">
                <CardHeader className="pb-2"><CardTitle className="text-sm opacity-80">Total Staff</CardTitle></CardHeader>
                <CardContent className="text-4xl font-bold">{stats.staff}</CardContent>
              </Card>
            </div>
          )}

          {/* 2. REGISTRATION */}
          {activeTab === 'registration' && (
            <Tabs defaultValue="student" className="w-full max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="student">Register Student</TabsTrigger>
                    <TabsTrigger value="staff">Register Staff</TabsTrigger>
                </TabsList>

                <TabsContent value="student">
                    <Card>
                        <CardHeader><CardTitle>New Student Admission</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                                {/* Admission No Input REMOVED - Auto Generated */}
                                <Select onValueChange={v => setNewStudent({...newStudent, classId: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                    <SelectContent>
                                        {classList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input placeholder="Parent Phone Number" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
                            </div>
                            <Button onClick={handleRegisterStudent} disabled={loading} className="w-full bg-gold text-slate-900 font-bold hover:bg-yellow-500">
                                {loading ? <Loader2 className="animate-spin" /> : "Admit Student & Auto-Generate ID"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="staff">
                    <Card>
                        <CardHeader><CardTitle>New Staff Onboarding</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                                <Input placeholder="Email (Login ID)" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                                <Input placeholder="Password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                                <Input placeholder="Phone Number" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
                                <Select onValueChange={v => setNewStaff({...newStaff, role: v})}>
                                    <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="principal">Principal</SelectItem>
                                        <SelectItem value="head_teacher">Head Teacher</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={v => setNewStaff({...newStaff, section: v})}>
                                    <SelectTrigger><SelectValue placeholder="Assigned Section" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nursery">Nursery</SelectItem>
                                        <SelectItem value="primary">Primary</SelectItem>
                                        <SelectItem value="secondary">Secondary</SelectItem>
                                        <SelectItem value="all">All Sections</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleRegisterStaff} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="animate-spin" /> : "Create Staff Account"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
          )}

          {/* 3. STAFF LIST */}
          {activeTab === 'staff_list' && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Staff Directory</CardTitle>
                    <Select value={staffSectionFilter} onValueChange={setStaffSectionFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Section" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            <SelectItem value="nursery">Nursery</SelectItem>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Passport</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-red-500">Password</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell><Avatar><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar></TableCell>
                                    <TableCell className="font-bold">{s.full_name}</TableCell>
                                    <TableCell className="capitalize"><Badge variant="outline">{s.role.replace('_', ' ')}</Badge></TableCell>
                                    <TableCell>{s.phone_number}</TableCell>
                                    <TableCell>{s.email}</TableCell>
                                    <TableCell className="font-mono text-xs">{s.password}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete {s.full_name}'s account.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete('staff', s.id)} className="bg-red-600">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

          {/* 4. STUDENT LIST */}
          {activeTab === 'student_list' && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Student Database</CardTitle>
                    <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Class" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Passport</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Admission No</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>PIN</TableHead>
                                <TableHead>Parent Phone</TableHead>
                                <TableHead>Active?</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.map(s => (
                                <TableRow key={s.id} className={!s.is_active ? "opacity-50 bg-red-50" : ""}>
                                    <TableCell><Avatar><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar></TableCell>
                                    <TableCell className="font-bold">{s.full_name}</TableCell>
                                    <TableCell>{s.admission_number}</TableCell>
                                    <TableCell>{s.class?.name}</TableCell>
                                    <TableCell className="font-mono font-bold text-blue-600">{s.pin_code}</TableCell>
                                    <TableCell>{s.emergency_contact}</TableCell>
                                    <TableCell>
                                        <Switch 
                                            checked={s.is_active} 
                                            onCheckedChange={() => toggleStudentStatus(s.id, s.is_active)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete {s.full_name}.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete('students', s.id)} className="bg-red-600">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}

          {/* 5. PROFILE */}
          {activeTab === 'profile' && (
            <Card className="max-w-md mx-auto">
                <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-center">
                    <Avatar className="w-32 h-32 mx-auto"><AvatarImage src={user.passport_url} /><AvatarFallback>AD</AvatarFallback></Avatar>
                    <div className="flex items-center justify-center">
                        <Input type="file" className="w-full" onChange={e => e.target.files && setMyPassport(e.target.files[0])} />
                        <Button size="icon" onClick={handleProfileUpdate} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                    </div>
                    <div className="text-left space-y-2">
                        <Label>Name</Label><Input value={user.full_name} disabled />
                        <Label>Email</Label><Input value={user.email} disabled />
                    </div>
                </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;