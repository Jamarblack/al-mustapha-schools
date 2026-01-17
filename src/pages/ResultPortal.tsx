import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import ReportCard from "@/components/results/ReportCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Types matching your database structure
interface AcademicResult {
  subject_id: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  subject: {
    name: string;
  };
}

const ResultPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [section, setSection] = useState<"nursery" | "primary" | "secondary">("secondary");

  // 1. Load Student on Mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedData = localStorage.getItem("studentData");
      
      if (!storedData) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please login to view results.",
        });
        navigate("/login");
        return;
      }

      const studentData = JSON.parse(storedData);
      setStudent(studentData);
      
      // Determine section based on some logic or default to what's in DB
      // For now, we default to Secondary, or you could add a 'section' column to students table
      // setSection(studentData.section || "secondary"); 

      await fetchResults(studentData.id);
    };

    checkAuth();
  }, [navigate, toast]);

  // 2. Fetch Real Results from Supabase
  const fetchResults = async (studentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academic_results')
        .select(`
          ca_score, 
          exam_score, 
          total_score, 
          grade,
          subject:subjects (name)
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      // Transform data for the Report Card component
      const formattedResults = data.map((item: any) => ({
        subject: item.subject?.name || "Unknown Subject",
        ca: item.ca_score,
        exam: item.exam_score,
        total: item.total_score,
        grade: item.grade,
        remark: getRemark(item.grade) // Helper function for remarks
      }));

      setResults(formattedResults);
    } catch (error: any) {
      console.error("Error fetching results:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load academic results.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRemark = (grade: string) => {
    if (grade === 'A') return "Excellent";
    if (grade === 'B') return "Very Good";
    if (grade === 'C') return "Good";
    if (grade === 'D') return "Fair";
    return "Needs Improvement";
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem("studentData");
    navigate("/login");
  };

  // 3. Prepare Data for ReportCard Component
  // We construct an object that looks like the mock data structure
  const reportData = {
    studentName: student?.full_name || "Student",
    admissionNo: student?.admission_number || "...",
    class: "SSS 1 Science", // Ideally fetched from DB (requires joining classes table)
    term: "1st Term",
    session: "2025/2026",
    subjects: results,
    // Add dummy summary data for now (or calculate it)
    summary: {
      totalScore: results.reduce((acc, curr) => acc + curr.total, 0),
      average: results.length > 0 ? (results.reduce((acc, curr) => acc + curr.total, 0) / results.length).toFixed(1) : "0",
      position: "N/A", // Position requires complex backend logic
      outOf: "N/A",
      decision: "Promoted"
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4 print:pt-0 print:px-0">
        <div className="container mx-auto max-w-4xl">
          {/* Actions Bar (hidden on print) */}
          <div className="print:hidden mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="flex items-center gap-3">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print Result
              </Button>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Report Card */}
          <div className="animate-fade-in">
            {results.length > 0 ? (
              <ReportCard variant={section} data={reportData} />
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-lg font-medium text-muted-foreground">
                  No results found for this term yet.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please check back later or contact the school admin.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultPortal;