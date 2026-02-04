import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Download, School, Loader2, User, BookOpen, Upload, Phone, Calendar, Hash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logo from "/Almustapha.png";

// Import PDF Libraries
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("results");
  const [myPassport, setMyPassport] = useState<File | null>(null);

  // Filter State
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("1st Term");

  // Data State
  const [results, setResults] = useState<any[]>([]);
  const [reportDetails, setReportDetails] = useState<any>(null);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("studentData");
    if (!data) { navigate("/login"); return; }
    const parsedStudent = JSON.parse(data);
    setStudent(parsedStudent);
    
    // Load Global School Settings
    fetchSettings();
  }, []);

  useEffect(() => {
    if (student && schoolSettings && activeTab === "results") {
        fetchResults(); 
    }
  }, [student, schoolSettings, selectedSession, selectedTerm, activeTab]);

  const fetchSettings = async () => {
      const { data } = await supabase.from('school_settings').select('*').maybeSingle();
      if (data) {
          setSchoolSettings(data);
          setSelectedSession(data.current_session);
          setSelectedTerm(data.current_term);
      }
  };

  const fetchResults = async () => {
    setLoading(true);
    const { data: res } = await supabase.from('academic_results')
        .select(`*, subject:subjects(name)`)
        .eq('student_id', student.id)
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .eq('is_approved', true);
    
    setResults(res || []);

    const { data: details } = await supabase.from('report_card_details')
        .select('*')
        .eq('student_id', student.id)
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .maybeSingle();
    
    setReportDetails(details);
    setLoading(false);
  };

  const calculateAge = (dob: string) => {
      if (!dob) return "N/A";
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  };

  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    setLoading(true);
    try {
        const fileExt = myPassport.name.split('.').pop();
        const fileName = `student_${student.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('passports').upload(fileName, myPassport);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('students').update({ passport_url: data.publicUrl }).eq('id', student.id);
        if (dbError) throw dbError;
        
        // Update Local State
        const updatedStudent = { ...student, passport_url: data.publicUrl };
        setStudent(updatedStudent);
        localStorage.setItem("studentData", JSON.stringify(updatedStudent));
        
        toast({ title: "Success", description: "Passport Updated" });
        setMyPassport(null);
    } catch (error: any) { 
        toast({ variant: "destructive", title: "Upload Failed", description: error.message }); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-card');
    if (!element) return;

    setDownloading(true);
    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(canvas.toDataURL('image/png'));
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const finalHeight = imgHeight > pdfHeight ? pdfHeight : imgHeight;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, finalHeight);
        pdf.save(`Result_${student.full_name}_${selectedTerm}.pdf`);
        toast({ title: "Success", description: "Result downloaded successfully." });
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    } finally {
        setDownloading(false);
    }
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans print:bg-white">
      {/* --- HEADER --- */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center print:hidden sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
            <Avatar><AvatarImage src={student.passport_url} /><AvatarFallback>ST</AvatarFallback></Avatar>
            <div><h1 className="font-bold text-lg">{student.full_name}</h1><p className="text-xs text-slate-500">{student.admission_number}</p></div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => navigate('/login')}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>

      <main className="p-4 md:p-8 container mx-auto max-w-5xl">
        
        <Tabs defaultValue="results" value={activeTab} onValueChange={setActiveTab} className="space-y-6 print:hidden">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="results"><BookOpen className="w-4 h-4 mr-2"/> My Result</TabsTrigger>
                <TabsTrigger value="profile"><User className="w-4 h-4 mr-2"/> My Profile</TabsTrigger>
            </TabsList>

            {/* --- TAB 1: RESULT SHEET --- */}
            <TabsContent value="results">
                {/* CONTROLS */}
                <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-end print:hidden">
                    <div className="flex gap-4 w-full md:w-auto">
                        <div>
                            <span className="text-xs font-bold text-gray-500 block mb-1">Session</span>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="2024/2025">2024/2025</SelectItem><SelectItem value="2025/2026">2025/2026</SelectItem><SelectItem value="2026/2027">2026/2027</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-500 block mb-1">Term</span>
                            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="1st Term">1st Term</SelectItem><SelectItem value="2nd Term">2nd Term</SelectItem><SelectItem value="3rd Term">3rd Term</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <Button onClick={fetchResults} className="mt-5" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : "View Result"}</Button>
                    </div>
                    {results.length > 0 && <Button onClick={handleDownloadPDF} disabled={downloading} className="bg-blue-600 hover:bg-blue-700 text-white"><Download className="w-4 h-4 mr-2"/> {downloading ? "Generating PDF..." : "Download Result"}</Button>}
                </div>

                {/* THE RESULT SHEET CARD */}
                <div className="flex justify-center">
                    <div id="report-card" className="bg-white w-[210mm] min-h-[297mm] p-8 shadow-2xl text-slate-900 border border-gray-100">
                        {/* SCHOOL HEADER */}
                        <div className="text-center border-b-2 border-blue-900 pb-4 mb-4">
                            <div className="flex items-center justify-center gap-4 mb-2">
                                <img src={logo} alt="School Logo" className="w-25 h-20 rounded-full"/>
                                <div>
                                    <h1 className="text-3xl font-bold text-green-900 font-serif uppercase tracking-wide">Al-Mustapha Model College</h1>
                                    <p className="text-sm font-semibold text-gray-600">1. Ajao Mustapha Street Idi-Emi, Ogidi Area Ilorin, Kwara State.</p>
                                    <p className="text-xs font-bold text-blue-600 mt-1 italic tracking-widest">MOTTO: KNOWLEDGE IS LIGHT</p>
                                </div>
                            </div>
                            <div className="bg-slate-900 text-yellow-100 py-1 mt-2 mx-auto w-2/3 rounded-full">
                                <h2 className="text-center font-bold uppercase text-sm">Terminal Progress Report Sheet</h2>
                            </div>
                            <p className="text-xs font-bold mt-2 uppercase">{selectedTerm} | {selectedSession} SESSION</p>
                        </div>

                        {/* STUDENT INFO GRID */}
                        <div className="grid grid-cols-3 gap-y-2 gap-x-4 mb-6 text-xs border border-gray-300 p-3 rounded bg-slate-50">
                            <div><span className="font-bold text-gray-500 uppercase">Name:</span> <span className="font-bold text-base ml-2">{student.full_name}</span></div>
                            <div><span className="font-bold text-gray-500 uppercase">Admission No:</span> <span className="font-bold ml-2 font-mono">{student.admission_number}</span></div>
                            <div><span className="font-bold text-gray-500 uppercase">Class:</span> <span className="font-bold ml-2">{student.class?.name || "N/A"}</span></div>
                            <div><span className="font-bold text-gray-500 uppercase">Gender:</span> <span className="font-bold ml-2">{student.gender || "Male"}</span></div>
                            <div><span className="font-bold text-gray-500 uppercase">Date of Birth:</span> <span className="font-bold ml-2">{student.date_of_birth || "N/A"}</span></div>
                            <div><span className="font-bold text-gray-500 uppercase">Age:</span> <span className="font-bold ml-2">{calculateAge(student.date_of_birth)} Years</span></div>
                        </div>

                        {/* RESULTS TABLE */}
                        <div className="mb-6">
                            {results.length > 0 ? (
                                <table className="w-full text-xs border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="border border-blue-800 p-2 text-left">SUBJECTS</th>
                                            <th className="border border-blue-800 p-2 text-center w-12">TEST (10)</th>
                                            <th className="border border-blue-800 p-2 text-center w-12">MID (20)</th>
                                            <th className="border border-blue-800 p-2 text-center w-12">ASS (10)</th>
                                            <th className="border border-blue-800 p-2 text-center w-12">EXAM (60)</th>
                                            <th className="border border-blue-800 p-2 text-center w-12 font-bold bg-blue-800">TOTAL</th>
                                            <th className="border border-blue-800 p-2 text-center w-12">GRADE</th>
                                            <th className="border border-blue-800 p-2 text-left w-24">REMARK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((r, i) => {
                                            const total = (r.class_test||0) + (r.mid_term_test||0) + (r.assignment||0) + (r.exam_score||0);
                                            let remark = "Fail";
                                            if(r.grade === 'A') remark = "Excellent"; else if(r.grade === 'B') remark = "V. Good"; else if(r.grade === 'C') remark = "Good"; else if(r.grade === 'D') remark = "Fair";
                                            return (
                                                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                    <td className="border border-gray-300 p-2 font-semibold">{r.subject?.name}</td>
                                                    <td className="border border-gray-300 p-2 text-center">{r.class_test || '-'}</td>
                                                    <td className="border border-gray-300 p-2 text-center">{r.mid_term_test || '-'}</td>
                                                    <td className="border border-gray-300 p-2 text-center">{r.assignment || '-'}</td>
                                                    <td className="border border-gray-300 p-2 text-center font-bold text-blue-900">{r.exam_score || '-'}</td>
                                                    <td className="border border-gray-300 p-2 text-center font-bold bg-blue-50 text-base">{total}</td>
                                                    <td className={`border border-gray-300 p-2 text-center font-bold ${r.grade === 'F' ? 'text-red-600' : 'text-green-600'}`}>{r.grade}</td>
                                                    <td className="border border-gray-300 p-2 text-xs">{remark}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : <div className="text-center py-8 text-gray-400 border border-dashed rounded">Result pending approval.</div>}
                        </div>

                        {/* FOOTER */}
                        {reportDetails && (
                            <div className="grid grid-cols-2 gap-6 text-xs border-t-2 border-blue-900 pt-4">
                                <div className="space-y-4">
                                    <div className="border border-gray-300 rounded p-2">
                                        <h3 className="font-bold text-blue-900 mb-2 border-b pb-1">ATTENDANCE</h3>
                                        <div className="grid grid-cols-3 text-center">
                                            <div><span className="block text-[10px] text-gray-500">OPENED</span><span className="font-bold text-sm">{reportDetails.school_opened || '-'}</span></div>
                                            <div><span className="block text-[10px] text-gray-500">PRESENT</span><span className="font-bold text-sm text-green-600">{reportDetails.times_present || '-'}</span></div>
                                            <div><span className="block text-[10px] text-gray-500">ABSENT</span><span className="font-bold text-sm text-red-500">{reportDetails.times_absent || '-'}</span></div>
                                        </div>
                                    </div>
                                    <div className="border border-gray-300 rounded p-2">
                                        <h3 className="font-bold text-blue-900 mb-2 border-b pb-1">PSYCHOMOTOR</h3>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                            {reportDetails.psychomotor_skills && Object.entries(reportDetails.psychomotor_skills).map(([key, val]) => (
                                                <div key={key} className="flex justify-between border-b border-dotted py-0.5"><span className="capitalize">{key}</span><span className="font-bold">{val as number}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div><h3 className="font-bold text-gray-500 uppercase mb-1">Class Teacher's Remark</h3><div className="border-b border-black py-1 font-handwriting italic text-sm">{reportDetails.form_master_remark || "No remark yet."}</div></div>
                                        <div><h3 className="font-bold text-gray-500 uppercase mb-1">Principal's Remark</h3><div className="border-b border-black py-1 font-handwriting italic text-sm">{reportDetails.principal_remark || "Satisfactory progress."}</div></div>
                                        <div className="mt-2 bg-blue-50 p-2 rounded text-center"><span className="block text-[10px] uppercase font-bold text-blue-600">Next Term Begins</span><span className="font-bold text-base">{reportDetails.next_term_begins || "TBA"}</span></div>
                                    </div>
                                    <div className="mt-6 text-right"><div className="inline-block text-center"><div className="h-8 border-b border-black w-32 mb-1"></div><p className="text-[10px] uppercase font-bold text-gray-500">Principal's Signature</p></div></div>
                                </div>
                            </div>
                        )}
                        <div className="text-center text-[10px] text-gray-400 mt-8 pt-2 border-t">Generated from Al-Mustapha Model College Portal on {new Date().toLocaleDateString()}</div>
                    </div>
                </div>
            </TabsContent>

            {/* --- TAB 2: PROFILE SECTION (RESTORED) --- */}
            <TabsContent value="profile">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader><CardTitle>My Student Profile</CardTitle><CardDescription>View your details and update your passport photograph.</CardDescription></CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                            {/* Avatar & Upload */}
                            <div className="relative group">
                                <Avatar className="w-40 h-40 border-4 border-slate-100 shadow-md"><AvatarImage src={student.passport_url} className="object-cover" /><AvatarFallback className="text-4xl">ST</AvatarFallback></Avatar>
                                <label htmlFor="upload-pass" className="absolute bottom-2 right-2 bg-blue-600 text-white p-3 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition-colors"><Upload className="w-5 h-5" /></label>
                                <input id="upload-pass" type="file" className="hidden" onChange={e => e.target.files && setMyPassport(e.target.files[0])} />
                            </div>
                            {myPassport && <Button onClick={handleProfileUpdate} disabled={loading} className="bg-blue-600 w-full md:w-auto">{loading ? <Loader2 className="animate-spin mr-2"/> : "Save New Photo"}</Button>}
                        </div>

                        {/* Bio Data Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border">
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Full Name</Label><div className="font-bold text-lg">{student.full_name}</div></div>
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Admission Number</Label><div className="font-mono font-bold text-blue-600">{student.admission_number}</div></div>
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Current Class</Label><div className="font-medium">{student.class?.name || "Unassigned"}</div></div>
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Gender</Label><div className="font-medium">{student.gender}</div></div>
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Date of Birth</Label><div className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> {student.date_of_birth || "Not set"}</div></div>
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Age</Label><div className="font-medium">{calculateAge(student.date_of_birth)} Years Old</div></div>
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Parent Contact</Label><div className="font-medium flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400"/> {student.emergency_contact}</div></div>
                            <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase">Login PIN</Label><div className="font-mono font-bold text-gray-600 tracking-widest flex items-center gap-2"><Hash className="w-4 h-4 text-gray-400"/> {student.pin_code}</div></div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

      </main>
    </div>
  );
};

export default StudentDashboard;