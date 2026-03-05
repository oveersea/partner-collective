import {
  LayoutDashboard, Users, Shield, CreditCard, FileText, Building2,
  GraduationCap, ClipboardCheck, BarChart3, Landmark, FolderKanban, UserCheck, UsersRound, Store,
  Image as ImageIcon, Zap, Mail, KeyRound,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

import logoLight from "@/assets/logo-light.png";

// "Requests" is separated out as a hero item
const heroItem = { id: "requests", label: "Request & Order", icon: FolderKanban };

export const adminSections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "requests", label: "Request & Order", icon: FolderKanban },
  { id: "users", label: "User Management", icon: Users },
  { id: "companies", label: "Company Management", icon: Building2 },
  { id: "vendors", label: "Vendor Management", icon: Store },
  { id: "teams", label: "Team Management", icon: UsersRound },
  { id: "kyc", label: "KYC Verification", icon: Shield },
  
  { id: "credits", label: "Credits & Wallet", icon: CreditCard },
  { id: "content", label: "Opportunities & Jobs", icon: FileText },
  { id: "case_studies", label: "Case Studies", icon: ImageIcon },
  { id: "learning", label: "Learning Programs", icon: GraduationCap },
  { id: "institutions", label: "Institutions", icon: Landmark },
  { id: "assessment", label: "Assessment", icon: ClipboardCheck },
  { id: "insights", label: "Insights & Survey", icon: BarChart3 },
  { id: "approvals", label: "Profile Approvals", icon: UserCheck },
  { id: "email", label: "Email Notifications", icon: Mail },
  { id: "api_keys", label: "API Keys", icon: KeyRound },
  { id: "settings", label: "Settings", icon: Shield },
];

// Regular menu items (excluding overview & requests which are placed separately)
const regularItems = adminSections.filter(s => s.id !== "overview" && s.id !== "requests");

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (s: string) => void;
}

const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed ? (
            <div className="px-3 py-4">
              <img src={logoLight} alt="Oveersea" className="h-8" />
            </div>
          ) : (
            <div className="flex justify-center py-4">
              <img src="/oveersea-icon.png" alt="Oveersea" className="h-7 w-7 rounded" />
            </div>
          )}

          {/* Overview */}
          <div className={collapsed ? "px-1 mt-1 mb-1 flex justify-center" : "px-2 mt-1 mb-1"}>
            <button
              onClick={() => onSectionChange("overview")}
              className={`flex items-center justify-center gap-2.5 rounded-lg text-sm font-semibold transition-all ${
                collapsed ? "w-10 h-10 p-0" : "w-full px-3 py-2.5"
              } ${
                activeSection === "overview"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              }`}
              title={collapsed ? "Overview" : undefined}
            >
              <LayoutDashboard className={collapsed ? "w-5 h-5" : "w-4 h-4"} />
              {!collapsed && <span>Overview</span>}
            </button>
          </div>

          {/* Hero: Request & Order */}
          <div className={collapsed ? "px-1 mt-1 mb-1 flex justify-center" : "px-2 mt-1 mb-1"}>
            <button
              onClick={() => onSectionChange("requests")}
              className={`flex items-center justify-center gap-2.5 rounded-lg text-sm font-semibold transition-all ${
                collapsed ? "w-10 h-10 p-0" : "w-full px-3 py-2.5"
              } ${
                activeSection === "requests"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              }`}
              title={collapsed ? "Request & Order" : undefined}
            >
              <Zap className={collapsed ? "w-5 h-5" : "w-4 h-4"} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Request & Order</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeSection === "requests"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/20 text-primary"
                  }`}>
                    HUB
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Separator */}
          <div className="mx-3 my-1 h-px bg-border" />

          {/* Regular menu items */}
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {regularItems.map((s) => (
                <SidebarMenuItem key={s.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(s.id)}
                    isActive={activeSection === s.id}
                    tooltip={s.label}
                  >
                    <s.icon className={collapsed ? "!w-5 !h-5" : "w-4 h-4"} />
                    {!collapsed && <span>{s.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
