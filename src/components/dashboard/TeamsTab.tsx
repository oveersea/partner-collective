import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, Plus, Crown, X, Building2 } from "lucide-react";

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

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  logo_url: string | null;
  kyc_status: string;
  role: string;
}

const TeamsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "", skills: "" });

  useEffect(() => {
    if (user) {
      fetchTeams();
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    // Get companies where user is a member
    const { data: memberships } = await supabase
      .from("business_members")
      .select("business_id, role")
      .eq("user_id", user!.id)
      .eq("status", "active");

    if (!memberships || memberships.length === 0) {
      // Also check if user created any companies
      const { data: created } = await supabase
        .from("business_profiles")
        .select("id, name, slug, description, industry, logo_url, kyc_status")
        .eq("created_by", user!.id)
        .eq("business_type", "company");

      setCompanies((created || []).map((c) => ({ ...c, role: "owner" })));
      return;
    }

    const businessIds = memberships.map((m) => m.business_id);
    const roleMap = new Map(memberships.map((m) => [m.business_id, m.role]));

    const { data: profiles } = await supabase
      .from("business_profiles")
      .select("id, name, slug, description, industry, logo_url, kyc_status")
      .in("id", businessIds)
      .eq("business_type", "company");

    // Also get companies created by user that might not have a membership row
    const { data: created } = await supabase
      .from("business_profiles")
      .select("id, name, slug, description, industry, logo_url, kyc_status")
      .eq("created_by", user!.id)
      .eq("business_type", "company");

    const allCompanies = new Map<string, Company>();
    (profiles || []).forEach((c) => allCompanies.set(c.id, { ...c, role: roleMap.get(c.id) || "member" }));
    (created || []).forEach((c) => {
      if (!allCompanies.has(c.id)) allCompanies.set(c.id, { ...c, role: "owner" });
    });

    setCompanies(Array.from(allCompanies.values()));
  };

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

  const handleCreate = async () => {
    if (!newTeam.name.trim()) { toast.error("Team name is required"); return; }
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
      toast.error("Failed to create team");
      setCreating(false);
      return;
    }

    await supabase.from("partner_team_members").insert({
      team_id: team.id,
      user_id: user!.id,
      role: "leader",
    });

    toast.success("Team created successfully!");
    setShowCreate(false);
    setNewTeam({ name: "", description: "", skills: "" });
    setCreating(false);
    fetchTeams();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8">
      {/* Companies Section */}
      {companies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4" /> My Companies
          </h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {companies.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                onClick={() => navigate(`/company/${company.slug}`)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate">{company.name}</h3>
                    {company.industry && <p className="text-xs text-muted-foreground">{company.industry}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    company.role === "owner" ? "bg-amber-500/10 text-amber-600" :
                    company.role === "admin" ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {company.role === "owner" ? "Owner" : company.role === "admin" ? "Admin" : "Member"}
                  </span>
                </div>
                {company.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{company.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> My Teams
          </h3>
          <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? "ghost" : "default"} size="sm">
            {showCreate ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Create New Team</>}
          </Button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-card-foreground">Create New Team</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-card-foreground">Team Name</Label>
                <Input className="mt-1.5" placeholder="e.g., Dev Squad" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-card-foreground">Skills (comma-separated)</Label>
                <Input className="mt-1.5" placeholder="React, Node.js, UI/UX" value={newTeam.skills} onChange={(e) => setNewTeam({ ...newTeam, skills: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-card-foreground">Description</Label>
              <Textarea className="mt-1.5" rows={2} placeholder="Brief description of your team..." value={newTeam.description} onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Teams List */}
        {teams.length === 0 && !showCreate ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-card-foreground mb-1">No teams yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a team to collaborate with other partners.</p>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create First Team</Button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {teams.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                onClick={() => navigate(`/team/${team.slug}`)}
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
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{team.member_count || 0} members</span>
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
      </div>
    </div>
  );
};

export default TeamsTab;
