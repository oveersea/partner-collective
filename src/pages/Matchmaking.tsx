import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, MapPin, Clock, Briefcase, Zap, Filter,
  ChevronDown, Star, Send, X, DollarSign, Users, Globe,
  Building2, TrendingUp, CheckCircle2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DashboardNav from "@/components/dashboard/DashboardNav";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  category: string;
  skills_required: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  is_remote: boolean | null;
  location: string | null;
  demand_type: string | null;
  project_duration: string | null;
  deadline: string | null;
  company_name: string | null;
  job_type: string | null;
  min_experience_years: number | null;
  created_at: string;
  slug: string;
  user_id: string;
}

interface UserProfile {
  skills: string[] | null;
  years_of_experience: number | null;
  full_name: string | null;
  headline: string | null;
}

const Matchmaking = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [remoteFilter, setRemoteFilter] = useState<"all" | "remote" | "onsite">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Apply modal
  // Apply modal
  const [applyModal, setApplyModal] = useState<Opportunity | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [oppRes, profileRes, appsRes] = await Promise.all([
      supabase
        .from("opportunities")
        .select("id, title, description, category, skills_required, budget_min, budget_max, is_remote, location, demand_type, project_duration, deadline, company_name, job_type, min_experience_years, created_at, slug, user_id")
        .eq("status", "open")
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("profiles")
        .select("skills, years_of_experience, full_name, headline")
        .eq("user_id", user!.id)
        .single(),
      supabase
        .from("opportunity_applications")
        .select("opportunity_id")
        .eq("user_id", user!.id),
    ]);

    if (oppRes.data) setOpportunities(oppRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    if (appsRes.data) setAppliedIds(new Set(appsRes.data.map((a) => a.opportunity_id)));
    setLoading(false);
  };

  const calcMatchScore = (opp: Opportunity): number => {
    if (!profile?.skills?.length) return 0;
    const requiredSkills = opp.skills_required || [];
    if (!requiredSkills.length) return 50;

    let score = 0;
    // Skill match (60%)
    const matched = requiredSkills.filter((s) =>
      profile.skills!.some((ps) => ps.toLowerCase() === s.toLowerCase())
    );
    score += (matched.length / requiredSkills.length) * 60;

    // Experience match (25%)
    const minExp = opp.min_experience_years || 0;
    const userExp = profile.years_of_experience || 0;
    if (userExp >= minExp) {
      score += 25;
    } else if (userExp >= minExp - 1) {
      score += 15;
    }

    // Base score (15%)
    score += 15;

    return Math.round(Math.min(score, 100));
  };

  const categories = useMemo(() => {
    const cats = new Set(opportunities.map((o) => o.category));
    return Array.from(cats).sort();
  }, [opportunities]);

  const filtered = useMemo(() => {
    let result = opportunities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q) ||
          o.skills_required?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) result = result.filter((o) => o.category === categoryFilter);
    if (remoteFilter === "remote") result = result.filter((o) => o.is_remote);
    if (remoteFilter === "onsite") result = result.filter((o) => !o.is_remote);

    // Sort by match score descending
    return result.sort((a, b) => calcMatchScore(b) - calcMatchScore(a));
  }, [opportunities, searchQuery, categoryFilter, remoteFilter, profile]);

  const handleApply = async () => {
    if (!applyModal) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: applyModal.id,
        user_id: user!.id,
        cover_letter: coverLetter.trim() || null,
        bid_amount: bidAmount ? Number(bidAmount) : null,
        status: "pending",
      });
      if (error) throw error;
      setAppliedIds((prev) => new Set(prev).add(applyModal.id));
      toast.success("Lamaran berhasil dikirim!");
      setApplyModal(null);
      setCoverLetter("");
      setBidAmount("");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim lamaran");
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-primary bg-primary/10 border-primary/20";
    if (score >= 50) return "text-amber-600 bg-amber-500/10 border-amber-500/20";
    return "text-muted-foreground bg-muted border-border";
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const fmt = (n: number) =>
      n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(0)}jt`
        : `${(n / 1_000).toFixed(0)}rb`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `Min ${fmt(min)}`;
    return `Max ${fmt(max!)}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="w-full px-6 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Matchmaking</h1>
              <p className="text-muted-foreground text-sm">
                Temukan peluang yang cocok dengan skill Anda
              </p>
            </div>
          </div>

          {/* Profile skills summary */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Skill Anda:</span>
              {profile.skills.slice(0, 8).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {s}
                </span>
              ))}
              {profile.skills.length > 8 && (
                <span className="text-xs text-muted-foreground">+{profile.skills.length - 8} lainnya</span>
              )}
            </div>
          )}
          {(!profile?.skills || profile.skills.length === 0) && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-600">
              ⚠️ Tambahkan skill di profil Anda untuk mendapatkan rekomendasi match yang lebih akurat.
            </div>
          )}
        </motion.div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Cari berdasarkan judul, deskripsi, atau skill..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 p-4 bg-card rounded-xl border border-border">
                  <div>
                    <Label className="text-xs text-muted-foreground">Kategori</Label>
                    <select
                      className="mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mode Kerja</Label>
                    <div className="flex gap-1 mt-1">
                      {(["all", "remote", "onsite"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setRemoteFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            remoteFilter === f
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {f === "all" ? "Semua" : f === "remote" ? "Remote" : "On-site"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        {(() => {
          const totalPages = Math.ceil(filtered.length / itemsPerPage);
          const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
          return (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filtered.length} peluang ditemukan • Halaman {currentPage} dari {totalPages || 1}
                </p>
              </div>

              {/* Opportunity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((opp, idx) => {
                  const score = calcMatchScore(opp);
                  const applied = appliedIds.has(opp.id);
            const budget = formatBudget(opp.budget_min, opp.budget_max);
            const matchedSkills = opp.skills_required?.filter((s) =>
              profile?.skills?.some((ps) => ps.toLowerCase() === s.toLowerCase())
            ) || [];

            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-lg transition-shadow flex flex-col cursor-pointer"
                onClick={() => navigate(`/job/${opp.slug}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {opp.category}
                      </span>
                      {opp.demand_type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground flex items-center gap-1">
                          {opp.demand_type === "team" ? <Users className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                          {opp.demand_type === "team" ? "Tim" : "Partner"}
                        </span>
                      )}
                      {opp.is_remote && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Remote
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground truncate">{opp.title}</h3>
                    {opp.company_name && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" /> {opp.company_name}
                      </p>
                    )}
                    {opp.description && (
                      <div className="text-sm text-muted-foreground mt-2 line-clamp-2 [&_p]:m-0 [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: opp.description }} />
                    )}
                  </div>

                  {/* Match Score */}
                  <div className={`shrink-0 w-16 h-16 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(score)}`}>
                    <TrendingUp className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-lg font-semibold leading-none">{score}%</span>
                  </div>
                </div>

                {/* Skills */}
                {opp.skills_required && opp.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {opp.skills_required.map((skill) => {
                      const isMatched = matchedSkills.some(
                        (ms) => ms.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <span
                          key={skill}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isMatched
                              ? "bg-primary/15 text-primary font-medium"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isMatched && <span className="mr-0.5">✓</span>}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                  {budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {budget}
                    </span>
                  )}
                  {opp.location && !opp.is_remote && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {opp.location}
                    </span>
                  )}
                  {opp.project_duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {opp.project_duration}
                    </span>
                  )}
                  {opp.min_experience_years != null && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> Min {opp.min_experience_years} tahun
                    </span>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {new Date(opp.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-2">
                    {applied ? (
                      <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Sudah Melamar
                      </span>
                    ) : (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); setApplyModal(opp); }}>
                        <Send className="w-3.5 h-3.5" /> Lamar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/job/${opp.slug}`); }}>
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </Button>
                  </div>
                </div>
              </motion.div>
                );
                })}

                {filtered.length === 0 && (
                  <div className="text-center py-16 col-span-full">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">Tidak ada peluang ditemukan</h3>
                    <p className="text-sm text-muted-foreground">Coba ubah filter atau cari dengan kata kunci lain</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Sebelumnya
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <span key={p} className="flex items-center">
                        {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted-foreground mx-1">…</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === p
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </div>


      {/* Apply Modal */}
      <AnimatePresence>
        {applyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setApplyModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 shadow-xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-card-foreground">Lamar Peluang</h2>
                <button
                  onClick={() => setApplyModal(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-muted rounded-xl p-3 mb-4">
                <p className="font-semibold text-sm text-card-foreground">{applyModal.title}</p>
                <p className="text-xs text-muted-foreground">{applyModal.category} • {applyModal.company_name || "Perusahaan"}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-card-foreground">Pesan / Cover Letter</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={4}
                    placeholder="Jelaskan mengapa Anda cocok untuk peluang ini..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>

                {(applyModal.budget_min || applyModal.budget_max) && (
                  <div>
                    <Label className="text-card-foreground">Bid Amount (IDR)</Label>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Budget: {formatBudget(applyModal.budget_min, applyModal.budget_max)}
                    </p>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type="number"
                        placeholder="Masukkan penawaran Anda"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={handleApply} disabled={submitting}>
                  <Send className="w-4 h-4" />
                  {submitting ? "Mengirim..." : "Kirim Lamaran"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Matchmaking;
