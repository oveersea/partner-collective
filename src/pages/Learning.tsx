import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Clock, Star, Users, MapPin, GraduationCap, BookOpen, ChevronLeft, ChevronRight, X,
  ClipboardCheck, Award, BarChart3, FileText, BadgeCheck, ExternalLink, CheckCircle2, XCircle, Upload, Eye,
} from "lucide-react";
import { motion } from "framer-motion";

interface Program {
  id: string;
  title: string;
  slug: string;
  oveercode: string | null;
  description: string | null;
  category: string;
  level: string | null;
  duration: string | null;
  delivery_mode: string | null;
  price_cents: number;
  currency: string;
  rating: number | null;
  student_count: number | null;
  badge: string | null;
  thumbnail_url: string | null;
  location: string | null;
  instructor_name: string | null;
}

const ITEMS_PER_PAGE = 20;

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const TABS = [
  { value: "programs", label: "Programs", icon: GraduationCap },
  { value: "assessments", label: "Assessments", icon: ClipboardCheck },
  { value: "certificates", label: "Certificates", icon: Award },
  { value: "skill-score", label: "Skill Score", icon: BarChart3 },
  { value: "test-history", label: "Test History", icon: FileText },
  { value: "evidence", label: "Evidence", icon: BadgeCheck },
];

/* ───── Sub-tab components ───── */

