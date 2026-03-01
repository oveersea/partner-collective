import {
  LayoutDashboard, Users, Shield, Briefcase, CreditCard, FileText, Building2,
  GraduationCap, ClipboardCheck, BarChart3, Landmark, FolderKanban, UserCheck, UsersRound, Store,
  Image as ImageIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

import logoLight from "@/assets/logo-light.png";

export const adminSections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Manajemen User", icon: Users },
  { id: "companies", label: "Manajemen Perusahaan", icon: Building2 },
  { id: "vendors", label: "Manajemen Vendor", icon: Store },
  { id: "teams", label: "Manajemen Tim", icon: UsersRound },
  { id: "kyc", label: "Verifikasi KYC", icon: Shield },
  { id: "hiring", label: "Hiring & Matching", icon: Briefcase },
  { id: "requests", label: "Request & Order", icon: FolderKanban },
  { id: "credits", label: "Kredit & Wallet", icon: CreditCard },
  { id: "content", label: "Konten & Program", icon: FileText },
  { id: "case_studies", label: "Case Studies", icon: ImageIcon },
  { id: "learning", label: "Learning Program", icon: GraduationCap },
  { id: "institutions", label: "Institusi", icon: Landmark },
  { id: "assessment", label: "Assessment", icon: ClipboardCheck },
  { id: "insights", label: "Insights & Survey", icon: BarChart3 },
  { id: "approvals", label: "Approval Profil", icon: UserCheck },
];

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
          {!collapsed && (
            <div className="px-3 py-4">
              <img src={logoLight} alt="Oveersea" className="h-8" />
            </div>
          )}
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminSections.map((s) => (
                <SidebarMenuItem key={s.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(s.id)}
                    isActive={activeSection === s.id}
                    tooltip={s.label}
                  >
                    <s.icon className="w-4 h-4" />
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
