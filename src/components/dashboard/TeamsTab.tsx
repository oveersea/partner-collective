import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, Plus, Crown, User, X } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  skills: string[] | null;
  status: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profile?: { full_name: string | null; headline: string | null; avatar_url: string | null };
}

const TeamsTab = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newTeam, setNewTeam] = useState({ name: "", description: "", skills: "" });

  useEffect(() => {
    if (user) fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    // Get teams where user is creator or member
    const { data: memberOf } = await supabase
      .from("partner_team_members")
      .select("team_id")
      .eq("user_id", user!.id);

    const teamIds = memberOf?.map((m) => m.team_id) || [];

    const { data: createdTeams } = await supabase
      .from("partner_teams")
      .select("*")
      .eq("created_by", user!.id);

    const allTeamIds = [...new Set([...teamIds, ...(createdTeams?.map((t) => t.id) || [])])];

    if (allTeamIds.length > 0) {
      const { data } = await supabase
        .from("partner_teams")
        .select("*")
        .in("id", allTeamIds)
        .order("created_at", { ascending: false });
      
      // Get member counts
      const teamsWithCounts = await Promise.all(
        (data || []).map(async (team) => {
          const { count } = await supabase
            .from("partner_team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id);
          return { ...team, member_count: count || 0 } as Team;
        })
      );
      setTeams(teamsWithCounts);
    } else {
      setTeams([]);
    }
    setLoading(false);
  };

  const fetchMembers = async (teamId: string) => {
    setSelectedTeam(teamId);
    const { data } = await supabase
      .from("partner_team_members")
      .select("id, user_id, role, status, joined_at")
      .eq("team_id", teamId);

    // Fetch profile info for each member
    const membersWithProfiles = await Promise.all(
      (data || []).map(async (member) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, headline, avatar_url")
          .eq("user_id", member.user_id)
          .single();
        return { ...member, profile: profile || undefined } as TeamMember;
      })
    );
    setMembers(membersWithProfiles);
  };

  const handleCreate = async () => {
    if (!newTeam.name.trim()) { toast.error("Nama tim wajib diisi"); return; }
    setCreating(true);

    const skills = newTeam.skills.split(",").map((s) => s.trim()).filter(Boolean);

    const { data: team, error } = await supabase
      .from("partner_teams")
      .insert({
        name: newTeam.name.trim(),
        slug: "",
        description: newTeam.description.trim() || null,
        skills,
        created_by: user!.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Gagal membuat tim");
      setCreating(false);
      return;
    }

    // Add creator as leader
    await supabase.from("partner_team_members").insert({
      team_id: team.id,
      user_id: user!.id,
      role: "leader",
    });

    toast.success("Tim berhasil dibuat!");
    setShowCreate(false);
    setNewTeam({ name: "", description: "", skills: "" });
    setCreating(false);
    fetchTeams();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Create Team Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? "ghost" : "default"} size="sm">
          {showCreate ? <><X className="w-4 h-4" /> Batal</> : <><Plus className="w-4 h-4" /> Buat Tim Baru</>}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
          <h3 className="font-semibold text-card-foreground">Buat Tim Baru</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-card-foreground">Nama Tim</Label>
              <Input className="mt-1.5" placeholder="Contoh: Dev Squad" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-card-foreground">Skills (koma)</Label>
              <Input className="mt-1.5" placeholder="React, Node.js, UI/UX" value={newTeam.skills} onChange={(e) => setNewTeam({ ...newTeam, skills: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-card-foreground">Deskripsi</Label>
            <Textarea className="mt-1.5" rows={2} placeholder="Deskripsi singkat tentang tim..." value={newTeam.description} onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Membuat..." : "Buat Tim"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Teams List */}
      {teams.length === 0 && !showCreate ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-card-foreground mb-1">Belum ada tim</h3>
          <p className="text-sm text-muted-foreground mb-4">Buat tim untuk berkolaborasi dengan partner lain.</p>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Buat Tim Pertama</Button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card rounded-2xl border p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer ${
                selectedTeam === team.id ? "border-primary" : "border-border"
              }`}
              onClick={() => fetchMembers(team.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-card-foreground">{team.name}</h3>
                  {team.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>}
                </div>
                {team.created_by === user!.id && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 shrink-0">
                    <Crown className="w-3 h-3 inline mr-0.5" />Leader
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{team.member_count || 0} anggota</span>
              </div>

              {team.skills && team.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {team.skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{skill}</span>
                  ))}
                  {team.skills.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{team.skills.length - 4}</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Members Panel */}
      {selectedTeam && members.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h3 className="font-semibold text-card-foreground mb-4">Anggota Tim</h3>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{member.profile?.full_name || "Partner"}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.profile?.headline || member.role}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  member.role === "leader" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
                }`}>
                  {member.role === "leader" ? "Leader" : "Member"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TeamsTab;
