import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Briefcase, UserSearch, Clock, Zap, ChevronLeft, ChevronRight,
  Calendar, Users, CreditCard, AlertCircle, CheckCircle2,
  Loader2, FileText, ArrowUpRight, LayoutList, Star, Archive,
  XCircle, Download,
} from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardBreadcrumb from "@/components/dashboard/DashboardBreadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { renderCvToPdf } from "@/lib/cv-pdf-helper";

interface MatchedCandidateDisplay {
  id: string;
  name: string;
  title: string | null;
  skills: string[];
  match_score: number;
  status: string;
  source_type: string;
  oveercode: string | null;
}

interface HiringRequest {
  id: string;
  title: string;
  description: string | null;
  hiring_type: string;
  status: string;
  positions_count: number | null;
  required_skills: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  credit_cost: number;
  sla_deadline: string | null;
  oveercode: string | null;
  created_at: string;
  business_profiles?: { name: string } | null;
  candidate_count?: number;
}

interface ProjectRequest {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  job_type: string | null;
  skills_required: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string | null;
  deadline: string | null;
  demand_type: string | null;
  sla_type: string | null;
  sla_deadline: string | null;
  slug: string;
  oveercode: string | null;
  created_at: string;
  applicant_count?: number;
}

const PAGE_SIZE = 10;

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  open: { label: "Open", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: LayoutList },
  sourcing: { label: "Sourcing", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: UserSearch },
  shortlisted: { label: "Shortlisted", color: "bg-primary/10 text-primary border-primary/20", icon: Users },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
  filled: { label: "Filled", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
};

