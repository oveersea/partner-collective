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
import Services from "./pages/Services";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserDetail from "./pages/AdminUserDetail";
import Learning from "./pages/Learning";
import LearningDetail from "./pages/LearningDetail";
import CreditBalance from "./pages/CreditBalance";
import AdminProgramEdit from "./pages/AdminProgramEdit";
import AdminAssessmentDetail from "./pages/AdminAssessmentDetail";
import AdminOpportunityDetail from "./pages/AdminOpportunityDetail";
import AdminCompanyDetail from "./pages/AdminCompanyDetail";
import AdminCompanyCreate from "./pages/AdminCompanyCreate";
import AdminVendorCreate from "./pages/AdminVendorCreate";
import AdminCreditDetail from "./pages/AdminCreditDetail";
import AdminHiringDetail from "./pages/AdminHiringDetail";
import AdminEnrollmentDetail from "./pages/AdminEnrollmentDetail";
import NotFound from "./pages/NotFound";
import MobileBottomNav from "./components/MobileBottomNav";
import ServiceDetail from "./pages/ServiceDetail";
import ServiceOrder from "./pages/ServiceOrder";
import Portfolios from "./pages/Portfolios";
import CaseStudies from "./pages/CaseStudies";
import CaseStudyDetail from "./pages/CaseStudyDetail";
import VendorDashboard from "./pages/VendorDashboard";
import TeamDashboard from "./pages/TeamDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import Companies from "./pages/Companies";
import Checkout from "./pages/Checkout";
import Order from "./pages/Order";
import Verification from "./pages/Verification";
import PublicProfile from "./pages/PublicProfile";
import MyRequests from "./pages/MyRequests";
import AssessmentDetail from "./pages/AssessmentDetail";
import CareerPathPage from "./pages/CareerPath";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Resources from "./pages/Resources";
import Insights from "./pages/Insights";
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
            <Route path="/job/:oveercode" element={<JobDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/user/:oveercode" element={<AdminUserDetail />} />
            <Route path="/admin/program/:oveercode" element={<AdminProgramEdit />} />
            <Route path="/admin/assessment/:oveercode" element={<AdminAssessmentDetail />} />
            <Route path="/admin/opportunity/:oveercode" element={<AdminOpportunityDetail />} />
            <Route path="/admin/company/create" element={<AdminCompanyCreate />} />
            <Route path="/admin/company/:oveercode" element={<AdminCompanyDetail />} />
            <Route path="/admin/vendor/create" element={<AdminVendorCreate />} />
            <Route path="/admin/credit/:id" element={<AdminCreditDetail />} />
            <Route path="/admin/hiring/:oveercode" element={<AdminHiringDetail />} />
            <Route path="/admin/enrollment/:id" element={<AdminEnrollmentDetail />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/:oveercode" element={<LearningDetail />} />
            <Route path="/credit-balance" element={<CreditBalance />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/services/:slug/order" element={<ServiceOrder />} />
            <Route path="/portfolios" element={<Portfolios />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
            <Route path="/vendor/:oveercode" element={<VendorDashboard />} />
            <Route path="/team/:oveercode" element={<TeamDashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/company/:oveercode" element={<CompanyDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order" element={<Order />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/p/:oveercode" element={<PublicProfile />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/assessment/:oveercode" element={<AssessmentDetail />} />
            <Route path="/career-path" element={<CareerPathPage />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:oveercode" element={<EventDetail />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/insights" element={<Insights />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MobileBottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
