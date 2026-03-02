import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardNav from "@/components/dashboard/DashboardNav";
import {
  Users, FolderKanban, ArrowLeft, Crown, User, UserPlus, Trash2,
  Loader2, AlertTriangle, CheckCircle, XCircle, ArrowRight, UsersRound,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  skills: string[] | null;
  status: string;
  created_by: string;
  created_at: string;
  approval_status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  suggested_team_id: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profile?: { full_name: string | null; avatar_url: string | null };
}

interface SuggestedTeam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  skills: string[] | null;
}

const TeamDashboard = () => {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [suggestedTeam, setSuggestedTeam] = useState<SuggestedTeam | null>(null);

  // Invite member
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
    if (user && slug) fetchTeam();
  }, [user, slug]);

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from("partner_teams")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      toast.error("Team not found");
      navigate("/dashboard");
      return;
    }
    setTeam(data as Team);

    // Check leadership
    const { data: membership } = await supabase
      .from("partner_team_members")
      .select("role")
      .eq("team_id", data.id)
      .eq("user_id", user!.id)
      .single();

    setIsLeader(data.created_by === user!.id || membership?.role === "leader");

    // Fetch members
    const { data: memData } = await supabase
      .from("partner_team_members")
      .select("id, user_id, role, status")
      .eq("team_id", data.id);

    if (memData && memData.length > 0) {
      const uids = memData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", uids);
      const pMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setMembers(memData.map((m) => ({ ...m, profile: pMap.get(m.user_id) || undefined })));
    }

    // Fetch suggested team if rejected with suggestion
    if (data.suggested_team_id) {
      const { data: suggested } = await supabase
        .from("partner_teams")
        .select("id, name, slug, description, skills")
        .eq("id", data.suggested_team_id)
        .single();
      if (suggested) setSuggestedTeam(suggested as SuggestedTeam);
    }

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
    if (!inviteUserId || !team) return;
    setInviting(true);
    const { error } = await supabase.from("partner_team_members").insert({
      team_id: team.id,
      user_id: inviteUserId,
      role: inviteRole,
    });
    if (error) toast.error("Failed: " + error.message);
    else {
      toast.success("Member added!");
      setInviteOpen(false);
      setInviteSearch("");
      setInviteUserId("");
      fetchTeam();
    }
    setInviting(false);
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    await supabase.from("partner_team_members").delete().eq("id", id);
    toast.success("Removed");
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const joinSuggestedTeam = async () => {
    if (!suggestedTeam || !user) return;
    const { error } = await supabase.from("partner_team_members").insert({
      team_id: suggestedTeam.id,
      user_id: user.id,
      role: "member",
    });
    if (error) toast.error("Failed to join: " + error.message);
    else {
      toast.success("Joined " + suggestedTeam.name + "!");
      navigate(`/team/${suggestedTeam.slug}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) return null;

  const approvalBanner = () => {
    if (team.approval_status === "approved") return null;

    const configs: Record<string, { bg: string; icon: any; title: string; desc: string }> = {
      pending: {
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: AlertTriangle,
        title: "Menunggu Approval Admin",
        desc: "Tim ini sedang menunggu persetujuan admin. Beberapa fitur terbatas sampai disetujui.",
      },
      rejected: {
        bg: "bg-destructive/10 border-destructive/20",
        icon: XCircle,
        title: "Tim Ditolak",
        desc: team.rejection_reason || "Admin menolak pembuatan tim ini.",
      },
      merged: {
        bg: "bg-primary/10 border-primary/20",
        icon: ArrowRight,
        title: "Tim Digabungkan",
        desc: "Admin menyarankan untuk bergabung ke tim yang sudah ada.",
      },
    };

    const cfg = configs[team.approval_status];
    if (!cfg) return null;
    const Icon = cfg.icon;

    return (
      <div className={`rounded-2xl border p-4 md:p-6 mb-6 ${cfg.bg}`}>
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{cfg.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{cfg.desc}</p>
            {team.admin_notes && (
              <p className="text-sm text-foreground mt-2 p-3 rounded-lg bg-card border border-border">
                <strong>Catatan Admin:</strong> {team.admin_notes}
              </p>
            )}
            {suggestedTeam && (team.approval_status === "rejected" || team.approval_status === "merged") && (
              <div className="mt-4 p-4 rounded-xl bg-card border border-border">
                <p className="text-sm font-medium text-foreground mb-2">Tim yang disarankan:</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{suggestedTeam.name}</p>
                    {suggestedTeam.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{suggestedTeam.description}</p>
                    )}
                    {suggestedTeam.skills && suggestedTeam.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestedTeam.skills.slice(0, 5).map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" onClick={joinSuggestedTeam}>
                    <ArrowRight className="w-4 h-4 mr-1" /> Gabung
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                <UsersRound className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground truncate">{team.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{members.length} members</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    team.approval_status === "approved" ? "bg-primary/10 text-primary" :
                    team.approval_status === "pending" ? "bg-amber-500/10 text-amber-600" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {team.approval_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Banner */}
        {approvalBanner()}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl overflow-x-auto flex w-full">
            <TabsTrigger value="overview" className="rounded-lg text-xs md:text-sm"><UsersRound className="w-4 h-4 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="members" className="rounded-lg text-xs md:text-sm"><Users className="w-4 h-4 mr-1.5" />Members</TabsTrigger>
            <TabsTrigger value="projects" className="rounded-lg text-xs md:text-sm"><FolderKanban className="w-4 h-4 mr-1.5" />Projects</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
                <h3 className="font-semibold text-card-foreground">Team Information</h3>
                {team.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm text-foreground mt-1">{team.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-sm text-foreground">{team.status}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm text-foreground">{new Date(team.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
                <h3 className="font-semibold text-card-foreground">Skills</h3>
                {team.skills && team.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {team.skills.map((skill) => (
                      <span key={skill} className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills defined</p>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-foreground">{members.length}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-foreground">0</p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Members */}
          <TabsContent value="members">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground">Members ({members.length})</h3>
                {isLeader && team.approval_status === "approved" && (
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
                      <p className="text-sm font-medium text-card-foreground truncate">{m.profile?.full_name || "Partner"}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      m.role === "leader" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
                    }`}>
                      {m.role === "leader" ? "Leader" : "Member"}
                    </span>
                    {isLeader && m.user_id !== user!.id && (
                      <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Projects */}
          <TabsContent value="projects">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h3 className="font-semibold text-card-foreground mb-4">Projects</h3>
              <p className="text-sm text-muted-foreground text-center py-8">No projects yet. Orders assigned to this team will appear here.</p>
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
                  <SelectItem value="leader">Leader</SelectItem>
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

export default TeamDashboard;
