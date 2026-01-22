import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { LogOut, Search, Loader2, Download, BookOpen, User, Upload, Calculator, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { schoolLogoBase64, principalSignatureBase64 } from "@/lib/assets";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [reportDetails, setReportDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'profile'>('results');
  const [myPassport, setMyPassport] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("1st Term");
  const [stats, setStats] = useState({ totalScore: 0, average: "0", remark: "N/A" });

  useEffect(() => {
    const data = localStorage.getItem("studentData");
    if (!data) { navigate("/login"); return; }
    setStudent(JSON.parse(data));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("studentData");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const fetchResult = async () => {
    if (!student) return;
    setLoading(true);
    setResults([]);

    try {
      const { data: scores, error } = await supabase
        .from('academic_results')
        .select(`*, subject:subjects(name)`)
        .eq('student_id', student.id)
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .eq('is_approved', true);

      if (error) throw error;

      if (!scores || scores.length === 0) {
        toast({ title: "No Results", description: "Results not yet published." });
      } else {
        setResults(scores);
        const total = scores.reduce((acc: number, curr: any) => acc + (curr.total_score || 0), 0);
        const avg = scores.length > 0 ? (total / scores.length).toFixed(1) : "0";
        let remark = "Good";
        if (Number(avg) >= 70) remark = "Excellent";
        else if (Number(avg) >= 60) remark = "Very Good";
        else if (Number(avg) < 50) remark = "Fair";
        else remark = "Fail";
        setStats({ totalScore: total, average: avg, remark });
      }

      const { data: details } = await supabase.from('report_card_details')
        .select('*')
        .eq('student_id', student.id)
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .maybeSingle();
      
      if (details) setReportDetails(details);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!myPassport) return;
    setUploading(true);
    try {
        const fileExt = myPassport.name.split('.').pop();
        const fileName = `student_${student.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('passports').upload(fileName, myPassport);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('passports').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('students').update({ passport_url: data.publicUrl }).eq('id', student.id);
        if (dbError) throw dbError;
        
        const updatedStudent = { ...student, passport_url: data.publicUrl };
        setStudent(updatedStudent);
        localStorage.setItem("studentData", JSON.stringify(updatedStudent));
        setMyPassport(null);
        toast({ title: "Success", description: "Passport Updated" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
        setUploading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();

    try { if (schoolLogoBase64) doc.addImage(schoolLogoBase64, 'JPEG', 10, 5, 25, 25); } catch (e) {}

    doc.setFont("times", "bold"); doc.setFontSize(22);
    doc.text("ALMUSTAPHA MODEL COLLEGE", width / 2, 12, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text("1. AJAO MUSTAPHA STREET IDI-EMI, OGIDI AREA ILORIN, KWARA STATE.", width / 2, 17, { align: "center" });
    doc.text("08053503125, 07036239149", width / 2, 22, { align: "center" });
    doc.setFont("times", "italic"); doc.setFontSize(10);
    doc.text("MOTTO: KNOWLEDGE IS LIGHT", width / 2, 27, { align: "center" });

    doc.setFillColor(220, 220, 220); doc.rect(10, 30, width - 20, 7, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(`TERMINAL PROGRESS REPORT SHEET FOR ${student.section.toUpperCase()} SCHOOL`, width / 2, 35, { align: "center" });
    doc.setFontSize(10);
    doc.text(`${selectedTerm.toUpperCase()}     ${selectedSession} SESSION`, width / 2, 42, { align: "center" });

    const bioY = 45; const colW = (width - 20) / 6; 
    doc.rect(10, bioY, width - 20, 14);
    [1, 2.5, 4, 4.7, 5.3].forEach(m => doc.line(10 + colW * m, bioY, 10 + colW * m, bioY + 14));

    doc.setFontSize(7); doc.setTextColor(100);
    doc.text("Admission No:", 12, bioY + 4); doc.text("Surname:", 12 + colW, bioY + 4);
    doc.text("Other Name:", 12 + colW * 2.5, bioY + 4); doc.text("House:", 12 + colW * 4, bioY + 4);
    doc.text("Sex:", 12 + colW * 4.7, bioY + 4); doc.text("Class:", 12 + colW * 5.3, bioY + 4);

    doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text(student.admission_number, 12, bioY + 10);
    const names = student.full_name.split(' ');
    doc.text(names[0] || "", 12 + colW, bioY + 10);
    doc.text(names.slice(1).join(' ') || "", 12 + colW * 2.5, bioY + 10);
    doc.text(student.house || "Blue", 12 + colW * 4, bioY + 10);
    doc.text(student.gender ? student.gender[0] : 'N/A', 12 + colW * 4.7, bioY + 10);
    doc.text(student.class?.name || "N/A", 12 + colW * 5.3, bioY + 10);

    const primarySubjects = ["Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education", "Verbal Reasoning", "Quantitative Reasoning", "Computer Studies", "Agric Science", "Home Economics", "Yoruba", "French", "C.R.S / I.R.S", "Creative Art", "Writing"];
    const secondarySubjects = ["Mathematics", "English Language", "Biology", "Physics", "Chemistry", "Civic Education", "Economics", "Geography", "Government", "Literature", "Agric Science", "Further Maths", "Computer Studies", "Data Processing", "C.R.S / I.R.S"];
    
    const standardSubjects = student.section === 'secondary' ? secondarySubjects : primarySubjects;

    const tableData = standardSubjects.map(subjectName => {
        const found = results.find(r => r.subject?.name.toLowerCase() === subjectName.toLowerCase());
        if (found) {
            return [found.subject?.name, found.ca_score, "-", found.exam_score, found.total_score, found.grade, found.grade === 'A' ? 'Excellent' : found.grade === 'B' ? 'V.Good' : found.grade === 'C' ? 'Good' : 'Pass'];
        } else {
            return [subjectName, "-", "-", "-", "-", "-", "-"];
        }
    });

    results.forEach(r => {
        if (!standardSubjects.map(s => s.toLowerCase()).includes(r.subject?.name.toLowerCase())) {
            tableData.push([r.subject?.name, r.ca_score, "-", r.exam_score, r.total_score, r.grade, r.grade === 'A' ? 'Excellent' : r.grade === 'B' ? 'V.Good' : r.grade === 'C' ? 'Good' : 'Pass']);
        }
    });

    autoTable(doc, {
        startY: 65, margin: { left: 10 }, tableWidth: 130,
        head: [['SUBJECTS', 'CA', 'TEST', 'EXAM', 'TOTAL', 'GRD', 'REMARKS']],
        body: tableData, theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: 0, lineColor: 100, lineWidth: 0.1, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { lineColor: 100, lineWidth: 0.1, fontSize: 9, cellPadding: 1.5 },
        styles: { valign: 'middle' },
        columnStyles: { 0: { cellWidth: 35 }, 6: { cellWidth: 25 } }
    });

    const rightX = 145; const rightY = 65; const rightW = 55;
    const opened = reportDetails?.school_opened || 0;
    const present = reportDetails?.times_present || 0;
    const absent = reportDetails?.times_absent || 0;
    
    autoTable(doc, {
        startY: rightY, margin: { left: rightX }, tableWidth: rightW,
        head: [['ATTENDANCE SUMMARY']],
        body: [['School Opened:', opened], ['Present:', present], ['Absent:', absent]],
        theme: 'grid', headStyles: { fillColor: [220, 220, 220], textColor: 0, fontSize: 8 },
        bodyStyles: { fontSize: 8, cellPadding: 1 },
    });

    const skillMap = reportDetails?.psychomotor_skills || {};
    const defaultSkills = ["Handwriting", "Fluency", "Sports", "Drawing", "Punctuality", "Neatness", "Politeness", "Honesty", "Leadership", "Attentiveness"];
    const skillList = Object.keys(skillMap).length > 0 ? Object.keys(skillMap) : defaultSkills;
    
    const skillBody = skillList.map(skill => {
        const val = skillMap[skill] || "";
        return [skill, val === 5 ? "X":"", val === 4 ? "X":"", val === 3 ? "X":"", val <= 2 && val > 0 ? "X":""];
    });

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 2, margin: { left: rightX }, tableWidth: rightW,
        head: [['SKILLS', '5', '4', '3', '2']],
        body: skillBody, theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: 0, fontSize: 8 },
        bodyStyles: { fontSize: 8, cellPadding: 1 }, columnStyles: { 0: { cellWidth: 25 } }
    });

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 2, margin: { left: rightX }, tableWidth: rightW,
        head: [['RESULT SUMMARY']],
        body: [['Distinctions:', results.filter(r => r.grade === 'A').length], ['Credits:', results.filter(r => ['B','C'].includes(r.grade)).length], ['Passes:', results.filter(r => r.grade === 'D' || r.grade === 'E').length], ['Failures:', results.filter(r => r.grade === 'F').length]],
        theme: 'grid', headStyles: { fillColor: [220, 220, 220], textColor: 0, fontSize: 8 },
    });

    let footerY = 220; 
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    
    doc.text(`FORM MASTER'S REPORT:   ${reportDetails?.form_master_remark || ""}`, 10, footerY);
    doc.line(55, footerY, 130, footerY);
    footerY += 8;
    doc.text(`HOUSE MASTER'S REMARK:  ${reportDetails?.house_master_remark || ""}`, 10, footerY);
    doc.line(55, footerY, 130, footerY);
    footerY += 8;
    doc.text(`PRINCIPAL'S REMARK:         ${reportDetails?.principal_remark || ""}`, 10, footerY);
    doc.line(55, footerY, 130, footerY);

    const sigBoxX = 140; const sigBoxY = 210;
    doc.rect(sigBoxX, sigBoxY, 60, 40);
    try { if (principalSignatureBase64) doc.addImage(principalSignatureBase64, 'PNG', sigBoxX + 10, sigBoxY + 5, 40, 20); } catch (e) {}

    doc.setFontSize(7);
    doc.text("SIGNATURE & STAMP", sigBoxX + 5, sigBoxY + 35);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, sigBoxX + 35, sigBoxY + 35);

    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("NEXT TERM BEGINS: ___________________", 10, footerY + 15);

    doc.save(`${student.full_name}_Official_Report.pdf`);
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex justify-between items-center border-b border-gray-100">
         <div className="flex items-center gap-3"><Avatar className="w-10 h-10 border-2 border-slate-100"><AvatarImage src={student.passport_url} /><AvatarFallback className="bg-slate-900 text-white">{student.full_name[0]}</AvatarFallback></Avatar><div className="leading-tight"><h1 className="font-bold text-sm text-slate-800 truncate max-w-[150px]">{student.full_name}</h1><p className="text-xs text-slate-500">{student.admission_number}</p></div></div>
         <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50"><LogOut className="w-5 h-5" /></Button>
      </div>

      <div className="flex justify-center mt-4 mb-6">
        <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 flex gap-2">
            <button onClick={() => setActiveTab('results')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'results' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-gray-50'}`}>Result Sheet</button>
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-gray-50'}`}>My Profile</button>
        </div>
      </div>

      <main className="p-4 container mx-auto max-w-4xl">
        {activeTab === 'results' && (
            <div className="space-y-6">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2 text-slate-800"><Search className="w-5 h-5 text-gold"/> Check Result</CardTitle></CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Select value={selectedSession} onValueChange={setSelectedSession}><SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2025/2026">2025/2026</SelectItem></SelectContent></Select>
                            <Select value={selectedTerm} onValueChange={setSelectedTerm}><SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1st Term">1st Term</SelectItem></SelectContent></Select>
                        </div>
                        <Button onClick={fetchResult} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 shadow-md">{loading ? <Loader2 className="animate-spin" /> : "View Official Report"}</Button>
                    </CardContent>
                </Card>

                {results.length > 0 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-white border-l-4 border-blue-500 shadow-sm"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-gray-500 font-bold uppercase">Total Subjects</p><p className="text-2xl font-bold text-slate-800">{results.length}</p></div><BookOpen className="w-8 h-8 text-blue-100" /></CardContent></Card>
                            <Card className="bg-white border-l-4 border-purple-500 shadow-sm"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-gray-500 font-bold uppercase">Average</p><p className="text-2xl font-bold text-slate-800">{stats.average}%</p></div><Calculator className="w-8 h-8 text-purple-100" /></CardContent></Card>
                            <Card className="bg-white border-l-4 border-green-500 shadow-sm"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-gray-500 font-bold uppercase">Remark</p><p className="text-xl font-bold text-green-600">{stats.remark}</p></div><Award className="w-8 h-8 text-green-100" /></CardContent></Card>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-slate-800">Academic Breakdown</h3>
                                <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2 border-green-600 text-green-700 hover:bg-green-50"><Download className="w-4 h-4" /> Download Report</Button>
                            </div>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-center">CA</TableHead><TableHead className="text-center">Exam</TableHead><TableHead className="text-center font-bold">Total</TableHead><TableHead className="text-center">Grade</TableHead></TableRow></TableHeader>
                                    <TableBody>{results.map(res => (<TableRow key={res.id}><TableCell className="font-medium">{res.subject?.name}</TableCell><TableCell className="text-center">{res.ca_score}</TableCell><TableCell className="text-center">{res.exam_score}</TableCell><TableCell className="text-center font-bold">{res.total_score}</TableCell><TableCell className="text-center"><Badge variant={res.grade === 'F' ? 'destructive' : 'outline'}>{res.grade}</Badge></TableCell></TableRow>))}</TableBody>
                                </Table>
                            </div>
                            <div className="md:hidden divide-y divide-gray-100">
                                {results.map(res => (<div key={res.id} className="p-4 flex justify-between items-center"><div><p className="font-bold text-slate-800">{res.subject?.name}</p><p className="text-xs text-gray-400">CA: {res.ca_score} | Exam: {res.exam_score}</p></div><div className="text-right"><div className="text-xl font-bold text-slate-900">{res.total_score}</div><Badge variant={res.grade === 'F' ? 'destructive' : 'outline'}>{res.grade}</Badge></div></div>))}
                            </div>
                        </div>
                    </div>
                ) : ( !loading && <div className="text-center py-16 text-slate-400">No results found.</div> )}
            </div>
        )}
        
        {activeTab === 'profile' && (
            <div className="max-w-md mx-auto">
                <Card className="shadow-lg border-0">
                    <CardHeader className="text-center bg-slate-50 pb-8 pt-8">
                        <div className="relative inline-block mx-auto mb-4">
                            <Avatar className="w-32 h-32 border-4 border-white shadow-md"><AvatarImage src={student.passport_url} /><AvatarFallback>ST</AvatarFallback></Avatar>
                            <label htmlFor="upload-pass" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg"><Upload className="w-4 h-4" /></label>
                            <input id="upload-pass" type="file" className="hidden" onChange={(e) => e.target.files && setMyPassport(e.target.files[0])} />
                        </div>
                        {myPassport && <Button onClick={handleProfileUpdate} disabled={uploading} size="sm" className="mb-2">{uploading ? <Loader2 className="animate-spin" /> : "Save New Photo"}</Button>}
                        <h2 className="text-2xl font-bold text-slate-900">{student.full_name}</h2>
                        <Badge variant="secondary" className="mt-2">{student.class?.name}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-1"><Label className="text-xs text-gray-400 uppercase font-bold">Admission Number</Label><div className="p-3 bg-gray-50 rounded-lg font-mono font-medium border border-gray-100">{student.admission_number}</div></div>
                        <div className="space-y-1"><Label className="text-xs text-gray-400 uppercase font-bold">Login PIN</Label><div className="p-3 bg-blue-50 rounded-lg font-mono font-bold text-blue-700 border border-blue-100 tracking-widest text-center">{student.pin_code}</div></div>
                        <div className="space-y-1"><Label className="text-xs text-gray-400 uppercase font-bold">Gender</Label><div className="p-3 bg-gray-50 rounded-lg font-medium border border-gray-100">{student.gender || "N/A"}</div></div>
                    </CardContent>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;