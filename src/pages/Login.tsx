import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock, User, School, Key } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<"staff" | "student">("staff");

  // Staff State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Student State
  const [admissionNo, setAdmissionNo] = useState("");
  // 👇 THIS WAS MISSING IN YOUR CODE
  const [pin, setPin] = useState(""); 
  
  // --- STAFF LOGIN ---
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Invalid email or password.");
      }

      toast({ title: "Login Successful", description: `Welcome back, ${data.full_name}` });
      
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("staffData", JSON.stringify(data));

      if (data.role === 'proprietor') navigate("/admin/proprietor");
      else if (data.role === 'principal') navigate("/admin/principal");
      else if (data.role === 'head_teacher') navigate("/admin/head-teacher");
      else navigate("/teacher/dashboard");

    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- STUDENT LOGIN ---
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanAd = admissionNo.trim().toUpperCase();
      const cleanPin = pin.trim();

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('admission_number', cleanAd)
        .eq('pin_code', cleanPin)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Invalid Admission Number or PIN.");
      }

      if (data.is_active === false) {
        throw new Error("Access Denied. Please contact the school office.");
      }

      toast({ title: "Login Successful", description: `Welcome, ${data.full_name}` });

      localStorage.setItem("userRole", "student");
      localStorage.setItem("studentData", JSON.stringify(data));
      navigate("/student/dashboard");

    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
           <div className="bg-white p-3 rounded-full inline-block shadow-sm">
             <School className="w-10 h-10 text-green-700" />
           </div>
           <h1 className="text-3xl font-bold text-slate-900 font-display">Al-Mustapha Portal</h1>
           <p className="text-slate-500">Secure Access Gateway</p>
        </div>

        <Card className="border-t-4 border-t-gold shadow-lg">
          <CardHeader><CardTitle className="text-center text-lg">Choose Login Type</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="staff" onValueChange={(v) => setUserType(v as "staff" | "student")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="staff">Staff / Admin</TabsTrigger>
                <TabsTrigger value="student">Student / Parent</TabsTrigger>
              </TabsList>

              <TabsContent value="staff">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input className="pl-10" placeholder="staff@almustapha.edu.ng" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input className="pl-10" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Secure Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Admission Number</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input className="pl-10 uppercase placeholder:normal-case" placeholder="AMS/PRI/7504" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Access PIN</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      {/* 👇 THIS IS WHERE YOUR ERROR WAS (pin variable) */}
                      <Input type="password" className="pl-10" placeholder="• • • •" value={pin} onChange={(e) => setPin(e.target.value)} required maxLength={4} />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gold text-slate-900 font-bold hover:bg-yellow-500">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Check Result"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="link" className="text-xs text-slate-400" onClick={() => navigate('/')}>← Back to Home</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;