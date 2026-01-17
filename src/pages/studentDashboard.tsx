import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { LogOut, User, Search, Loader2, Download, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  
  // Search Filters
  const [selectedSession, setSelectedSession] = useState("2025/2026");
  const [selectedTerm, setSelectedTerm] = useState("1st Term");

  useEffect(() => {
    const data = localStorage.getItem("studentData");
    if (!data) {
      navigate("/login");
      return;
    }
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
      // Fetch results joined with Subject Names
      // ONLY fetch if 'is_approved' is true!
      const { data, error } = await supabase
        .from('academic_results')
        .select(`
          *,
          subject:subjects(name)
        `)
        .eq('student_id', student.id)
        .eq('session', selectedSession)
        .eq('term', selectedTerm)
        .eq('is_approved', true); // <--- SECURITY CHECK

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: "No Results Found", description: "Results for this term are not yet published." });
      } else {
        setResults(data);
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          
          {/* Header & Profile */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-gold shadow-lg">
                <AvatarImage src={student.passport_url} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-2xl">{student.full_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground capitalize">{student.full_name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" /> {student.admission_number} | {student.class?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>

          {/* Result Checker Card */}
          <Card className="mb-8 border-gold/20 shadow-soft">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" /> Check Result
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <span className="text-sm font-medium">Academic Session</span>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025/2026">2025/2026</SelectItem>
                      <SelectItem value="2026/2027">2026/2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex-1">
                  <span className="text-sm font-medium">Term</span>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Term">1st Term</SelectItem>
                      <SelectItem value="2nd Term">2nd Term</SelectItem>
                      <SelectItem value="3rd Term">3rd Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={fetchResult} disabled={loading} className="bg-primary min-w-[140px]">
                  {loading ? <Loader2 className="animate-spin" /> : "View Result"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Display Area */}
          {results.length > 0 ? (
            <Card className="animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="flex flex-row justify-between items-center border-b">
                <div>
                  <CardTitle className="text-xl text-primary">{selectedTerm} Report Sheet</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedSession} Academic Session</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" /> Print
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40%]">Subject</TableHead>
                      <TableHead className="text-center">C.A (40)</TableHead>
                      <TableHead className="text-center">Exam (60)</TableHead>
                      <TableHead className="text-center font-bold text-primary">Total (100)</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="font-medium">{res.subject?.name || "Unknown Subject"}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{res.ca_score}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{res.exam_score}</TableCell>
                        <TableCell className="text-center font-bold text-lg">{res.total_score}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold 
                            ${res.grade === 'A' ? 'bg-green-100 text-green-700' : 
                              res.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {res.grade}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
             !loading && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No results found for the selected session/term.</p>
              </div>
             )
          )}

        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;