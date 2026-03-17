import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogOut, GraduationCap, School, Loader2, Upload, Baby, FileCheck, FileSpreadsheet, FileText, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const HeadTeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [myPassport, setMyPassport] = useState<File | null>(null);

  const [schoolSettings, setSchoolSettings] = useState({ current_session: "2025/2026", current_term: "1st Term" });
  const [primaryStats, setPrimaryStats] = useState(0);
  const [pupils, setPupils] = useState<any[]>([]);
  const [primaryClasses, setPrimaryClasses] = useState<any[]>([]);
  
  // Approvals State
  const [pendingBatches, setPendingBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Broadsheet State
  const [broadsheetClass, setBroadsheetClass] = useState("");
  const [broadsheetData, setBroadsheetData] = useState<{headers: string[], rows: any[]}|null>(null);

  // Filters State
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

    const { data: cls } = await supabase.from('classes').select('*').neq('section', 'secondary').order('name');
    if (cls) setPrimaryClasses(cls);

    if (cls && cls.length > 0) {
        const classIds = cls.map(c => c.id);
        const { data: st } = await supabase.from('students').select('*, class:classes(name)').in('class_id', classIds).order('full_name');
        if (st) { setPupils(st); setPrimaryStats(st.length); }
        
        fetchPendingApprovals(classIds);
    }
  };

  // --- NEW: Broadsheet Preview Trigger ---
  useEffect(() => {
      if (broadsheetClass) {
          generateBroadsheetPreview();
      } else {
          setBroadsheetData(null);
      }
  }, [broadsheetClass, schoolSettings]);

  const fetchPendingApprovals = async (primaryClassIds: string[]) => {
      const { data } = await supabase.from('academic_results')
        .select('*, subject:subjects(name), class:classes(name), student:students(full_name)')
        .eq('is_approved', false)
        .in('class_id', primaryClassIds);
      
      if (!data) return;

      const batches: any = {};
      data.forEach((r: any) => {
          const key = `${r.class_id}_${r.subject_id}_${r.session}_${r.term}`;
          if(!batches[key]) {
              batches[key] = { id: key, class_name: r.class?.name, subject_name: r.subject?.name, session: r.session, term: r.term, uploaded_by: r.uploaded_by_name || 'Subject Teacher', records: [] };
          }
          batches[key].records.push(r);
      });
      setPendingBatches(Object.values(batches));
  };

  const handleApproveBatch = async (batch: any) => {
      setLoading(true);
      const recordIds = batch.records.map((r: any) => r.id);
      const { error } = await supabase.from('academic_results').update({ is_approved: true }).in('id', recordIds);
      setLoading(false);
      if(!error) {
          toast({ title: "Batch Approved", description: "Results are now visible to students."});
          setSelectedBatch(null);
          loadData(); 
          if(broadsheetClass) generateBroadsheetPreview(); // Refresh preview if open
      } else { toast({ variant: "destructive", title: "Error", description: error.message}); }
  };

  const handleRejectBatch = async (batch: any) => {
      if(!confirm("Are you sure? This will delete these unapproved scores.")) return;
      setLoading(true);
      const recordIds = batch.records.map((r: any) => r.id);
      const { error } = await supabase.from('academic_results').delete().in('id', recordIds);
      setLoading(false);
      if(!error) {
          toast({ title: "Batch Rejected", description: "Unapproved scores deleted."});
          setSelectedBatch(null);
          loadData();
      }
  };

  // --- NEW: Generate Preview Logic ---
  const generateBroadsheetPreview = async () => {
      setLoading(true);
      const { data: studs } = await supabase.from('students').select('*').eq('class_id', broadsheetClass).eq('is_active', true).order('full_name');
      const { data: res } = await supabase.from('academic_results').select('*, subject:subjects(name)').eq('class_id', broadsheetClass).eq('session', schoolSettings.current_session).eq('term', schoolSettings.current_term).eq('is_approved', true);
      
      setLoading(false);
      if(!studs || studs.length === 0 || !res || res.length === 0) { 
          setBroadsheetData(null); 
          return; 
      }
      
      // Determine columns (Unique subjects)
      const uniqueSubjects = Array.from(new Set(res.map((r: any) => r.subject?.name))).filter(Boolean) as string[];
      const headers = ["Admission No", "Student Name", ...uniqueSubjects, "Total Score", "Average"];

      // Map rows
      const rows = studs.map(student => {
          const rowObj: any = { "Admission No": student.admission_number, "Student Name": student.full_name };
          let grandTotal = 0; 
          let subCount = 0;
          
          uniqueSubjects.forEach(subName => {
              const scoreRec = res.find(r => r.student_id === student.id && r.subject?.name === subName);
              if(scoreRec) { 
                  rowObj[subName] = scoreRec.total_score; 
                  grandTotal += scoreRec.total_score; 
                  subCount++; 
              } else { 
                  rowObj[subName] = "-"; 
              }
          });
          
          rowObj["Total Score"] = grandTotal;
          rowObj["Average"] = subCount > 0 ? (grandTotal / subCount).toFixed(2) : 0;
          return rowObj;
      });

      setBroadsheetData({ headers, rows });
  };

  // --- UPDATED: Download CSV from Preview State ---
  const downloadBroadsheet = () => {
      if(!broadsheetData || !broadsheetClass) return;
      const cls = primaryClasses.find(c => c.id === broadsheetClass);
      
      let csvContent = broadsheetData.headers.join(",") + "\n";
      
      broadsheetData.rows.forEach(row => {
          const rowString = broadsheetData.headers.map(h => `"${row[h]}"`).join(",");
          csvContent += rowString + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Primary_Broadsheet_${cls?.name}_${schoolSettings.current_term}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const toggleStudentStatus = async (id: string, currentStatus: boolean) => { const { error } = await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id); if (!error) { toast({ title: "Updated", description: "Access updated" }); setPupils(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s)); } };
  const handleProfileUpdate = async () => { if (!myPassport) return; setLoading(true); try { const fileExt = myPassport.name.split('.').pop(); const fileName = `staff_${user.id}_${Date.now()}.${fileExt}`; const { error: uploadError } = await supabase.storage.from('passports').upload(fileName, myPassport); if (uploadError) throw uploadError; const { data } = supabase.storage.from('passports').getPublicUrl(fileName); await supabase.from('staff').update({ passport_url: data.publicUrl }).eq('id', user.id); const updatedUser = { ...user, passport_url: data.publicUrl }; setUser(updatedUser); localStorage.setItem("staffData", JSON.stringify(updatedUser)); toast({ title: "Success", description: "Passport Updated" }); setMyPassport(null); } catch (error: any) { toast({ variant: "destructive", title: "Error", description: error.message }); } finally { setLoading(false); } };

  if (!user) return null;

  const filteredPupils = pupils.filter(s => {
      const matchesClass = classFilter === 'all' || s.class_id === classFilter;
      const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.admission_number.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b px-6 py-4 flex justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3"><Avatar><AvatarImage src={user.passport_url} /><AvatarFallback>HT</AvatarFallback></Avatar><div><h1 className="font-bold">{user.full_name}</h1><p className="text-xs text-slate-500">Head Teacher</p></div></div>
        <Button variant="destructive" size="sm" onClick={() => navigate('/login')}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>

      <main className="p-4 md:p-6 container mx-auto max-w-6xl">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-1 bg-slate-200/50">
                <TabsTrigger value="overview"><School className="w-4 h-4 mr-2"/> Overview</TabsTrigger>
                <TabsTrigger value="approvals" className="relative"><FileCheck className="w-4 h-4 mr-2"/> Result Approvals {pendingBatches.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">{pendingBatches.length}</span>}</TabsTrigger>
                <TabsTrigger value="broadsheet"><FileSpreadsheet className="w-4 h-4 mr-2"/> Broadsheets</TabsTrigger>
                <TabsTrigger value="pupils"><Baby className="w-4 h-4 mr-2"/> My Section</TabsTrigger>
                <TabsTrigger value="profile"><GraduationCap className="w-4 h-4 mr-2"/> Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><Card className="bg-green-900 text-white"><CardHeader><CardTitle className="opacity-90">Total Primary & Nursery Pupils</CardTitle></CardHeader><CardContent className="text-5xl font-bold">{primaryStats}</CardContent></Card></TabsContent>

            <TabsContent value="approvals">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-serif text-blue-950">Primary Result Approvals</h2>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{pendingBatches.length} Batches Pending</Badge>
                </div>
                {pendingBatches.length === 0 ? ( <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed">No pending results awaiting approval.</div> ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingBatches.map(batch => (
                            <Dialog key={batch.id}>
                                <DialogTrigger asChild>
                                    <Card className="hover:shadow-lg transition-all cursor-pointer border hover:border-blue-400 group" onClick={() => setSelectedBatch(batch)}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4"><div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileText className="w-6 h-6" /></div><Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Pending</Badge></div>
                                            <h3 className="font-bold text-xl text-slate-900 font-serif mb-1">{batch.subject_name}</h3>
                                            <p className="text-sm text-slate-500 border-b pb-4 mb-4">{batch.class_name}</p>
                                            <div className="flex justify-between items-center text-sm text-gray-500"><div className="flex items-center gap-2"><User className="w-4 h-4"/> <span className="truncate max-w-[120px]">{batch.uploaded_by}</span></div><span className="font-bold text-slate-700">{batch.records.length} Students</span></div>
                                        </CardContent>
                                    </Card>
                                </DialogTrigger>
                            </Dialog>
                        ))}
                    </div>
                )}
                
                <Dialog open={!!selectedBatch} onOpenChange={(o) => !o && setSelectedBatch(null)}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-xl border-none">
                        <DialogHeader className="bg-[#1e3a8a] text-white p-6 pb-8"><DialogTitle className="text-2xl font-serif">{selectedBatch?.class_name} - {selectedBatch?.subject_name}</DialogTitle><p className="text-blue-200 text-sm mt-1">{selectedBatch?.records.length} Students Submitted</p></DialogHeader>
                        <div className="p-6 max-h-[50vh] overflow-y-auto">
                            <Table><TableHeader><TableRow className="bg-slate-50 border-none"><TableHead className="font-bold text-slate-700">Student Name</TableHead><TableHead className="font-bold text-slate-700 text-center">CA (40)</TableHead><TableHead className="font-bold text-slate-700 text-center">Exam (60)</TableHead><TableHead className="font-bold text-slate-700 text-center">Total (100)</TableHead><TableHead className="font-bold text-slate-700 text-center">Grade</TableHead></TableRow></TableHeader>
                            <TableBody>{selectedBatch?.records.map((r: any) => (<TableRow key={r.id} className="border-b-slate-100"><TableCell className="font-medium text-slate-800">{r.student?.full_name}</TableCell><TableCell className="text-center text-slate-600">{r.ca_score}</TableCell><TableCell className="text-center text-slate-600">{r.exam_score}</TableCell><TableCell className="text-center font-bold text-[#1e3a8a]">{r.total_score || (r.ca_score + r.exam_score)}</TableCell><TableCell className={`text-center font-bold ${r.grade === 'F' ? 'text-red-500' : 'text-green-600'}`}>{r.grade}</TableCell></TableRow>))}</TableBody></Table>
                            <div className="mt-8 text-right border-t pt-4"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Uploaded By</p><p className="font-bold text-[#1e3a8a] text-lg font-serif">{selectedBatch?.uploaded_by}</p><p className="text-xs text-gray-400 italic">Subject Teacher</p></div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t flex justify-end gap-4">
                            <Button onClick={() => handleRejectBatch(selectedBatch)} variant="outline" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-bold px-8 h-12" disabled={loading}>Reject Batch</Button>
                            <Button onClick={() => handleApproveBatch(selectedBatch)} className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold px-8 h-12" disabled={loading}><FileCheck className="mr-2 w-5 h-5"/> Approve Batch</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </TabsContent>

            {/* --- UPDATED: BROADSHEET TAB WITH PREVIEW --- */}
            <TabsContent value="broadsheet">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="text-green-600"/> Generate Primary Broadsheet</CardTitle>
                        <p className="text-sm text-gray-500">Preview and download a full CSV file containing every primary student's approved scores.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-blue-900 uppercase">Current Term Output</p>
                                <p className="text-xs text-blue-700">{schoolSettings.current_term} - {schoolSettings.current_session}</p>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Select value={broadsheetClass} onValueChange={setBroadsheetClass}>
                                    <SelectTrigger className="w-full md:w-[250px] bg-white"><SelectValue placeholder="Select Class to Preview"/></SelectTrigger>
                                    <SelectContent>{primaryClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button onClick={downloadBroadsheet} disabled={!broadsheetData || loading} className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                                    {loading ? <Loader2 className="animate-spin"/> : "Download CSV"}
                                </Button>
                            </div>
                        </div>

                        {/* --- THE PREVIEW TABLE --- */}
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-600"/></div>
                        ) : broadsheetData ? (
                            <div className="rounded-md border overflow-x-auto max-h-[500px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-green-50 sticky top-0 z-10">
                                            {broadsheetData.headers.map((h, i) => (
                                                <TableHead key={i} className="whitespace-nowrap font-bold text-green-900 border-r last:border-r-0">
                                                    {h}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {broadsheetData.rows.map((row, i) => (
                                            <TableRow key={i} className="hover:bg-slate-50">
                                                {broadsheetData.headers.map((h, j) => (
                                                    <TableCell key={j} className="whitespace-nowrap border-r last:border-r-0 text-center first:text-left">
                                                        {row[h]}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : broadsheetClass ? (
                            <div className="text-center py-12 text-gray-400 bg-slate-50 border rounded-lg border-dashed">
                                No approved results found for this class.
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400 bg-slate-50 border rounded-lg border-dashed">
                                Select a class above to preview the broadsheet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="pupils"><Card><CardHeader><CardTitle>Pupil Directory (Primary/Nursery)</CardTitle></CardHeader><CardContent><div className="flex flex-col md:flex-row gap-4 mb-4"><Input placeholder="Search Name or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="md:w-1/3"/><Select value={classFilter} onValueChange={setClassFilter}><SelectTrigger className="md:w-1/4"><SelectValue placeholder="Filter by Class" /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{primaryClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div className="rounded-md border h-[500px] overflow-auto"><Table><TableHeader><TableRow><TableHead>Pupil</TableHead><TableHead>Class</TableHead><TableHead>Parent</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{filteredPupils.map(s => (<TableRow key={s.id}><TableCell className="font-medium"><div className="flex items-center gap-2"><Avatar className="w-8 h-8"><AvatarImage src={s.passport_url}/><AvatarFallback>{s.full_name[0]}</AvatarFallback></Avatar><div><div>{s.full_name}</div><div className="text-xs text-gray-500">{s.admission_number}</div></div></div></TableCell><TableCell><Badge variant="outline">{s.class?.name}</Badge></TableCell><TableCell>{s.emergency_contact}</TableCell><TableCell><div className="flex items-center gap-2"><Switch checked={s.is_active} onCheckedChange={() => toggleStudentStatus(s.id, s.is_active)} /><span className={`text-xs ${s.is_active ? 'text-green-600' : 'text-red-500'}`}>{s.is_active ? 'Active' : 'Disabled'}</span></div></TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card></TabsContent>
            <TabsContent value="profile"><Card className="max-w-md mx-auto text-center"><CardHeader><CardTitle>My Profile</CardTitle></CardHeader><CardContent className="space-y-6"><div className="relative inline-block"><Avatar className="w-32 h-32 mx-auto border-4 border-slate-100"><AvatarImage src={user.passport_url} /><AvatarFallback>HT</AvatarFallback></Avatar><label htmlFor="upload" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer"><Upload className="w-4 h-4" /></label><input id="upload" type="file" className="hidden" onChange={e => e.target.files && setMyPassport(e.target.files[0])} /></div>{myPassport && <Button onClick={handleProfileUpdate} disabled={loading} className="w-full">{loading ? <Loader2 className="animate-spin" /> : "Save New Photo"}</Button>}<div className="text-left bg-slate-50 p-4 rounded-lg space-y-2"><div><span className="text-xs text-gray-500 block">Name</span><span className="font-bold">{user.full_name}</span></div><div><span className="text-xs text-gray-500 block">Email</span><span className="font-bold">{user.email}</span></div></div></CardContent></Card></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HeadTeacherDashboard;