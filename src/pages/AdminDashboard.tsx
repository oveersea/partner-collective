import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar, { adminSections } from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCompanies from "@/components/admin/AdminCompanies";
import AdminKYC from "@/components/admin/AdminKYC";
import AdminHiring from "@/components/admin/AdminHiring";
import AdminCredits from "@/components/admin/AdminCredits";
import AdminContent from "@/components/admin/AdminContent";
import AdminCaseStudies from "@/components/admin/AdminCaseStudies";
import AdminLearning from "@/components/admin/AdminLearning";
import AdminAssessment from "@/components/admin/AdminAssessment";
import AdminInsights from "@/components/admin/AdminInsights";
import AdminInstitutions from "@/components/admin/AdminInstitutions";
import AdminVendors from "@/components/admin/AdminVendors";
import AdminRequests from "@/components/admin/AdminRequests";
import AdminApprovals from "@/components/admin/AdminApprovals";
import AdminTeams from "@/components/admin/AdminTeams";
import AdminEmailNotifications from "@/components/admin/AdminEmailNotifications";
import { LogOut, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .in("role", ["admin", "superadmin"]);

    setIsAdmin(!!data && data.length > 0);
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <Button onClick={() => navigate("/dashboard")}>Kembali ke Dashboard</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview": return <AdminOverview />;
      case "users": return <AdminUsers />;
      case "companies": return <AdminCompanies />;
      case "vendors": return <AdminVendors />;
      case "teams": return <AdminTeams />;
      case "kyc": return <AdminKYC />;
      case "hiring": return <AdminHiring />;
      case "credits": return <AdminCredits />;
      case "requests": return <AdminRequests />;
      case "content": return <AdminContent />;
      case "case_studies": return <AdminCaseStudies />;
      case "learning": return <AdminLearning />;
      case "institutions": return <AdminInstitutions />;
      case "assessment": return <AdminAssessment />;
      case "insights": return <AdminInsights />;
      case "approvals": return <AdminApprovals />;
      case "email": return <AdminEmailNotifications />;
      default: return <AdminOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-semibold text-foreground">Dashboard Admin</span>
              {activeSection !== "overview" && (
                <>
                  <span className="mx-1 h-4 w-px bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {adminSections.find(s => s.id === activeSection)?.label || activeSection}
                  </span>
                </>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 p-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">Admin</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
