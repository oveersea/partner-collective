import {
  LayoutDashboard, Users, Shield, Briefcase, CreditCard, FileText, Building2, ChevronLeft,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Manajemen User", icon: Users },
  { id: "companies", label: "Manajemen Perusahaan", icon: Building2 },
  { id: "kyc", label: "Verifikasi KYC", icon: Shield },
  { id: "hiring", label: "Hiring & Matching", icon: Briefcase },
  { id: "credits", label: "Kredit & Wallet", icon: CreditCard },
  { id: "content", label: "Konten & Program", icon: FileText },
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
          <div className="px-3 py-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
              {!collapsed && <span>Kembali</span>}
            </Link>
            {!collapsed && (
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">A</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Admin Panel</p>
                  <p className="text-[10px] text-muted-foreground">PartnerHub</p>
                </div>
              </div>
            )}
          </div>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((s) => (
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