const AssessmentsTab = ({ userId }: { userId?: string }) => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("competency_tests")
        .select("id, title, skill_name, assessment_type, test_tier, time_limit_minutes, total_questions, passing_score, price_cents, currency, oveercode, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setTests(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <SkeletonGrid />;
  if (!tests.length) return <EmptyState icon={ClipboardCheck} text="Belum ada assessment tersedia" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tests.map((t) => (
        <Card key={t.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-foreground">{t.title}</h3>
              <Badge variant="secondary" className="text-[10px] shrink-0">{t.test_tier}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{t.skill_name}</span>
              <span>·</span>
              <span>{t.total_questions} soal</span>
              {t.time_limit_minutes && <><span>·</span><span>{t.time_limit_minutes} menit</span></>}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-semibold text-foreground">
                {t.price_cents === 0 ? "Gratis" : formatRupiah(t.price_cents)}
              </span>
              <Badge className="text-[10px]">Passing: {t.passing_score}%</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CertificatesTab = ({ userId }: { userId?: string }) => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("certificates")
        .select("id, serial_number, program_name, holder_name, certification_body, issued_at, certificate_url")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false });
      setCerts(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (!userId) return <EmptyState icon={Award} text="Login untuk melihat sertifikat Anda" />;
  if (loading) return <SkeletonGrid />;
  if (!certs.length) return <EmptyState icon={Award} text="Belum ada sertifikat yang diperoleh" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {certs.map((c) => (
        <Card key={c.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">{c.program_name}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{c.holder_name}</p>
            {c.certification_body && <p className="text-xs text-muted-foreground">Issued by {c.certification_body}</p>}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {c.issued_at ? new Date(c.issued_at).toLocaleDateString("id-ID") : "-"}
              </span>
              {c.certificate_url && (
                <a href={c.certificate_url} target="_blank" rel="noreferrer" className="text-primary text-xs inline-flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Lihat
                </a>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">SN: {c.serial_number}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const SkillScoreTab = ({ userId }: { userId?: string }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("career_assessment_results")
        .select("id, selected_career, match_percentage, skill_scores, recommendation, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setResults(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (!userId) return <EmptyState icon={BarChart3} text="Login untuk melihat skill score Anda" />;
  if (loading) return <SkeletonGrid />;
  if (!results.length) return <EmptyState icon={BarChart3} text="Belum ada skill score. Selesaikan assessment untuk mendapatkannya." />;

  return (
    <div className="space-y-4">
      {results.map((r) => {
        const scores = typeof r.skill_scores === "object" && r.skill_scores ? r.skill_scores : {};
        return (
          <Card key={r.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{r.selected_career}</h3>
                <Badge className="text-xs">{r.match_percentage}% Match</Badge>
              </div>
              {Object.keys(scores).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(scores).map(([skill, score]) => (
                    <div key={skill} className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1 truncate">{skill}</p>
                      <p className="text-lg font-bold text-foreground">{String(score)}</p>
                    </div>
                  ))}
                </div>
              )}
              {r.recommendation && <p className="text-sm text-muted-foreground">{r.recommendation}</p>}
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("id-ID")}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const TestHistoryTab = ({ userId }: { userId?: string }) => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("assessment_attempts")
        .select("id, status, score, earned_points, total_points, started_at, completed_at, test_id, competency_tests(title, skill_name, passing_score)")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });
      setAttempts(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (!userId) return <EmptyState icon={FileText} text="Login untuk melihat riwayat test" />;
  if (loading) return <SkeletonGrid />;
  if (!attempts.length) return <EmptyState icon={FileText} text="Belum ada riwayat test" />;

  return (
    <div className="space-y-3">
      {attempts.map((a) => {
        const test = a.competency_tests as any;
        const passed = a.score != null && test?.passing_score != null && a.score >= test.passing_score;
        return (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${passed ? "bg-green-100 text-green-600" : a.status === "completed" ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"}`}>
                {a.status === "completed" ? (passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />) : <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{test?.title || "Assessment"}</h4>
                <p className="text-xs text-muted-foreground">{test?.skill_name} · {new Date(a.started_at).toLocaleDateString("id-ID")}</p>
              </div>
              <div className="text-right shrink-0">
                {a.score != null && <p className="text-sm font-bold text-foreground">{a.score}%</p>}
                <Badge variant={a.status === "completed" ? (passed ? "default" : "destructive") : "secondary"} className="text-[10px]">
                  {a.status === "completed" ? (passed ? "Lulus" : "Tidak Lulus") : "Berlangsung"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const EvidenceTab = ({ userId }: { userId?: string }) => {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("assessment_evidence")
        .select("id, file_name, file_url, description, status, reviewer_notes, created_at, reviewed_at, competency_tests(title, skill_name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setEvidence(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (!userId) return <EmptyState icon={BadgeCheck} text="Login untuk melihat evidence Anda" />;
  if (loading) return <SkeletonGrid />;
  if (!evidence.length) return <EmptyState icon={BadgeCheck} text="Belum ada evidence yang diunggah" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {evidence.map((e) => {
        const test = e.competency_tests as any;
        const statusColor = e.status === "approved" ? "text-green-600 bg-green-100" : e.status === "rejected" ? "text-red-600 bg-red-100" : "text-yellow-600 bg-yellow-100";
        return (
          <Card key={e.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{test?.title || "Assessment"}</h3>
                  <p className="text-xs text-muted-foreground">{test?.skill_name}</p>
                </div>
                <Badge className={`text-[10px] shrink-0 ${statusColor}`}>
                  {e.status === "approved" ? "Disetujui" : e.status === "rejected" ? "Ditolak" : "Menunggu"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="w-3 h-3" />
                <span className="truncate">{e.file_name}</span>
              </div>
              {e.description && <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>}
              {e.reviewer_notes && (
                <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">
                  <span className="font-medium">Review:</span> {e.reviewer_notes}
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleDateString("id-ID")}</span>
                {e.file_url && (
                  <a href={e.file_url} target="_blank" rel="noreferrer" className="text-primary text-xs inline-flex items-center gap-1 hover:underline">
                    <Eye className="w-3 h-3" /> Lihat File
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-20 text-muted-foreground">
    <Icon className="w-12 h-12 mx-auto mb-3 opacity-40" />
    <p className="text-sm">{text}</p>
  </div>
);

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardContent></Card>
    ))}
  </div>
);

/* ───── Main Component ───── */

const Learning = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const activeTab = searchParams.get("tab") || "programs";
  const skillsFilter = searchParams.get("skills");
  const skillsList = skillsFilter ? skillsFilter.split(",").map(s => s.trim().toLowerCase()) : [];

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [deliveryMode, setDeliveryMode] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("programs")
        .select("id, title, slug, oveercode, description, category, level, duration, delivery_mode, price_cents, currency, rating, student_count, badge, thumbnail_url, location, instructor_name")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (!error && data) setPrograms(data as Program[]);
      setLoading(false);
    };
    fetchPrograms();
  }, []);

  const filtered = useMemo(() => {
    let list = programs;
    if (skillsList.length > 0) {
      list = list.filter((p) =>
        skillsList.some((kw) =>
          p.title.toLowerCase().includes(kw) || (p.description?.toLowerCase().includes(kw))
        )
      );
    }
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (level !== "all") list = list.filter((p) => p.level === level);
    if (deliveryMode !== "all") list = list.filter((p) => p.delivery_mode === deliveryMode);
    return list;
  }, [programs, search, category, level, deliveryMode, skillsList.join(",")]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, category, level, deliveryMode]);

  const categories = [...new Set(programs.map((p) => p.category))];
  const levels = [...new Set(programs.map((p) => p.level).filter(Boolean))];
  const modes = [...new Set(programs.map((p) => p.delivery_mode).filter(Boolean))];

  const activeFilters = [category !== "all", level !== "all", deliveryMode !== "all", skillsList.length > 0].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("all"); setLevel("all"); setDeliveryMode("all"); setSearch("");
    if (skillsFilter) {
      setSearchParams((prev) => { prev.delete("skills"); return prev; });
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams((prev) => { prev.set("tab", tab); return prev; });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Learning & Assessment</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Boost your competencies with quality certification programs, assessments, and skill scoring.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b border-border rounded-none p-0 h-auto mb-6">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="inline-flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Programs Tab */}
          <TabsContent value="programs" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map((l) => <SelectItem key={l!} value={l!}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={deliveryMode} onValueChange={setDeliveryMode}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {modes.map((m) => <SelectItem key={m!} value={m!}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </motion.div>

            {skillsList.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span className="text-card-foreground font-medium">Showing programs for skills:</span>
                  <span className="text-muted-foreground">{skillsFilter}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><X className="w-3 h-3" /> Clear filter</Button>
              </div>
            )}

            {activeFilters > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{filtered.length} programs found</span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><X className="w-3 h-3" /> Reset filters</Button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-0"><Skeleton className="h-44 rounded-t-lg" /><div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/3" /></div></CardContent></Card>
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <EmptyState icon={BookOpen} text="No programs found. Try changing your filters." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginated.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link to={`/learning/${p.oveercode || p.slug}`}>
                      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        <div className="relative aspect-video bg-muted overflow-hidden">
                          {p.thumbnail_url ? (
                            <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-10 h-10 text-muted-foreground/30" /></div>
                          )}
                          {p.badge && <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">{p.badge}</Badge>}
                          <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">{p.category}</Badge>
                        </div>
                        <CardContent className="p-4 flex flex-col flex-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                            {p.level && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{p.level}</span>}
                            {p.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.duration}</span>}
                            {p.delivery_mode && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.delivery_mode}</span>}
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <span className="font-semibold text-sm text-foreground">{formatRupiah(p.price_cents)}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {p.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{p.rating}</span>}
                              {p.student_count != null && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{p.student_count}</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="mt-0">
            <AssessmentsTab userId={user?.id} />
          </TabsContent>
          <TabsContent value="certificates" className="mt-0">
            <CertificatesTab userId={user?.id} />
          </TabsContent>
          <TabsContent value="skill-score" className="mt-0">
            <SkillScoreTab userId={user?.id} />
          </TabsContent>
          <TabsContent value="test-history" className="mt-0">
            <TestHistoryTab userId={user?.id} />
          </TabsContent>
          <TabsContent value="evidence" className="mt-0">
            <EvidenceTab userId={user?.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Learning;
