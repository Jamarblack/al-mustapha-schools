import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, School, LogOut, Plus, Loader2, Menu, Upload, Trash2, X, Phone, Mail, Key, Eye, EyeOff, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({ students: 0, staff: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [schoolSettings, setSchoolSettings] = useState({ id: "", current_session: "2025/2026", current_term: "1st Term" });

  const [staffSectionFilter, setStaffSectionFilter] = useState("all");
  const [studentClassFilter, setStudentClassFilter] = useState("all");

  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", role: "", section: "", phone: "", assignedClass: "unassigned" });
  // UPDATED: Added dob to newStudent state
  const [newStudent, setNewStudent] = useState({ name: "", classId: "", parentPhone: "", gender: "Male", dob: "" });
  const [myPassport, setMyPassport] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    if (!data) { navigate("/login"); return; }
    setUser(JSON.parse(data));
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: tCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
    setStats({ students: sCount || 0, staff: tCount || 0 });

    const { data: staff } = await supabase.from('staff').select('*, class_teacher_of(name)').order('role');
    if (staff) setStaffList(staff);

    const { data: students } = await supabase.from('students').select('*, class:classes(name)').order('full_name');
    if (students) setStudentList(students);

    const { data: classes } = await supabase.from('classes').select('*').order('name');
    if (classes) setClassList(classes);

    const { data: settings } = await supabase.from('school_settings').select('*').maybeSingle();
    if (settings) setSchoolSettings(settings);
  };

  const handleUpdateSettings = async () => {
      setLoading(true);
      const { error } = await supabase.from('school_settings').update({ 
          current_session: schoolSettings.current_session,
          current_term: schoolSettings.current_term
      }).eq('id', schoolSettings.id);
      
      setLoading(false);
      if(error) toast({ variant: "destructive", title: "Error", description: error.message});
      else toast({ title: "Updated", description: "School Session & Term Updated!"});
  };

  // ... (Keep handleNameChange, handleRoleChange, generateCredentials logic exactly as before)
  const handleNameChange = (name: string) => {
    const updatedStaff = { ...newStaff, name };
    if (newStaff.role === 'teacher' && name.length > 3) { generateCredentials(name, 'teacher', updatedStaff); } else { setNewStaff(updatedStaff); }
  };
  const handleRoleChange = (role: string) => {
    const updatedStaff = { ...newStaff, role };
    if (role === 'teacher' && newStaff.name.length > 3) { generateCredentials(newStaff.name, role, updatedStaff); } else { setNewStaff(updatedStaff); }
  };
  const generateCredentials = (fullName: string, role: string, currentStaffState: any) => {
    const parts = fullName.trim().toLowerCase().split(' ');
    let emailPrefix = parts.length > 1 ? parts.slice(0, -1).map(p => p[0]).join('') + parts[parts.length - 1] : parts[0];
    emailPrefix = emailPrefix.replace(/[^a-z0-9]/g, '');
    const autoEmail = `${emailPrefix}@almustaphaschools.com`;
    const autoPassword = Math.floor(100000 + Math.random() * 900000).toString();
    setNewStaff({ ...currentStaffState, email: autoEmail, password: autoPassword });
  };

  const handleRegisterStaff = async () => {
    setLoading(true);
    const classToAssign = (newStaff.assignedClass && newStaff.assignedClass !== "unassigned") ? newStaff.assignedClass : null;
    const { error } = await supabase.from('staff').insert({
      full_name: newStaff.name, email: newStaff.email, password: newStaff.password,
      role: newStaff.role, assigned_section: newStaff.section, phone_number: newStaff.phone,
      class_teacher_of: classToAssign
    });
    setLoading(false);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Success", description: "Staff created." }); loadAllData(); setNewStaff({ name: "", email: "", password: "", role: "", section: "", phone: "", assignedClass: "unassigned" }); }
  };

  const handleRegisterStudent = async () => {
    setLoading(true);
    const selectedClass = classList.find(c => c.id === newStudent.classId);
    if (!selectedClass) { toast({variant: "destructive", title: "Select Class"}); setLoading(false); return;}
    
    // Auto Generate ID
    const rand = Math.floor(1000 + Math.random() * 9000);
    const currentYear = new Date().getFullYear();
    let autoAdmissionNo = `AMS/${rand}`;
    if (selectedClass.name.toUpperCase().includes('KG')) autoAdmissionNo = `AMS/${currentYear}/${rand}`;
    else if (selectedClass.section === 'nursery') autoAdmissionNo = `AMS/NUR/${rand}`;
    else if (selectedClass.section === 'primary') autoAdmissionNo = `AMS/PRI/${rand}`;
    else if (selectedClass.section === 'secondary') autoAdmissionNo = `AMS/${selectedClass.name.substring(0,3)}/${rand}`;
    
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    
    // UPDATED: Insert with date_of_birth
    const { error } = await supabase.from('students').insert({ 
        full_name: newStudent.name, 
        admission_number: autoAdmissionNo, 
        class_id: newStudent.classId, 
        section: selectedClass.section, 
        gender: newStudent.gender, 
        date_of_birth: newStudent.dob || null, // Allow empty DOB
        pin_code: pin, 
        emergency_contact: newStudent.parentPhone, 
        is_active: true 
    });
    
    setLoading(false);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { 
        toast({ title: "Student Registered!", description: `ID: ${autoAdmissionNo} | PIN: ${pin}` }); 
        loadAllData(); 
        setNewStudent({ name: "", classId: "", parentPhone: "", gender: "Male", dob: "" }); 
    }
  };

  // ... (Keep toggleStudentStatus, handleDelete, handleProfileUpdate exactly as before)
  const toggleStudentStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) { toast({ title: "Updated", description: `Access ${!currentStatus ? 'Restored' : 'Revoked'}` }); setStudentList(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s)); }
  };
  const handleDelete = async (table: 'staff' | 'students', id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) toast({ variant: "destructive", title: "Delete Failed", description: "Check permissions." });
    else { toast({ title: "Deleted", description: "Record removed." }); loadAllData(); }
  };
  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    setLoading(true);
    try {
        const fileExt = myPassport.name.split('.').pop();
        const fileName = `proprietor_${user.id}_${Date.now()}.${fileExt}`;
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

  const filteredStaff = staffSectionFilter === 'all' ? staffList : staffList.filter(s => s.assigned_section === staffSectionFilter || s.assigned_section === 'all');
  const filteredStudents = studentClassFilter === 'all' ? studentList : studentList.filter(s => s.class_id === studentClassFilter);

  // ... (Keep StaffCard exactly as before)
  const StaffCard = ({ s }: { s: any }) => (<Card className="mb-4 shadow-sm border-l-4 border-l-blue-500"><CardContent className="pt-6"><div className="flex items-start gap-4"><Avatar className="w-16 h-16"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div className="flex-1 overflow-hidden"><h3 className="font-bold text-lg truncate">{s.full_name}</h3><div className="flex gap-2"><Badge variant="secondary" className="mb-2 capitalize">{s.role.replace('_', ' ')}</Badge>{s.class_teacher_of && <Badge variant="outline" className="mb-2 border-blue-500 text-blue-600">Class: {s.class_teacher_of.name}</Badge>}</div><div className="text-sm text-gray-600 space-y-1"><div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {s.phone_number || 'N/A'}</div><div className="flex items-center gap-2"><Mail className="w-3 h-3"/> {s.email}</div><div className="flex items-center gap-2 text-red-500 font-mono"><Key className="w-3 h-3"/> {s.password}</div></div></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="w-5 h-5" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Staff?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete('staff', s.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></CardContent></Card>);
  
  // UPDATED: StudentCard to show Age if available
  const StudentCard = ({ s }: { s: any }) => {
      const age = s.date_of_birth ? new Date().getFullYear() - new Date(s.date_of_birth).getFullYear() : 'N/A';
      return (
        <Card className={`mb-4 shadow-sm border-l-4 ${s.is_active ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16"><AvatarImage src={s.passport_url} /><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold text-lg truncate">{s.full_name}</h3>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="mb-2">{s.class?.name}</Badge>
                            <Badge variant="secondary" className="mb-2">{s.gender || 'N/A'}</Badge>
                            {age !== 'N/A' && <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800">{age} Yrs</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div className="bg-gray-100 p-2 rounded"><span className="block text-xs text-gray-500">ID & PIN</span><span className="font-mono font-bold text-blue-600">{s.admission_number}</span><div className="font-mono text-xs">{s.pin_code}</div></div>
                            <div className="bg-gray-100 p-2 rounded"><span className="block text-xs text-gray-500">Parent</span><span className="font-medium">{s.emergency_contact}</span></div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4 border-t pt-3">
                    <div className="flex items-center gap-2"><Switch checked={s.is_active} onCheckedChange={() => toggleStudentStatus(s.id, s.is_active)} /><span className={`text-xs ${s.is_active ? 'text-green-600' : 'text-red-600'}`}>{s.is_active ? 'Active' : 'Disabled'}</span></div>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4 mr-1"/> Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Student?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete('students', s.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                </div>
            </CardContent>
        </Card>
      );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {isSidebarOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />)}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 flex flex-col items-center border-b border-slate-800 relative">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 md:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5"/></Button>
          <Avatar className="w-20 h-20 border-2 border-gold mb-3"><AvatarImage src={user.passport_url} /><AvatarFallback>AD</AvatarFallback></Avatar>
          <div className="text-center"><h2 className="font-bold text-lg">Proprietor</h2><p className="text-xs text-slate-400">Super Admin</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {['overview', 'registration', 'staff_list', 'student_list', 'settings', 'profile'].map((view) => (
            <Button key={view} variant={activeTab === view ? "secondary" : "ghost"} className={`w-full justify-start ${activeTab === view ? 'bg-gold text-slate-900' : 'text-slate-300'}`} onClick={() => { setActiveTab(view); setIsSidebarOpen(false); }}>
                {view === 'overview' && <School className="mr-2 h-4 w-4" />}{view === 'registration' && <Plus className="mr-2 h-4 w-4" />}{view === 'staff_list' && <Users className="mr-2 h-4 w-4" />}{view === 'student_list' && <GraduationCap className="mr-2 h-4 w-4" />}{view === 'settings' && <Settings className="mr-2 h-4 w-4" />}{view === 'profile' && <Users className="mr-2 h-4 w-4" />}
                {view.replace('_', ' ').toUpperCase()}
            </Button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800"><Button variant="destructive" className="w-full" onClick={() => navigate('/login')}><LogOut className="mr-2 h-4 w-4" /> Logout</Button></div>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full">
        <header className="h-16 bg-white border-b flex items-center px-4 md:px-6 justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></Button><h1 className="text-lg md:text-xl font-bold capitalize text-slate-800 truncate">{activeTab.replace('_', ' ')}</h1></div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 pb-24">
          {activeTab === 'overview' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Card className="bg-blue-600 text-white"><CardHeader className="pb-2"><CardTitle className="text-sm opacity-80">Students</CardTitle></CardHeader><CardContent className="text-4xl font-bold">{stats.students}</CardContent></Card><Card className="bg-slate-700 text-white"><CardHeader className="pb-2"><CardTitle className="text-sm opacity-80">Staff</CardTitle></CardHeader><CardContent className="text-4xl font-bold">{stats.staff}</CardContent></Card></div>)}

          {activeTab === 'registration' && (
            <Tabs defaultValue="student" className="w-full max-w-4xl mx-auto">
                <TabsList className="w-full h-auto flex flex-col md:grid md:grid-cols-2 gap-2 mb-6 bg-transparent">
                    <TabsTrigger value="student" className="w-full border py-3 data-[state=active]:bg-gold data-[state=active]:text-black">Register Student</TabsTrigger>
                    <TabsTrigger value="staff" className="w-full border py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">Register Staff</TabsTrigger>
                </TabsList>
                
                {/* --- UPDATED: Student Registration with DOB --- */}
                <TabsContent value="student">
                    <Card>
                        <CardHeader><CardTitle>Admission</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Input placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select onValueChange={v => setNewStudent({...newStudent, classId: v})}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                                <Select onValueChange={v => setNewStudent({...newStudent, gender: v})} defaultValue="Male"><SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input placeholder="Parent Phone" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
                                {/* NEW: DOB INPUT */}
                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Date of Birth</Label>
                                    <Input type="date" value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
                                </div>
                            </div>

                            <Button onClick={handleRegisterStudent} disabled={loading} className="w-full bg-gold text-slate-900 font-bold hover:bg-yellow-500 py-6 text-lg mt-4">{loading ? <Loader2 className="animate-spin" /> : "Admit Student"}</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Keep Staff Registration as is --- */}
                <TabsContent value="staff">
                    <Card>
                        <CardHeader><CardTitle>Staff Onboarding</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Input placeholder="Full Name" value={newStaff.name} onChange={e => handleNameChange(e.target.value)} />
                            <Select onValueChange={handleRoleChange} value={newStaff.role}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="principal">Principal</SelectItem><SelectItem value="head_teacher">Head Teacher</SelectItem><SelectItem value="teacher">Teacher</SelectItem></SelectContent></Select>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label className="text-xs text-gray-500 mb-1 block">Email (Auto-generated)</Label><Input placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} /></div>
                                <div><Label className="text-xs text-gray-500 mb-1 block">Password</Label><div className="relative"><Input placeholder="Password" type={showPassword ? "text" : "password"} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="pr-10"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label className="text-xs text-gray-500 mb-1 block">Phone Number</Label><Input placeholder="Phone" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} /></div>
                                <div><Label className="text-xs text-gray-500 mb-1 block">School Section</Label><Select onValueChange={v => setNewStaff({...newStaff, section: v})} value={newStaff.section}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent><SelectItem value="nursery">Nursery</SelectItem><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="all">All</SelectItem></SelectContent></Select></div>
                            </div>
                            <div><Label className="text-xs text-gray-500 mb-1 block">Assign as Class Teacher (Optional)</Label><Select onValueChange={v => setNewStaff({...newStaff, assignedClass: v})} value={newStaff.assignedClass}><SelectTrigger className="border-blue-200 bg-blue-50"><SelectValue placeholder="Select Class to Manage" /></SelectTrigger><SelectContent><SelectItem value="unassigned">None</SelectItem>{classList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                            <Button onClick={handleRegisterStaff} disabled={loading} className="w-full py-6 mt-4">Create Account</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
          )}

          {/* ... Keep the rest of the tabs (Settings, Lists, Profile) exactly as before ... */}
          {activeTab === 'settings' && (<Card className="max-w-xl mx-auto border-t-4 border-t-gold"><CardHeader><CardTitle>Global School Settings</CardTitle><CardDescription>Control the Active Session and Term for the entire portal.</CardDescription></CardHeader><CardContent className="space-y-6"><div><Label>Current Session (e.g. 2025/2026)</Label><Input value={schoolSettings.current_session} onChange={(e) => setSchoolSettings({...schoolSettings, current_session: e.target.value})} className="font-mono text-lg" /></div><div><Label>Current Term</Label><Select value={schoolSettings.current_term} onValueChange={(v) => setSchoolSettings({...schoolSettings, current_term: v})}><SelectTrigger className="font-mono text-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1st Term">1st Term</SelectItem><SelectItem value="2nd Term">2nd Term</SelectItem><SelectItem value="3rd Term">3rd Term</SelectItem></SelectContent></Select></div><Button onClick={handleUpdateSettings} disabled={loading} className="w-full bg-gold text-slate-900 font-bold hover:bg-yellow-500">{loading ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button></CardContent></Card>)}
          {activeTab === 'staff_list' && (<div className="space-y-4"><div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"><h2 className="font-bold">Staff</h2><Select value={staffSectionFilter} onValueChange={setStaffSectionFilter}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="nursery">Nursery</SelectItem><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem></SelectContent></Select></div><div className="md:hidden">{filteredStaff.map(s => <StaffCard key={s.id} s={s} />)}</div><Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Details</TableHead><TableHead>Role</TableHead><TableHead>Contact</TableHead><TableHead>Password</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{filteredStaff.map(s => (<TableRow key={s.id}><TableCell className="flex items-center gap-2"><Avatar><AvatarImage src={s.passport_url} /></Avatar> <div><div className="font-bold">{s.full_name}</div>{s.class_teacher_of && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Class: {s.class_teacher_of.name}</span>}</div></TableCell><TableCell className="capitalize">{s.role.replace('_', ' ')}</TableCell><TableCell><div>{s.email}</div><div className="text-xs text-gray-500">{s.phone_number}</div></TableCell><TableCell className="font-mono">{s.password}</TableCell><TableCell><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Delete?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete('staff', s.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>)}
          {activeTab === 'student_list' && (<div className="space-y-4"><div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"><h2 className="font-bold">Students</h2><Select value={studentClassFilter} onValueChange={setStudentClassFilter}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{classList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div className="md:hidden">{filteredStudents.map(s => <StudentCard key={s.id} s={s} />)}</div><Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Gender</TableHead><TableHead>ID & PIN</TableHead><TableHead>Parent</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{filteredStudents.map(s => (<TableRow key={s.id} className={!s.is_active ? "bg-red-50 opacity-60" : ""}><TableCell className="flex items-center gap-2"><Avatar><AvatarImage src={s.passport_url} /></Avatar> <span className="font-bold">{s.full_name}</span></TableCell><TableCell>{s.class?.name}</TableCell><TableCell>{s.gender || 'N/A'}</TableCell><TableCell><div>{s.admission_number}</div><div className="text-blue-600 font-bold font-mono">{s.pin_code}</div></TableCell><TableCell>{s.emergency_contact}</TableCell><TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleStudentStatus(s.id, s.is_active)} /></TableCell><TableCell><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Student?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete('students', s.id)} className="bg-red-600">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>)}
          {activeTab === 'profile' && (<Card className="max-w-md mx-auto"><CardHeader><CardTitle className="text-center">My Profile</CardTitle></CardHeader><CardContent className="space-y-6 text-center"><div className="relative inline-block"><Avatar className="w-32 h-32 mx-auto border-4 border-white shadow-lg"><AvatarImage src={user.passport_url} /><AvatarFallback>AD</AvatarFallback></Avatar><label htmlFor="upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md"><Upload className="w-4 h-4" /></label><input id="upload" type="file" className="hidden" onChange={e => e.target.files && setMyPassport(e.target.files[0])} /></div>{myPassport && <Button onClick={handleProfileUpdate} disabled={loading} className="w-full">{loading ? <Loader2 className="animate-spin" /> : "Save New Photo"}</Button>}<div className="bg-slate-50 p-4 rounded-lg text-left space-y-3"><div><Label className="text-xs text-gray-500">FULL NAME</Label><div className="font-medium">{user.full_name}</div></div><div><Label className="text-xs text-gray-500">EMAIL</Label><div className="font-medium">{user.email}</div></div></div></CardContent></Card>)}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;