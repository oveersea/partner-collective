import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DashboardNav from "@/components/dashboard/DashboardNav";
import {
  Building2, Users, FileText, Shield, FolderKanban, CreditCard,
  ArrowLeft, User, UserPlus, Trash2, MapPin, Globe, Mail, Phone,
  ShieldCheck, ShieldX, Clock, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  kyc_status: string;
  logo_url: string | null;
  company_size: string | null;
  npwp: string | null;
  nib: string | null;
  address: string | null;
  oveercode: string | null;
  created_at: string;
  created_by: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profile?: { full_name: string | null; avatar_url: string | null };
}

interface Document {
  id: string;
  document_type: string;
  document_label: string | null;
  file_name: string;
  file_url: string;
  created_at: string;
}

const CompanyDashboard = () => {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [credits, setCredits] = useState<{ balance: number } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteResults, setInviteResults] = useState<{ user_id: string; full_name: string; oveercode?: string | null }[]>([]);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user && slug) fetchCompany();
  }, [user, slug]);

  const fetchCompany = async () => {
    const { data, error } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("slug", slug)
      .eq("business_type", "company")
      .maybeSingle();

    if (error || !data) {
      toast.error("Company not found");
      navigate("/dashboard");
      return;
    }
    setCompany(data as CompanyProfile);

    // Check membership
    const { data: membership } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", data.id)
      .eq("user_id", user!.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership && data.created_by !== user!.id) {
      toast.error("You don't have access to this company");
      navigate("/dashboard");
      return;
    }

    const createdByMe = data.created_by === user!.id;
    setIsAdmin(createdByMe || membership?.role === "owner" || membership?.role === "admin");

    const [memRes, docRes, credRes] = await Promise.all([
      supabase
        .from("business_members")
        .select("id, user_id, role, status")
        .eq("business_id", data.id),
      supabase
        .from("business_documents")
        .select("id, document_type, document_label, file_name, file_url, created_at")
        .eq("business_id", data.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("company_credits")
        .select("balance")
        .eq("business_id", data.id)
        .maybeSingle(),
    ]);

    if (memRes.data && memRes.data.length > 0) {
      const uids = memRes.data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", uids);
      const pMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setMembers(
        memRes.data.map((m) => ({ ...m, profile: pMap.get(m.user_id) || undefined }))
      );
    }

    setDocuments(docRes.data || []);
    setCredits(credRes.data);
    setLoading(false);
  };

  const searchInviteUsers = async (q: string) => {
    setInviteSearch(q);
    if (q.length < 2) { setInviteResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, oveercode")
      .or(`full_name.ilike.%${q}%,oveercode.ilike.%${q}%`)
      .limit(10);
    setInviteResults(data || []);
  };

  const handleInvite = async () => {
    if (!inviteUserId || !company) return;
    setInviting(true);
    const { error } = await supabase.from("business_members").insert({
      business_id: company.id,
      user_id: inviteUserId,
      role: inviteRole,
      status: "active",
      invited_by: user!.id,
    });
    if (error) toast.error("Failed: " + error.message);
    else {
      toast.success("Member added!");
      setInviteOpen(false);
      setInviteSearch("");
      setInviteUserId("");
      fetchCompany();
    }
    setInviting(false);
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    await supabase.from("business_members").delete().eq("id", id);
    toast.success("Removed");
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const kycBadge = (status: string) => {
    const map: Record<string, { color: string; icon: any; label: string }> = {
      verified: { color: "bg-primary/10 text-primary", icon: ShieldCheck, label: "Verified" },
      approved: { color: "bg-primary/10 text-primary", icon: ShieldCheck, label: "Approved" },
      pending: { color: "bg-amber-500/10 text-amber-600", icon: Clock, label: "Pending" },
      rejected: { color: "bg-destructive/10 text-destructive", icon: ShieldX, label: "Rejected" },
    };
    return map[status] || { color: "bg-muted text-muted-foreground", icon: Shield, label: "Unverified" };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) return null;

  const kyc = kycBadge(company.kyc_status);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="w-full px-4 py-4 md:px-6 md:py-8 pb-28 md:pb-8">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <Building2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground truncate">{company.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {company.oveercode && <span className="font-mono">{company.oveercode}</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${kyc.color}`}>
                    {kyc.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-1 overflow-x-auto">
            {[
              { value: "overview", icon: Building2, label: "Overview" },
              { value: "members", icon: Users, label: "Members", count: members.length },
              { value: "documents", icon: FileText, label: "Documents", count: documents.length },
              { value: "kyc", icon: Shield, label: "KYC" },
              { value: "projects", icon: FolderKanban, label: "Projects" },
              { value: "credits", icon: CreditCard, label: "Credits" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground rounded-none border-b-2 border-transparent transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary/10 text-primary px-1">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
                <h3 className="font-semibold text-card-foreground">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Industry</Label>
                    <p className="text-foreground">{company.industry || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Company Size</Label>
                    <p className="text-foreground">{company.company_size || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="text-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[company.city, company.country].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    {company.website ? (
                      <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1 text-sm">
                        <Globe className="w-3 h-3" /> {company.website}
                      </a>
                    ) : <p className="text-foreground">—</p>}
                  </div>
                </div>
                {company.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm text-foreground mt-1">{company.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
                <h3 className="font-semibold text-card-foreground">Contact & Legal</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {company.email || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="text-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {company.phone || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">NPWP</Label>
                    <p className="text-foreground font-mono text-xs">{company.npwp || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">NIB</Label>
                    <p className="text-foreground font-mono text-xs">{company.nib || "—"}</p>
                  </div>
                </div>
                {company.address && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <p className="text-sm text-foreground mt-1">{company.address}</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-3 gap-4">
                {[
                  { label: "Members", value: members.length, icon: Users },
                  { label: "Documents", value: documents.length, icon: FileText },
                  { label: "Credits", value: credits?.balance || 0, icon: CreditCard },
                ].map((s) => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground">Members ({members.length})</h3>
                {isAdmin && (
                  <Button size="sm" onClick={() => setInviteOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" /> Invite
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{m.profile?.full_name || "Member"}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      m.role === "owner" ? "bg-amber-500/10 text-amber-600" : m.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : "Member"}
                    </span>
                    {isAdmin && m.user_id !== user!.id && (
                      <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-card-foreground">Documents ({documents.length})</h3>
              <div className="space-y-3">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{d.document_label || d.file_name}</p>
                      <p className="text-xs text-muted-foreground">{d.document_type} · {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    <a href={d.file_url} target="_blank" rel="noopener" className="text-primary text-xs hover:underline">View</a>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-card-foreground">Business KYC Status</h3>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <kyc.icon className={`w-6 h-6 ${kyc.color.split(" ")[1]}`} />
                <div>
                  <p className="font-medium text-foreground">{kyc.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {company.kyc_status === "verified" || company.kyc_status === "approved"
                      ? "Your business has been verified."
                      : company.kyc_status === "pending"
                      ? "KYC is under review by admin."
                      : company.kyc_status === "rejected"
                      ? "KYC was rejected. Please resubmit."
                      : "Please submit KYC documents to verify your business."}
                  </p>
                </div>
              </div>
              {(company.kyc_status === "unverified" || company.kyc_status === "rejected") && isAdmin && (
                <p className="text-sm text-muted-foreground">KYC submission form coming soon. Contact admin for manual verification.</p>
              )}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h3 className="font-semibold text-card-foreground mb-4">Projects & Orders</h3>
              <p className="text-sm text-muted-foreground text-center py-8">No projects yet. Orders assigned to this company will appear here.</p>
            </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-card-foreground">Credit Balance</h3>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <CreditCard className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-3xl font-bold text-foreground">{credits?.balance || 0}</p>
                  <p className="text-xs text-muted-foreground">Available Credits</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search User</Label>
              <Input className="mt-1" placeholder="Type name..." value={inviteSearch} onChange={(e) => searchInviteUsers(e.target.value)} />
              {inviteResults.length > 0 && (
                <div className="mt-2 border border-border rounded-lg overflow-hidden">
                  {inviteResults.map((u) => (
                    <button key={u.user_id} onClick={() => { setInviteUserId(u.user_id); setInviteSearch(u.full_name); setInviteResults([]); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${inviteUserId === u.user_id ? "bg-primary/10" : ""}`}>
                      <span>{u.full_name}</span>
                      {u.oveercode && <span className="ml-2 text-xs text-muted-foreground font-mono">{u.oveercode}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleInvite} disabled={!inviteUserId || inviting}>
              {inviting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyDashboard;
