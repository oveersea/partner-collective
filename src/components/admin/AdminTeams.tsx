import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Search, Users, ChevronLeft, ChevronRight,
  MoreVertical, UserPlus, Crown, Trash2,
  Loader2, X, UsersRound, CheckCircle, XCircle, Clock,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  max_members: number | null;
  created_by: string;
  created_at: string;
  approval_status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  suggested_team_id: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  user_name?: string;
}

const PAGE_SIZE = 20;

const AdminTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  // Team detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);

  // Approval dialog
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalTeam, setApprovalTeam] = useState<Team | null>(null);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [suggestTeamSearch, setSuggestTeamSearch] = useState("");
  const [suggestTeamResults, setSuggestTeamResults] = useState<Team[]>([]);
  const [suggestTeamId, setSuggestTeamId] = useState<string | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [teamRes, memRes] = await Promise.all([
      supabase
        .from("partner_teams")
        .select("id, name, slug, description, skills, status, max_members, created_by, created_at, approval_status, admin_notes, rejection_reason, suggested_team_id")
        .order("created_at", { ascending: false }),
      supabase.from("partner_team_members").select("team_id"),
    ]);

    if (teamRes.data) setTeams(teamRes.data as Team[]);
    if (teamRes.error) toast.error("Failed to load team data");

    if (memRes.data) {
      const counts: Record<string, number> = {};
      memRes.data.forEach((m: any) => {
        if (m.team_id) counts[m.team_id] = (counts[m.team_id] || 0) + 1;
      });
      setMemberCounts(counts);
    }
    setLoading(false);
  };

  const updateTeamStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("partner_teams")
      .update({ status })
      .eq("id", id);
    if (error) toast.error("Failed to update status: " + error.message);
    else {
      toast.success(`Team status changed to "${status}"`);
      setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    }
  };

  // ── Team Detail ──
  const openTeamDetail = async (team: Team) => {
    setSelectedTeam(team);
    setDetailOpen(true);
    await fetchMembers(team.id);
  };

  const fetchMembers = async (teamId: string) => {
    setMembersLoading(true);
    const { data: membersData } = await supabase
      .from("partner_team_members")
      .select("id, user_id, role, status, joined_at")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      const enriched: TeamMember[] = membersData.map((m) => ({
        ...m,
        user_name: profileMap.get(m.user_id) || "—",
      }));
      setMembers(enriched);
    } else {
      setMembers([]);
    }
    setMembersLoading(false);
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase
      .from("partner_team_members")
      .update({ role })
      .eq("id", memberId);
    if (error) {
      toast.error("Failed to update role: " + error.message);
    } else {
      toast.success(`Role changed to "${role}"`);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    }
  };

  const removeMember = async (memberId: string, userName: string) => {
    if (!confirm(`Remove "${userName}" from this team?`)) return;
    const { error } = await supabase.from("partner_team_members").delete().eq("id", memberId);
    if (error) {
      toast.error("Failed to remove: " + error.message);
    } else {
      toast.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setMemberCounts((prev) => ({
        ...prev,
        [selectedTeam!.id]: Math.max(0, (prev[selectedTeam!.id] || 1) - 1),
      }));
    }
  };

  // ── Add Member ──
  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setUserResults([]); return; }
    setSearchingUsers(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .ilike("full_name", `%${q}%`)
      .limit(10);
    setUserResults(data || []);
    setSearchingUsers(false);
  };

  const addMember = async () => {
    if (!selectedUserId || !selectedTeam) return;
    setAddingMember(true);

    const { data: existing } = await supabase
      .from("partner_team_members")
      .select("id")
      .eq("team_id", selectedTeam.id)
      .eq("user_id", selectedUserId)
      .maybeSingle();

    if (existing) {
      toast.error("User is already a member of this team");
      setAddingMember(false);
      return;
    }

    const { error } = await supabase.from("partner_team_members").insert({
      team_id: selectedTeam.id,
      user_id: selectedUserId,
      role: newMemberRole,
      status: "active",
    });

    if (error) {
      toast.error("Failed to add member: " + error.message);
    } else {
      toast.success("Member added successfully");
      setAddMemberOpen(false);
      setUserSearch("");
      setSelectedUserId("");
      setNewMemberRole("member");
      setUserResults([]);
      await fetchMembers(selectedTeam.id);
      setMemberCounts((prev) => ({
        ...prev,
        [selectedTeam.id]: (prev[selectedTeam.id] || 0) + 1,
      }));
    }
    setAddingMember(false);
  };

  // ── Approval Flow ──
  const openApproval = (team: Team, action: "approve" | "reject") => {
    setApprovalTeam(team);
    setApprovalAction(action);
    setApprovalNotes("");
    setRejectionReason("");
    setSuggestTeamId(null);
    setSuggestTeamSearch("");
    setSuggestTeamResults([]);
    setApprovalOpen(true);
  };

  const searchSuggestTeams = async (q: string) => {
    setSuggestTeamSearch(q);
    if (q.length < 2) { setSuggestTeamResults([]); return; }
    const { data } = await supabase
      .from("partner_teams")
      .select("id, name, slug, description, skills, status, max_members, created_by, created_at, approval_status, admin_notes, rejection_reason, suggested_team_id")
      .ilike("name", `%${q}%`)
      .eq("approval_status", "approved")
      .neq("id", approvalTeam?.id || "")
      .limit(5);
    setSuggestTeamResults((data as Team[]) || []);
  };

  const handleApproval = async () => {
    if (!approvalTeam) return;
    setSubmittingApproval(true);

    const updateData: Record<string, any> = {
      admin_notes: approvalNotes || null,
      reviewed_at: new Date().toISOString(),
    };

    if (approvalAction === "approve") {
      updateData.approval_status = "approved";
      updateData.status = "active";
    } else {
      updateData.approval_status = suggestTeamId ? "merged" : "rejected";
      updateData.rejection_reason = rejectionReason || null;
      updateData.suggested_team_id = suggestTeamId;
    }

    const { error } = await supabase
      .from("partner_teams")
      .update(updateData)
      .eq("id", approvalTeam.id);

    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success(approvalAction === "approve" ? "Team approved!" : "Team rejected");
      setApprovalOpen(false);
      fetchData();
    }
    setSubmittingApproval(false);
  };

  // ── Filters ──
  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-primary/10 text-primary",
      inactive: "bg-muted text-muted-foreground",
      suspended: "bg-destructive/10 text-destructive",
    };
    return map[status] || map.inactive;
  };

  const approvalBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-primary/10 text-primary",
      pending: "bg-amber-500/10 text-amber-600",
      rejected: "bg-destructive/10 text-destructive",
      merged: "bg-muted text-muted-foreground",
    };
    return map[status] || map.pending;
  };

  const roleBadge = (role: string) => {
    if (role === "leader") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (role === "admin") return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const stats = {
    total: teams.length,
    active: teams.filter((t) => t.status === "active").length,
    pending: teams.filter((t) => t.approval_status === "pending").length,
    totalMembers: Object.values(memberCounts).reduce((a, b) => a + b, 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Team Management</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, description, skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Teams", value: stats.total, icon: UsersRound, color: "text-foreground" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "text-primary" },
          { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: "Total Members", value: stats.totalMembers, icon: Users, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Skills</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Members</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Approval</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No team data found
                  </td>
                </tr>
              ) : (
                paged.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => openTeamDetail(t)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <UsersRound className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[180px]">{t.name}</p>
                          {t.description && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{t.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.skills && t.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {t.skills.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                          {t.skills.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{t.skills.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> {memberCounts[t.id] || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${approvalBadge(t.approval_status)}`}>
                        {t.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(t.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openTeamDetail(t)}>
                            <Users className="w-4 h-4 mr-2" /> Manage Members
                          </DropdownMenuItem>
                          {t.approval_status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => openApproval(t, "approve")}>
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve Team
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openApproval(t, "reject")}>
                                <XCircle className="w-4 h-4 mr-2" /> Reject Team
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => updateTeamStatus(t.id, "active")}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Set Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTeamStatus(t.id, "inactive")}>
                            <XCircle className="w-4 h-4 mr-2" /> Set Inactive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTeamStatus(t.id, "suspended")}>
                            <Clock className="w-4 h-4 mr-2" /> Suspend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Team Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-primary" />
              {selectedTeam?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedTeam && (
            <div className="space-y-6">
              {/* Team info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Slug</Label>
                  <p className="font-mono text-foreground">{selectedTeam.slug || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(selectedTeam.status)}`}>
                      {selectedTeam.status}
                    </span>
                  </p>
                </div>
                {selectedTeam.description && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-foreground">{selectedTeam.description}</p>
                  </div>
                )}
                {selectedTeam.skills && selectedTeam.skills.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Skills</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedTeam.skills.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Members section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team Members ({members.length})
                  </h3>
                  <Button size="sm" onClick={() => setAddMemberOpen(true)} className="gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
                  </Button>
                </div>

                {membersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                    No members yet. Add the first member.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            {m.role === "leader" ? (
                              <Crown className="w-4 h-4 text-primary" />
                            ) : (
                              <Users className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.user_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Joined {new Date(m.joined_at).toLocaleDateString("en-US")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v)}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="leader">Leader</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>

                          <Badge variant="outline" className={`text-[10px] border ${roleBadge(m.role)}`}>
                            {m.role}
                          </Badge>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeMember(m.id, m.user_name || "member")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ── */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to {selectedTeam?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Type at least 2 characters..."
                  value={userSearch}
                  onChange={(e) => searchUsers(e.target.value)}
                />
                {searchingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {userResults.length > 0 && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {userResults.map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.user_id);
                        setUserSearch(u.full_name);
                        setUserResults([]);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between ${
                        selectedUserId === u.user_id ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="text-foreground">{u.full_name}</span>
                      {selectedUserId === u.user_id && (
                        <Badge variant="outline" className="text-[10px]">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedUserId && (
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-md px-3 py-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Selected user: <strong>{userSearch}</strong></span>
                  <button
                    onClick={() => { setSelectedUserId(""); setUserSearch(""); }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leader">Leader — team lead</SelectItem>
                  <SelectItem value="admin">Admin — can manage team</SelectItem>
                  <SelectItem value="member">Member — regular member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={addMember} disabled={!selectedUserId || addingMember}>
              {addingMember ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approval Dialog ── */}
      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{approvalAction === "approve" ? "Approve" : "Reject"} Team: {approvalTeam?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {approvalAction === "reject" && (
              <div className="space-y-2">
                <Label>Rejection Reason</Label>
                <Input placeholder="Why is this team being rejected?" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Admin Notes (optional)</Label>
              <Input placeholder="Internal notes..." value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} />
            </div>
            {approvalAction === "reject" && (
              <div className="space-y-2">
                <Label>Suggest Existing Team (optional)</Label>
                <Input placeholder="Search team name..." value={suggestTeamSearch} onChange={(e) => searchSuggestTeams(e.target.value)} />
                {suggestTeamResults.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    {suggestTeamResults.map((st) => (
                      <button key={st.id} onClick={() => { setSuggestTeamId(st.id); setSuggestTeamSearch(st.name); setSuggestTeamResults([]); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${suggestTeamId === st.id ? "bg-primary/10" : ""}`}>
                        {st.name}
                      </button>
                    ))}
                  </div>
                )}
                {suggestTeamId && <p className="text-xs text-primary">Will suggest user to join this team instead.</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>Cancel</Button>
            <Button onClick={handleApproval} disabled={submittingApproval} variant={approvalAction === "approve" ? "default" : "destructive"}>
              {submittingApproval ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {approvalAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeams;
