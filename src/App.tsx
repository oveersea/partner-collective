import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import KYCVerification from "./pages/KYCVerification";
import HiringRequest from "./pages/HiringRequest";
import ProjectRequest from "./pages/ProjectRequest";
import VendorRegistration from "./pages/VendorRegistration";
import Matchmaking from "./pages/Matchmaking";
import JobDetail from "./pages/JobDetail";
import Features from "./pages/Features";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserDetail from "./pages/AdminUserDetail";
import Learning from "./pages/Learning";
import LearningDetail from "./pages/LearningDetail";
import CreditBalance from "./pages/CreditBalance";
import AdminProgramEdit from "./pages/AdminProgramEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kyc" element={<KYCVerification />} />
            <Route path="/hiring-request" element={<HiringRequest />} />
            <Route path="/project-request" element={<ProjectRequest />} />
            <Route path="/vendor-registration" element={<VendorRegistration />} />
            <Route path="/matchmaking" element={<Matchmaking />} />
            <Route path="/job/:slug" element={<JobDetail />} />
            <Route path="/features" element={<Features />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/user/:userId" element={<AdminUserDetail />} />
            <Route path="/admin/program/:programId" element={<AdminProgramEdit />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/:slug" element={<LearningDetail />} />
            <Route path="/credit-balance" element={<CreditBalance />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
