import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// New Dashboards
import AdminDashboard from "./pages/AdminDashboard"; 
import PrincipalDashboard from "./pages/PrincipalDashboard"; 
import HeadTeacherDashboard from "./pages/HeadTeacherDashboard"; 
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

const queryClient = new QueryClient();

// --- SMART PROTECTED ROUTE ---
// This acts as a security guard. It checks if you are logged in AND if you have the right role.
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const userRole = localStorage.getItem("userRole");

  // 1. Not logged in? Go to Login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in but wrong role? Redirect to YOUR correct dashboard
  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'proprietor') return <Navigate to="/admin/proprietor" replace />;
    if (userRole === 'principal') return <Navigate to="/admin/principal" replace />;
    if (userRole === 'head_teacher') return <Navigate to="/admin/head-teacher" replace />;
    if (userRole === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (userRole === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  // 3. Access Granted
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* === 1. PROPRIETOR DASHBOARD === */}
          {/* Redirect old /admin/dashboard to new path */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin/proprietor" replace />} />
          <Route 
            path="/admin/proprietor" 
            element={
              <ProtectedRoute allowedRoles={['proprietor']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* === 2. PRINCIPAL DASHBOARD === */}
          <Route 
            path="/admin/principal" 
            element={
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalDashboard />
              </ProtectedRoute>
            } 
          />

          {/* === 3. HEAD TEACHER DASHBOARD === */}
          <Route 
            path="/admin/head-teacher" 
            element={
              <ProtectedRoute allowedRoles={['head_teacher']}>
                <HeadTeacherDashboard />
              </ProtectedRoute>
            } 
          />

          {/* === 4. TEACHER DASHBOARD === */}
          <Route 
            path="/teacher/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />

          {/* === 5. STUDENT DASHBOARD === */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch All (404) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;