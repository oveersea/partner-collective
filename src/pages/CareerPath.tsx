import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Target, Compass, TrendingUp, Star, ArrowRight, CheckCircle2, AlertTriangle, BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

interface CareerPath {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  skill_weights: any;
  is_active?: boolean;
  sort_order?: number;
}

interface AssessmentResult {
  id: string;
  selected_career: string;
  match_percentage: number;
  skill_scores: any;
  recommendation?: string | null;
  created_at?: string;
  career_path_id?: string | null;
}

const TABS = [
  { value: "paths", label: "Career Paths", icon: Target },
  { value: "recommendations", label: "Recommendations", icon: Compass },
  { value: "gap-analysis", label: "Skill Gap", icon: TrendingUp },
  { value: "roadmap", label: "Roadmap", icon: Star },
];

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

/* ── Paths Tab ── */
const PathsTab = () => {
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("career_paths")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setPaths(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <SkeletonGrid />;
  if (!paths.length) return <EmptyState icon={Target} text="Belum ada career path tersedia" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {paths.map((p, i) => {
        const weights = typeof p.skill_weights === "object" && p.skill_weights ? Object.keys(p.skill_weights) : [];
        return (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full hover:shadow-md transition-shadow group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {p.icon || "🎯"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                </div>
                {weights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {weights.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                    ))}
                    {weights.length > 4 && <Badge variant="outline" className="text-[10px]">+{weights.length - 4}</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ── Recommendations Tab ── */
const RecommendationsTab = ({ userId }: { userId?: string }) => {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("career_assessment_results")
        .select("id, selected_career, match_percentage, skill_scores, recommendation, created_at, career_path_id")
        .eq("user_id", userId)
        .order("match_percentage", { ascending: false });
      setResults(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (!userId) return <EmptyState icon={Compass} text="Login untuk melihat rekomendasi karier Anda" />;
  if (loading) return <SkeletonGrid />;
  if (!results.length) return <EmptyState icon={Compass} text="Belum ada rekomendasi. Selesaikan assessment terlebih dahulu." />;

  return (
    <div className="space-y-4">
      {results.map((r, i) => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-5">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold ${r.match_percentage >= 80 ? "bg-green-100 text-green-700" : r.match_percentage >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}`}>
                {r.match_percentage}%
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{r.selected_career}</h3>
                {r.recommendation && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.recommendation}</p>}
                <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString("id-ID")}</p>
              </div>
              <Badge variant={r.match_percentage >= 80 ? "default" : "secondary"} className="shrink-0">
                {r.match_percentage >= 80 ? "Sangat Cocok" : r.match_percentage >= 50 ? "Cukup Cocok" : "Perlu Eksplorasi"}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

/* ── Skill Gap Tab ── */
const SkillGapTab = ({ userId }: { userId?: string }) => {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      const [resData, pathData] = await Promise.all([
        supabase
          .from("career_assessment_results")
          .select("id, selected_career, match_percentage, skill_scores, career_path_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("career_paths")
          .select("id, name, skill_weights")
          .eq("is_active", true),
      ]);
      setResults(resData.data || []);
      setPaths(pathData.data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (!userId) return <EmptyState icon={TrendingUp} text="Login untuk melihat skill gap analysis" />;
  if (loading) return <SkeletonGrid />;
  if (!results.length) return <EmptyState icon={TrendingUp} text="Selesaikan assessment untuk melihat gap analysis" />;

  return (
    <div className="space-y-6">
      {results.map((r) => {
        const scores = typeof r.skill_scores === "object" && r.skill_scores ? r.skill_scores : {};
        const matchedPath = paths.find(p => p.id === r.career_path_id);
        const requiredSkills = matchedPath && typeof matchedPath.skill_weights === "object" ? matchedPath.skill_weights : {};

        const gaps: { skill: string; current: number; required: number }[] = [];
        const strengths: { skill: string; score: number }[] = [];

        Object.entries(requiredSkills).forEach(([skill, weight]) => {
          const current = Number(scores[skill] || 0);
          const required = Number(weight);
          if (current < required) {
            gaps.push({ skill, current, required });
          } else {
            strengths.push({ skill, score: current });
          }
        });

        // Also add skills from scores not in required
        Object.entries(scores).forEach(([skill, score]) => {
          if (!requiredSkills[skill]) {
            strengths.push({ skill, score: Number(score) });
          }
        });

        return (
          <Card key={r.id}>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{r.selected_career}</h3>
                <Badge>{r.match_percentage}% Match</Badge>
              </div>

              {gaps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" /> Skill yang Perlu Ditingkatkan
                  </h4>
                  <div className="space-y-2">
                    {gaps.sort((a, b) => (a.current / a.required) - (b.current / b.required)).map((g) => (
                      <div key={g.skill} className="flex items-center gap-3">
                        <span className="text-sm text-foreground w-32 truncate">{g.skill}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${Math.min(100, (g.current / g.required) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{g.current}/{g.required}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Skill yang Sudah Kuat
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((s) => (
                      <Badge key={s.skill} variant="secondary" className="gap-1">
                        {s.skill} <span className="text-primary font-bold">{s.score}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gaps.length === 0 && Object.keys(requiredSkills).length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(scores).map(([skill, score]) => (
                    <div key={skill} className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1 truncate">{skill}</p>
                      <p className="text-lg font-bold text-foreground">{String(score)}</p>
                    </div>
                  ))}
                </div>
              )}

              {gaps.length > 0 && (
                <Link to="/learning" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <BookOpen className="w-4 h-4" /> Cari program untuk meningkatkan skill
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

/* ── Roadmap Tab ── */
const RoadmapTab = ({ userId }: { userId?: string }) => {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("career_assessment_results")
        .select("id, selected_career, match_percentage, skill_scores, recommendation, created_at")
        .eq("user_id", userId)
        .order("match_percentage", { ascending: false })
        .limit(3);
      setResults(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (!userId) return <EmptyState icon={Star} text="Login untuk melihat career roadmap Anda" />;
  if (loading) return <SkeletonGrid />;
  if (!results.length) return <EmptyState icon={Star} text="Selesaikan assessment untuk mendapatkan roadmap karier" />;

  const topResult = results[0];
  const scores = typeof topResult.skill_scores === "object" && topResult.skill_scores ? topResult.skill_scores : {};
  const sortedSkills = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]));

  const steps = [
    { title: "Evaluasi Skill Saat Ini", desc: `Anda telah menyelesaikan assessment untuk ${topResult.selected_career} dengan match ${topResult.match_percentage}%.`, done: true },
    { title: "Identifikasi Gap", desc: "Lihat tab Skill Gap untuk mengetahui area yang perlu ditingkatkan.", done: topResult.match_percentage < 100 },
    { title: "Ikuti Program Training", desc: "Daftar program yang sesuai untuk meningkatkan skill yang kurang.", done: false },
    { title: "Ambil Assessment Lanjutan", desc: "Uji kembali kompetensi setelah menyelesaikan training.", done: false },
    { title: "Raih Sertifikasi", desc: "Dapatkan sertifikat sebagai bukti kompetensi Anda.", done: false },
  ];

  return (
    <div className="space-y-8">
      {/* Top career target */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target Karier Utama</p>
              <h3 className="text-xl font-bold text-foreground">{topResult.selected_career}</h3>
              <p className="text-sm text-primary font-medium">{topResult.match_percentage}% Match</p>
            </div>
          </div>
          {sortedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sortedSkills.map(([skill, score]) => (
                <Badge key={skill} variant="secondary">{skill}: {String(score)}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roadmap steps */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-start gap-4 pl-12"
            >
              <div className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${step.done ? "bg-primary border-primary" : "bg-background border-border"}`}>
                {step.done && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
              </div>
              <Card className={`flex-1 ${step.done ? "opacity-70" : ""}`}>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {topResult.recommendation && (
        <Card>
          <CardContent className="p-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">💡 Rekomendasi</h4>
            <p className="text-sm text-muted-foreground">{topResult.recommendation}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ── Main Page ── */
const CareerPathPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const activeTab = searchParams.get("tab") || "paths";

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
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Career Path</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Temukan jalur karier yang sesuai dengan skill dan minat Anda, analisis gap, dan ikuti roadmap menuju karier impian.
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

          <TabsContent value="paths" className="mt-0"><PathsTab /></TabsContent>
          <TabsContent value="recommendations" className="mt-0"><RecommendationsTab userId={user?.id} /></TabsContent>
          <TabsContent value="gap-analysis" className="mt-0"><SkillGapTab userId={user?.id} /></TabsContent>
          <TabsContent value="roadmap" className="mt-0"><RoadmapTab userId={user?.id} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CareerPathPage;
