import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, KeyRound, User, Mail, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; //
import { supabase } from "@/lib/supabase";
import logo from "/Almustapha.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  
  // Staff State
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  
  // Student State
  const [admissionNo, setAdmissionNo] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [section, setSection] = useState("");

  // --- 1. STAFF LOGIN LOGIC (Proprietor, Principal, Teachers) ---
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail || !staffPassword) {
      toast({ variant: "destructive", title: "Error", description: "Please enter email and password." });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("email", staffEmail)
        .eq("password", staffPassword) // In a real app, use Supabase Auth for security!
        .single();

      if (error || !data) throw new Error("Invalid Credentials");

      // Save Session
      localStorage.setItem("staffData", JSON.stringify(data));
      localStorage.setItem("userRole", data.role); 

      toast({ title: "Welcome back!", description: `Logged in as ${data.role.toUpperCase()}` });

      // Smart Redirect based on Role
      if (data.role === 'proprietor') {
        navigate("/admin/proprietor");
      } else if (data.role === 'principal') {
        navigate("/admin/principal");
      } else if (data.role === 'head_teacher') {
        navigate("/admin/head-teacher");
      } else {
        navigate("/teacher/dashboard");
      }

    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. STUDENT LOGIN LOGIC ---
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionNo || !pinCode) {
      toast({ variant: "destructive", title: "Error", description: "Enter Admission Number and PIN." });
      return;
    }

    setLoading(true);
    try {
      // Find student matching Admission No AND Pin
      // We also check the 'section' if provided, though Admission No is usually unique enough
      let query = supabase
        .from("students")
        .select("*, class:classes(name)")
        .eq("admission_number", admissionNo) // Format: AMS/2025/001
        .eq("pin_code", pinCode)
        .single();

      const { data, error } = await query;

      if (error || !data) throw new Error("Invalid Admission Number or PIN");

      // Check Active Status (Fee Management)
      if (data.is_active === false) {
        throw new Error("Access Restricted. Please contact the Bursar.");
      }

      // Save Session
      localStorage.setItem("studentData", JSON.stringify(data));
      localStorage.setItem("userRole", "student");

      toast({ title: "Login Successful", description: `Welcome, ${data.full_name}` });
      navigate("/student/dashboard");

    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Login Failed", description: err.message || "Invalid credentials" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto shadow-gold">
              <img src={logo} className="w-14 h-14 rounded-full" alt="Al-Mustapha Logo" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Al-Mustapha Portal</h1>
            <p className="text-muted-foreground">Secure Access Gateway</p>
          </div>

          <Card className="border-border shadow-elevated">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-center text-xl">Choose Login Type</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="staff" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="staff">Staff / Admin</TabsTrigger>
                  <TabsTrigger value="student">Student / Parent</TabsTrigger>
                </TabsList>

                {/* --- STAFF FORM --- */}
                <TabsContent value="staff">
                  <form onSubmit={handleStaffLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="admin@almustapha.edu.ng" 
                          className="pl-9"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••" 
                          className="pl-9"
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "Login to Dashboard"}
                    </Button>
                  </form>
                </TabsContent>

                {/* --- STUDENT FORM --- */}
                <TabsContent value="student">
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Section</Label>
                      <Select value={section} onValueChange={setSection}>
                        <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nursery">Nursery (KG & Pre-Nursery)</SelectItem>
                          <SelectItem value="primary">Primary Section</SelectItem>
                          <SelectItem value="secondary">Secondary (JSS/SSS)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Admission Number</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="AMS/2025/001" 
                          className="pl-9 uppercase"
                          value={admissionNo}
                          onChange={(e) => setAdmissionNo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Access PIN</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="1234" 
                          className="pl-9"
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold-dark" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "Check Result"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;