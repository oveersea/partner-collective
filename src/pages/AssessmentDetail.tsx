import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Clock, FileText, Target, Award, BarChart3, CheckCircle2, XCircle, Upload, Eye, ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

interface TestData {
  id: string;
  title: string;
  skill_name: string;
  assessment_type: string;
  test_tier: string;
  total_questions: number;
  passing_score: number;
  time_limit_minutes: number | null;
  price_cents: number;
  currency: string;
  is_active: boolean;
  description: string | null;
  skill_weight_pct: number;
  oveercode: string | null;
}

const AssessmentDetail = () => {
  const { oveercode } = useParams<{ oveercode: string }>();
  const { user } = useAuth();
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);

  useEffect(() => {
    if (!oveercode) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("competency_tests")
        .select("id, title, skill_name, assessment_type, test_tier, total_questions, passing_score, time_limit_minutes, price_cents, currency, is_active, description, skill_weight_pct, oveercode")
        .eq("oveercode", oveercode)
        .single();

      if (!data) { setLoading(false); return; }
      setTest(data as unknown as TestData);

      if (user?.id) {
        const [attRes, evRes] = await Promise.all([
          supabase
            .from("assessment_attempts")
            .select("id, status, score, earned_points, total_points, started_at, completed_at")
            .eq("test_id", data.id)
            .eq("user_id", user.id)
            .order("started_at", { ascending: false }),
          supabase
            .from("assessment_evidence")
            .select("id, file_name, file_url, description, status, reviewer_notes, created_at")
            .eq("test_id", data.id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);
        setAttempts(attRes.data || []);
        setEvidence(evRes.data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [oveercode, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Assessment Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Assessment yang Anda cari tidak tersedia.</p>
          <Link to="/learning?tab=assessments" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Assessments
          </Link>
        </div>
      </div>
    );
  }

  const bestScore = attempts.filter(a => a.status === "completed" && a.score != null).reduce((best, a) => Math.max(best, a.score), 0);
  const hasPassed = bestScore >= test.passing_score;
  const totalAttempts = attempts.length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link to="/learning?tab=assessments" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Assessments
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{test.title}</h1>
            <div className="flex gap-2">
              <Badge variant="secondary">{test.test_tier}</Badge>
              <Badge variant="secondary">{test.assessment_type}</Badge>
              {!test.is_active && <Badge variant="destructive">Tidak Aktif</Badge>}
            </div>
          </div>
          {test.description && (
            <p className="text-muted-foreground max-w-3xl leading-relaxed">{test.description}</p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Stats cards */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: FileText, label: "Jumlah Soal", value: `${test.total_questions} soal` },
                { icon: Clock, label: "Waktu", value: test.time_limit_minutes ? `${test.time_limit_minutes} menit` : "Tidak terbatas" },
                { icon: Target, label: "Passing Score", value: `${test.passing_score}%` },
                { icon: BarChart3, label: "Bobot Skill", value: `${test.skill_weight_pct}%` },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-sm font-semibold text-foreground">{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Your attempts */}
            {user && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-lg font-semibold text-foreground mb-4">Riwayat Percobaan</h2>
                {attempts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Belum pernah mengerjakan assessment ini</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((a) => {
                      const passed = a.score != null && a.score >= test.passing_score;
                      return (
                        <Card key={a.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${passed ? "bg-green-100 text-green-600" : a.status === "completed" ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"}`}>
                              {a.status === "completed" ? (passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />) : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {a.status === "completed" ? (passed ? "Lulus" : "Tidak Lulus") : "Sedang Berlangsung"}
                              </p>
                              <p className="text-xs text-muted-foreground">{new Date(a.started_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {a.score != null && <p className="text-lg font-bold text-foreground">{a.score}%</p>}
                              {a.earned_points != null && a.total_points != null && (
                                <p className="text-xs text-muted-foreground">{a.earned_points}/{a.total_points} poin</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Evidence */}
            {user && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-lg font-semibold text-foreground mb-4">Evidence yang Diunggah</h2>
                {evidence.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Belum ada evidence untuk assessment ini</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {evidence.map((e) => {
                      const statusColor = e.status === "approved" ? "text-green-600 bg-green-100" : e.status === "rejected" ? "text-red-600 bg-red-100" : "text-yellow-600 bg-yellow-100";
                      return (
                        <Card key={e.id}>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Upload className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{e.file_name}</p>
                              {e.description && <p className="text-xs text-muted-foreground line-clamp-1">{e.description}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{new Date(e.created_at).toLocaleDateString("id-ID")}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`text-[10px] ${statusColor}`}>
                                {e.status === "approved" ? "Disetujui" : e.status === "rejected" ? "Ditolak" : "Menunggu"}
                              </Badge>
                              {e.file_url && (
                                <a href={e.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                  <Eye className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-5">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {test.price_cents === 0 ? "Gratis" : formatRupiah(test.price_cents)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{test.currency}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Skill</span>
                    <span className="font-medium text-foreground">{test.skill_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipe</span>
                    <span className="font-medium text-foreground capitalize">{test.assessment_type.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tier</span>
                    <Badge variant="secondary" className="capitalize">{test.test_tier}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Soal</span>
                    <span className="font-medium text-foreground">{test.total_questions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Waktu</span>
                    <span className="font-medium text-foreground">{test.time_limit_minutes ? `${test.time_limit_minutes} min` : "∞"}</span>
                  </div>
                </div>

                {user && totalAttempts > 0 && (
                  <div className={`rounded-lg p-3 text-center ${hasPassed ? "bg-green-50 border border-green-200" : "bg-muted/50"}`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {hasPassed ? <ShieldCheck className="w-4 h-4 text-green-600" /> : <BarChart3 className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm font-semibold text-foreground">{hasPassed ? "Lulus" : "Belum Lulus"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Skor terbaik: {bestScore}% · {totalAttempts}x percobaan</p>
                  </div>
                )}

                {!user && (
                  <Link to="/auth">
                    <Button className="w-full">Login untuk Mulai</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentDetail;
