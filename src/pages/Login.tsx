import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, KeyRound, User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase"; // Supabase Connected

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [parentAdmissionNo, setParentAdmissionNo] = useState("");
  const [parentPin, setParentPin] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!staffEmail || !staffPassword) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter email and password.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Check the 'staff' table
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("email", staffEmail)
        .eq("password", staffPassword) // checking plain text for this demo
        .single();

      if (error || !data) {
        throw new Error("Invalid Email or Password");
      }

      // 2. Save session
      localStorage.setItem("staffData", JSON.stringify(data));

      toast({
        title: "Login Successful",
        description: `Welcome, ${data.role === 'admin' ? 'Principal' : 'Teacher'} ${data.full_name}`,
      });

      // 3. Smart Redirect based on Role
      if (data.role === 'admin') {
        navigate("/admin/dashboard");
      } else {
        navigate("/teacher/results");
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!parentAdmissionNo || !parentPin) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both Admission Number and PIN.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Query Supabase for the student
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("admission_number", parentAdmissionNo) // Check Admission No
        .eq("pin_code", parentPin)                 // Check PIN
        .single();                                 // Expecting exactly one student

      // 2. Handle Errors (Wrong PIN or Student not found)
      if (error || !data) {
        throw new Error("Invalid Admission Number or PIN");
      }

      // 3. Success! Save student to LocalStorage
      localStorage.setItem("studentData", JSON.stringify(data));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.full_name}!`,
      });

      // 4. Redirect to the Result Portal
      navigate("/portal/result");

    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Could not verify credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <Link to="/" className="inline-flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-elevated mb-3">
                <GraduationCap className="w-8 h-8 text-gold" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Al-Mustapha Portal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Access your school portal
              </p>
            </Link>
          </div>

          {/* Login Card */}
          <Card className="border-border shadow-elevated animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-display text-xl">Welcome Back</CardTitle>
              <CardDescription>
                Login to access the school portal
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="staff" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="staff" className="flex items-center gap-2">
                   
                    Staff Login
                  </TabsTrigger>
                  <TabsTrigger value="parent" className="flex items-center gap-2">
                   
                    Student Portal
                  </TabsTrigger>
                </TabsList>

                {/* Staff Login */}
                <TabsContent value="staff">
                  <form onSubmit={handleStaffLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="staff-email"
                          type="email"
                          placeholder="teacher@almustapha.edu.ng"
                          className="pl-10"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="staff-password"
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-input" />
                        <span className="text-muted-foreground">Remember me</span>
                      </label>
                      <a href="#" className="text-gold hover:underline">
                        Forgot password?
                      </a>
                    </div>

                    <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold-dark">
                      Login as Staff
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                {/* Parent/Student Login */}
                <TabsContent value="parent">
                  <form onSubmit={handleParentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="section">Select Section</Label>
                      <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose section" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="nursery">Nursery Section</SelectItem>
                          <SelectItem value="primary">Primary Section</SelectItem>
                          <SelectItem value="secondary">Secondary (College)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admission-no">Admission Number</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="admission-no"
                          type="text"
                          placeholder="e.g., FUT/PRI/001"
                          className="pl-10"
                          value={parentAdmissionNo}
                          onChange={(e) => setParentAdmissionNo(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pin">Result PIN</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="pin"
                          type="password"
                          placeholder="Enter your PIN"
                          className="pl-10"
                          value={parentPin}
                          onChange={(e) => setParentPin(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Result PIN can be obtained from your child's class teacher 
                        or the school bursar. Each PIN is valid for one term only.
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gold text-primary hover:bg-gold-dark"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                        </>
                      ) : (
                        <>
                           Login as Student <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Back Link */}
          <p className="text-center mt-6 hover:border-2 rounded-md  hover:bg-gold-dark hover:slide-in-from-top-2 hover:animate-bounce  border-4 text-sm text-muted-foreground">
            <Link to="/" className="t hover:underline ">
              ← Back to Homepage
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;