const getStatusBadge = (status: string) => {
  const cfg = statusConfig[status] || { label: status, color: "bg-muted text-muted-foreground border-border", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const MyRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"hiring" | "projects">("hiring");
  const [loading, setLoading] = useState(true);

  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [hiringPage, setHiringPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);

  // Detail expand
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [candidatesMap, setCandidatesMap] = useState<Record<string, MatchedCandidateDisplay[]>>({});
  const [loadingCandidates, setLoadingCandidates] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);

    // Get client profile id for hiring requests
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    const [hiringRes, projectRes] = await Promise.all([
      clientProfile?.id
        ? supabase
            .from("hiring_requests")
            .select("id, title, description, hiring_type, status, positions_count, required_skills, experience_min, experience_max, credit_cost, sla_deadline, oveercode, created_at, business_profiles(name)")
            .eq("client_id", clientProfile.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("opportunities")
        .select("id, title, description, category, status, job_type, skills_required, budget_min, budget_max, budget_currency, deadline, demand_type, sla_type, sla_deadline, slug, oveercode, created_at")
        .eq("user_id", user!.id)
        .eq("job_type", "project")
        .order("created_at", { ascending: false }),
    ]);

    if (hiringRes.data) setHiringRequests(hiringRes.data as unknown as HiringRequest[]);
    if (projectRes.data) setProjectRequests(projectRes.data as unknown as ProjectRequest[]);
    setLoading(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const formatCurrency = (amount: number, currency?: string) => {
    if (currency === "USD") return `$${amount.toLocaleString("en-US")}`;
    if (currency === "EUR") return `€${amount.toLocaleString("en-US")}`;
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const fetchCandidates = async (hiringRequestId: string) => {
    if (candidatesMap[hiringRequestId]) return;
    setLoadingCandidates(hiringRequestId);
    const { data } = await supabase
      .from("hiring_matched_candidates")
      .select("*")
      .eq("hiring_request_id", hiringRequestId)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setCandidatesMap(prev => ({ ...prev, [hiringRequestId]: [] }));
      setLoadingCandidates(null);
      return;
    }

    const profileIds = data.filter(d => d.profile_user_id).map(d => d.profile_user_id!);
    const archiveIds = data.filter(d => d.candidate_archive_id).map(d => d.candidate_archive_id!);

    const [profilesRes, archivesRes] = await Promise.all([
      profileIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name, skills, headline, oveercode").in("user_id", profileIds)
        : Promise.resolve({ data: [] }),
      archiveIds.length > 0
        ? supabase.from("candidates_archive").select("id, full_name, skills, current_title, oveercode").in("id", archiveIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
    const archiveMap = new Map((archivesRes.data || []).map((a: any) => [a.id, a]));

    const resolved: MatchedCandidateDisplay[] = data.map((d: any) => {
      if (d.source_type === "profile" && d.profile_user_id) {
        const p = profileMap.get(d.profile_user_id);
        return { id: d.id, name: p?.full_name || "Unknown", title: p?.headline, skills: p?.skills || [], match_score: d.match_score, status: d.status, source_type: d.source_type, oveercode: p?.oveercode };
      }
      const a = archiveMap.get(d.candidate_archive_id);
      return { id: d.id, name: a?.full_name || "Unknown", title: a?.current_title, skills: a?.skills || [], match_score: d.match_score, status: d.status, source_type: d.source_type, oveercode: a?.oveercode };
    });

    setCandidatesMap(prev => ({ ...prev, [hiringRequestId]: resolved }));
    setLoadingCandidates(null);
  };

  const handleExpand = (id: string) => {
    const newId = expandedId === id ? null : id;
    setExpandedId(newId);
    if (newId) fetchCandidates(newId);
  };

  const candidateStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      shortlisted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      submitted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return colors[status] || "bg-muted text-muted-foreground border-border";
  };

  const pagedHiring = hiringRequests.slice((hiringPage - 1) * PAGE_SIZE, hiringPage * PAGE_SIZE);
  const hiringTotalPages = Math.max(1, Math.ceil(hiringRequests.length / PAGE_SIZE));
  const pagedProjects = projectRequests.slice((projectPage - 1) * PAGE_SIZE, projectPage * PAGE_SIZE);
  const projectTotalPages = Math.max(1, Math.ceil(projectRequests.length / PAGE_SIZE));

  // Stats
  const hiringStats = {
    total: hiringRequests.length,
    active: hiringRequests.filter(h => ["pending", "sourcing", "shortlisted", "open"].includes(h.status || "")).length,
    completed: hiringRequests.filter(h => ["completed", "filled"].includes(h.status || "")).length,
    totalCredits: hiringRequests.reduce((sum, h) => sum + (h.credit_cost || 0), 0),
  };

  const projectStats = {
    total: projectRequests.length,
    active: projectRequests.filter(p => ["open", "pending"].includes(p.status || "")).length,
    completed: projectRequests.filter(p => ["completed", "filled", "closed"].includes(p.status || "")).length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <DashboardBreadcrumb items={[{ label: "My Requests" }]} />
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">My Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Pantau semua hiring & project request Anda</p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          <button
            onClick={() => setTab("hiring")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "hiring" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserSearch className="w-4 h-4" />
            Hiring
            {hiringRequests.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{hiringRequests.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab("projects")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "projects" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Projects
            {projectRequests.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{projectRequests.length}</span>
            )}
          </button>
        </div>

        {/* ========== HIRING TAB ========== */}
        {tab === "hiring" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Requests", value: hiringStats.total, icon: FileText, color: "text-foreground" },
                { label: "Active", value: hiringStats.active, icon: Loader2, color: "text-blue-600" },
                { label: "Completed", value: hiringStats.completed, icon: CheckCircle2, color: "text-emerald-600" },
                { label: "Credits Used", value: hiringStats.totalCredits, icon: CreditCard, color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* List */}
            {pagedHiring.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <UserSearch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Belum ada hiring request</p>
                <Button className="mt-4" onClick={() => navigate("/hiring-request")}>
                  Buat Hiring Request
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pagedHiring.map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-xl border border-border hover:border-primary/20 transition-all"
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => handleExpand(h.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground truncate">{h.title}</h3>
                            {h.hiring_type === "fast" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                <Zap className="w-3 h-3" /> Fast Track
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Regular
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {h.positions_count || 1} posisi
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> {h.credit_cost} kredit
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(h.created_at)}
                            </span>
                            {h.business_profiles?.name && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {h.business_profiles.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {getStatusBadge(h.status || "pending")}
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === h.id ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedId === h.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="border-t border-border px-5 pb-5 pt-4 space-y-4"
                      >
                        {h.description && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Deskripsi</p>
                            <p className="text-sm text-foreground">{h.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Pengalaman</p>
                            <p className="text-sm text-foreground">
                              {h.experience_min ?? 0} - {h.experience_max ?? "∞"} tahun
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">SLA Deadline</p>
                            <p className={`text-sm ${h.sla_deadline && isOverdue(h.sla_deadline) ? "text-destructive font-medium" : "text-foreground"}`}>
                              {h.sla_deadline ? formatDate(h.sla_deadline) : "—"}
                              {h.sla_deadline && isOverdue(h.sla_deadline) && " (overdue)"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Kredit Digunakan</p>
                            <p className="text-sm text-foreground">{h.credit_cost} kredit</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Kode</p>
                            <p className="text-sm font-mono text-foreground">{h.oveercode || "—"}</p>
                          </div>
                        </div>
                        {h.required_skills && h.required_skills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills Required</p>
                            <div className="flex flex-wrap gap-1.5">
                              {h.required_skills.map((s) => (
                                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Matched Candidates */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Kandidat yang Diajukan
                            {candidatesMap[h.id] && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{candidatesMap[h.id].length}</span>
                            )}
                          </p>
                          {loadingCandidates === h.id ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : !candidatesMap[h.id] || candidatesMap[h.id].length === 0 ? (
                            <p className="text-sm text-muted-foreground py-3 text-center">Belum ada kandidat yang diajukan admin</p>
                          ) : (
                            <div className="space-y-2">
                              {candidatesMap[h.id].map((c) => (
                                <div
                                  key={c.id}
                                  className={`flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border ${c.oveercode ? "cursor-pointer hover:bg-muted/60 transition-colors" : ""}`}
                                  onClick={() => c.oveercode && navigate(`/p/${c.oveercode}`)}
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    {c.source_type === "profile" ? (
                                      <Users className="w-3.5 h-3.5 text-primary" />
                                    ) : (
                                      <Archive className="w-3.5 h-3.5 text-amber-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                                      {c.oveercode && <span className="text-[10px] text-muted-foreground">#{c.oveercode}</span>}
                                      <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${candidateStatusBadge(c.status)}`}>
                                        {c.status}
                                      </span>
                                      {c.match_score > 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.match_score >= 70 ? "bg-emerald-500/10 text-emerald-600" : c.match_score >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                                          <Star className="w-2.5 h-2.5 inline mr-0.5" />{c.match_score}%
                                        </span>
                                      )}
                                    </div>
                                    {c.title && <p className="text-xs text-muted-foreground mt-0.5">{c.title}</p>}
                                    {c.skills.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {c.skills.slice(0, 6).map(s => {
                                          const isMatch = h.required_skills?.some(rs => rs.toLowerCase() === s.toLowerCase());
                                          return (
                                            <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded ${isMatch ? "bg-emerald-500/10 text-emerald-600 font-medium" : "bg-muted text-muted-foreground"}`}>{s}</span>
                                          );
                                        })}
                                        {c.skills.length > 6 && <span className="text-[10px] text-muted-foreground">+{c.skills.length - 6}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {hiringRequests.length > PAGE_SIZE && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{hiringPage} / {hiringTotalPages}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={hiringPage <= 1} onClick={() => setHiringPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" disabled={hiringPage >= hiringTotalPages} onClick={() => setHiringPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== PROJECTS TAB ========== */}
        {tab === "projects" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Total Projects", value: projectStats.total, icon: FileText, color: "text-foreground" },
                { label: "Active", value: projectStats.active, icon: Loader2, color: "text-blue-600" },
                { label: "Completed", value: projectStats.completed, icon: CheckCircle2, color: "text-emerald-600" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* List */}
            {pagedProjects.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Belum ada project request</p>
                <Button className="mt-4" onClick={() => navigate("/project-request")}>
                  Buat Project Request
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pagedProjects.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-xl border border-border hover:border-primary/20 transition-all"
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
                            {p.demand_type && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">{p.demand_type}</span>
                            )}
                            {p.category && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{p.category}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            {(p.budget_min || p.budget_max) && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {p.budget_min ? formatCurrency(p.budget_min, p.budget_currency || "IDR") : "—"} - {p.budget_max ? formatCurrency(p.budget_max, p.budget_currency || "IDR") : "—"}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(p.created_at)}
                            </span>
                            {p.deadline && (
                              <span className={`flex items-center gap-1 ${isOverdue(p.deadline) ? "text-destructive" : ""}`}>
                                <Clock className="w-3 h-3" /> Deadline: {formatDate(p.deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {getStatusBadge(p.status || "open")}
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === p.id ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                    </div>

                    {expandedId === p.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="border-t border-border px-5 pb-5 pt-4 space-y-4"
                      >
                        {p.description && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Deskripsi</p>
                            <p className="text-sm text-foreground">{p.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">SLA</p>
                            <p className="text-sm text-foreground capitalize">{p.sla_type || "Normal"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">SLA Deadline</p>
                            <p className={`text-sm ${p.sla_deadline && isOverdue(p.sla_deadline) ? "text-destructive font-medium" : "text-foreground"}`}>
                              {p.sla_deadline ? formatDate(p.sla_deadline) : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Tipe</p>
                            <p className="text-sm text-foreground capitalize">{p.demand_type || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Kode</p>
                            <p className="text-sm font-mono text-foreground">{p.oveercode || "—"}</p>
                          </div>
                        </div>
                        {p.skills_required && p.skills_required.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills Required</p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.skills_required.map((s) => (
                                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => navigate(`/job/${p.oveercode}`)}
                        >
                          Lihat Detail <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {projectRequests.length > PAGE_SIZE && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{projectPage} / {projectTotalPages}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={projectPage <= 1} onClick={() => setProjectPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" disabled={projectPage >= projectTotalPages} onClick={() => setProjectPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
