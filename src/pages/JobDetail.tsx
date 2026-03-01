import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Clock, Briefcase, DollarSign, Users, Globe,
  Building2, TrendingUp, Star, Send, CheckCircle2, Calendar, XCircle, AlertCircle,
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
  project_scope: string | null;
}

interface UserProfile {
  skills: string[] | null;
  years_of_experience: number | null;
  highest_education: string | null;
}

interface MatchCriteria {
  label: string;
  weight: number;
  score: number;
  maxScore: number;
  detail: string;
  status: "pass" | "partial" | "fail";
}

const formatBudget = (min: number | null, max: number | null): string => {
  if (!min && !max) return "";
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Mulai ${fmt(min)}`;
  return `Maks ${fmt(max!)}`;
};

const JobDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  // Apply form
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && slug) fetchData();
  }, [user, slug]);

  const fetchData = async () => {
    const [oppRes, profileRes] = await Promise.all([
      supabase
        .from("opportunities")
        .select("id, title, description, category, skills_required, budget_min, budget_max, is_remote, location, demand_type, project_duration, deadline, company_name, job_type, min_experience_years, created_at, slug, user_id, project_scope")
        .eq("slug", slug!)
        .single(),
      supabase
        .from("profiles")
        .select("skills, years_of_experience, highest_education")
        .eq("user_id", user!.id)
        .maybeSingle(),
    ]);

    if (oppRes.data) {
      setOpp(oppRes.data as Opportunity);

      // Check if already applied
      const { data: appData } = await supabase
        .from("opportunity_applications")
        .select("id")
        .eq("opportunity_id", oppRes.data.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      setApplied(!!appData);
    }

    if (profileRes.data) setProfile(profileRes.data as UserProfile);
    setLoading(false);
  };

  const calcMatchDetails = (): { score: number; criteria: MatchCriteria[] } => {
    if (!opp) return { score: 0, criteria: [] };
    const criteria: MatchCriteria[] = [];
    const requiredSkills = opp.skills_required || [];
    const userSkills = profile?.skills || [];

    // 1. Skills match (50%)
    if (requiredSkills.length > 0) {
      const matched = requiredSkills.filter((s) =>
        userSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())
      );
      const pct = matched.length / requiredSkills.length;
      const pts = Math.round(pct * 50);
      criteria.push({
        label: "Kecocokan Skill",
        weight: 50,
        score: pts,
        maxScore: 50,
        detail: `${matched.length}/${requiredSkills.length} skill cocok`,
        status: pct >= 0.7 ? "pass" : pct >= 0.4 ? "partial" : "fail",
      });
    } else {
      criteria.push({ label: "Kecocokan Skill", weight: 50, score: 25, maxScore: 50, detail: "Tidak ada syarat skill", status: "partial" });
    }

    // 2. Experience (30%)
    const minExp = opp.min_experience_years || 0;
    const userExp = profile?.years_of_experience || 0;
    let expPts = 0;
    let expStatus: "pass" | "partial" | "fail" = "fail";
    if (minExp === 0) { expPts = 30; expStatus = "pass"; }
    else if (userExp >= minExp) { expPts = 30; expStatus = "pass"; }
    else if (userExp >= minExp - 1) { expPts = 20; expStatus = "partial"; }
    else if (userExp > 0) { expPts = 10; expStatus = "fail"; }
    criteria.push({
      label: "Pengalaman Kerja",
      weight: 30,
      score: expPts,
      maxScore: 30,
      detail: minExp > 0 ? `${userExp} tahun (min ${minExp} tahun)` : "Tidak ada syarat pengalaman",
      status: expStatus,
    });

    // 3. Profile completeness (20%)
    let completePts = 0;
    const checks: string[] = [];
    if (userSkills.length > 0) { completePts += 8; checks.push("skill"); }
    if (userExp > 0) { completePts += 6; checks.push("pengalaman"); }
    if (profile?.highest_education) { completePts += 6; checks.push("pendidikan"); }
    criteria.push({
      label: "Kelengkapan Profil",
      weight: 20,
      score: completePts,
      maxScore: 20,
      detail: checks.length > 0 ? `${checks.join(", ")} terisi` : "Profil belum lengkap",
      status: completePts >= 14 ? "pass" : completePts >= 8 ? "partial" : "fail",
    });

    const total = Math.min(criteria.reduce((a, c) => a + c.score, 0), 100);
    return { score: total, criteria };
  };

  const { score, criteria: matchCriteria } = opp ? calcMatchDetails() : { score: 0, criteria: [] };

  const handleApply = async () => {
    if (!opp) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: opp.id,
        user_id: user!.id,
        cover_letter: coverLetter.trim() || null,
        bid_amount: bidAmount ? Number(bidAmount) : null,
        status: "pending",
      });
      if (error) throw error;
      setApplied(true);
      setShowApplyForm(false);
      toast.success("Lamaran berhasil dikirim!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim lamaran");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Job tidak ditemukan</h1>
          <p className="text-muted-foreground mb-4">Peluang ini mungkin sudah tidak tersedia.</p>
          <Button onClick={() => navigate("/matchmaking")}>Kembali ke Matchmaking</Button>
        </div>
      </div>
    );
  }

  // score is already computed via calcMatchDetails above
  const budget = formatBudget(opp.budget_min, opp.budget_max);
  const matchedSkills = opp.skills_required?.filter((s) =>
    profile?.skills?.some((ps) => ps.toLowerCase() === s.toLowerCase())
  ) || [];

  const getScoreColor = (s: number) => {
    if (s >= 70) return "border-primary bg-primary/10 text-primary";
    if (s >= 40) return "border-amber-500 bg-amber-500/10 text-amber-600";
    return "border-border bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="w-full px-6 py-8">
        <button
          onClick={() => navigate("/matchmaking")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Matchmaking
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Job Detail (70%) */}
          <div className="lg:w-[70%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{opp.category}</span>
                      {opp.demand_type && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground flex items-center gap-1">
                          {opp.demand_type === "team" ? <Users className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                          {opp.demand_type === "team" ? "Tim" : "Partner"}
                        </span>
                      )}
                      {opp.is_remote && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">🌍 Remote</span>
                      )}
                      {opp.job_type && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{opp.job_type}</span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">{opp.title}</h1>
                    {opp.company_name && (
                      <p className="text-muted-foreground flex items-center gap-1.5 mt-2">
                        <Building2 className="w-4 h-4" /> {opp.company_name}
                      </p>
                    )}
                  </div>
                  <div className={`shrink-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(score)}`}>
                    <TrendingUp className="w-4 h-4 mb-1" />
                    <span className="text-2xl font-bold leading-none">{score}%</span>
                    <span className="text-[10px] mt-0.5">Match</span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {budget && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> {budget}
                    </span>
                  )}
                  {opp.location && !opp.is_remote && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {opp.location}
                    </span>
                  )}
                  {opp.project_duration && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {opp.project_duration}
                    </span>
                  )}
                  {opp.min_experience_years != null && (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" /> Min {opp.min_experience_years} tahun
                    </span>
                  )}
                  {opp.deadline && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Deadline: {new Date(opp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Diposting {new Date(opp.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Skills */}
              {opp.skills_required && opp.skills_required.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
                  <h2 className="text-sm font-semibold text-card-foreground mb-3">Skills yang Dibutuhkan</h2>
                  <div className="flex flex-wrap gap-2">
                    {opp.skills_required.map((skill) => {
                      const isMatched = matchedSkills.some(
                        (ms) => ms.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <span
                          key={skill}
                          className={`text-sm px-3 py-1.5 rounded-full ${
                            isMatched
                              ? "bg-primary/15 text-primary font-medium"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isMatched && "✓ "}{skill}
                        </span>
                      );
                    })}
                  </div>
                  {matchedSkills.length > 0 && (
                    <p className="text-xs text-primary mt-3">
                      {matchedSkills.length} dari {opp.skills_required.length} skill cocok dengan profil Anda
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              {opp.description && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
                  <h2 className="text-sm font-semibold text-card-foreground mb-3">Deskripsi</h2>
                  <div
                    className="text-sm text-muted-foreground prose prose-sm max-w-none [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-card-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: opp.description }}
                  />
                </div>
              )}

              {/* Project Scope */}
              {opp.project_scope && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
                  <h2 className="text-sm font-semibold text-card-foreground mb-3">Scope of Work</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{opp.project_scope}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Sidebar (30%) */}
          <div className="lg:w-[30%]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 space-y-4"
            >
              {/* Apply Card */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                {applied ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-card-foreground">Sudah Melamar</p>
                    <p className="text-xs text-muted-foreground mt-1">Lamaran Anda sedang ditinjau</p>
                  </div>
                ) : showApplyForm ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-card-foreground">Kirim Lamaran</h3>
                    <div>
                      <Label className="text-card-foreground">Pesan / Cover Letter</Label>
                      <Textarea
                        className="mt-1.5"
                        rows={4}
                        placeholder="Jelaskan mengapa Anda cocok..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>
                    {(opp.budget_min || opp.budget_max) && (
                      <div>
                        <Label className="text-card-foreground">Bid Amount (IDR)</Label>
                        <p className="text-xs text-muted-foreground mb-1.5">Budget: {budget}</p>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            type="number"
                            placeholder="Penawaran Anda"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowApplyForm(false)}>
                        Batal
                      </Button>
                      <Button className="flex-1" onClick={handleApply} disabled={submitting}>
                        <Send className="w-4 h-4" />
                        {submitting ? "Mengirim..." : "Kirim"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Match Score Indicator */}
                    <div className={`rounded-xl p-4 mb-3 ${score >= 70 ? "bg-primary/10 border border-primary/20" : "bg-destructive/10 border border-destructive/20"}`}>
                      <div className="text-center mb-3">
                        <p className={`text-3xl font-bold ${score >= 70 ? "text-primary" : "text-destructive"}`}>{score}%</p>
                        <p className={`text-xs font-medium ${score >= 70 ? "text-primary" : "text-destructive"}`}>
                          {score >= 70 ? "Match — Anda memenuhi syarat" : "Match terlalu rendah (min 70%)"}
                        </p>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-muted rounded-full mb-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${score >= 70 ? "bg-primary" : score >= 40 ? "bg-amber-500" : "bg-destructive"}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      {/* Criteria breakdown */}
                      <div className="space-y-2.5">
                        {matchCriteria.map((c, i) => (
                          <div key={i} className="flex items-start gap-2">
                            {c.status === "pass" ? (
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            ) : c.status === "partial" ? (
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-card-foreground">{c.label}</span>
                                <span className={`text-xs font-bold ${c.status === "pass" ? "text-primary" : c.status === "partial" ? "text-amber-600" : "text-destructive"}`}>
                                  {c.score}/{c.maxScore}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{c.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" size="lg" onClick={() => setShowApplyForm(true)} disabled={score < 70}>
                      <Send className="w-4 h-4" /> Lamar Sekarang
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {score >= 70 ? "Gratis, tanpa biaya" : "Tingkatkan skill & pengalaman Anda untuk melamar"}
                    </p>
                  </div>
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Ringkasan</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kategori</span>
                    <span className="text-card-foreground font-medium">{opp.category}</span>
                  </div>
                  {opp.demand_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipe</span>
                      <span className="text-card-foreground font-medium">{opp.demand_type === "team" ? "Tim" : "Partner"}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode Kerja</span>
                    <span className="text-card-foreground font-medium">{opp.is_remote ? "Remote" : "On-site"}</span>
                  </div>
                  {budget && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="text-card-foreground font-medium text-right text-xs">{budget}</span>
                    </div>
                  )}
                  {opp.min_experience_years != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pengalaman</span>
                      <span className="text-card-foreground font-medium">Min {opp.min_experience_years} tahun</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Match Score</span>
                    <span className={`font-bold ${score >= 70 ? "text-primary" : score >= 40 ? "text-amber-600" : "text-muted-foreground"}`}>{score}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
