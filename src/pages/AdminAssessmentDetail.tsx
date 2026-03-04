import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Eye, EyeOff, Users, FileText, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string | null;
  points: number;
  sort_order: number;
  skill_category: string | null;
}

const TIER_OPTIONS = ["basic", "intermediate", "advanced", "comprehensive"];
const TYPE_OPTIONS = ["multiple_choice", "practical", "portfolio"];

const AdminAssessmentDetail = () => {
  const { oveercode: paramCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<TestData>>({});
  const [attemptCount, setAttemptCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (paramCode) fetchData();
  }, [paramCode]);

  const fetchData = async () => {
    setLoading(true);
    // First resolve oveercode to id
    const { data: testLookup } = await supabase.from("competency_tests").select("id").eq("oveercode", paramCode!).single();
    if (!testLookup) { toast.error("Data assessment tidak ditemukan"); navigate("/admin"); return; }
    const testId = testLookup.id;

    const [testRes, questionRes, attemptRes, orderRes] = await Promise.all([
      supabase.from("competency_tests").select("*").eq("id", testId).single(),
      supabase.from("assessment_questions").select("*").eq("test_id", testId).order("sort_order"),
      supabase.from("assessment_attempts").select("id", { count: "exact" }).eq("test_id", testId),
      supabase.from("assessment_orders").select("id", { count: "exact" }).eq("test_id", testId),
    ]);

    if (testRes.error || !testRes.data) {
      toast.error("Data assessment tidak ditemukan");
      navigate("/admin");
      return;
    }

    const data = testRes.data as unknown as TestData;
    setTest(data);
    setEditData(data);
    setQuestions((questionRes.data || []) as unknown as Question[]);
    setAttemptCount(attemptRes.count || 0);
    setOrderCount(orderRes.count || 0);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!test) return;
    setSaving(true);
    const { error } = await supabase
      .from("competency_tests")
      .update({
        title: editData.title,
        skill_name: editData.skill_name,
        assessment_type: editData.assessment_type,
        test_tier: editData.test_tier,
        total_questions: editData.total_questions,
        passing_score: editData.passing_score,
        time_limit_minutes: editData.time_limit_minutes,
        price_cents: editData.price_cents,
        currency: editData.currency,
        is_active: editData.is_active,
        description: editData.description,
      })
      .eq("id", test.id);

    if (error) toast.error("Gagal menyimpan: " + error.message);
    else {
      toast.success("Assessment berhasil diperbarui");
      fetchData();
    }
    setSaving(false);
  };

  const toggleActive = async () => {
    if (!test) return;
    const { error } = await supabase.from("competency_tests").update({ is_active: !test.is_active }).eq("id", test.id);
    if (error) toast.error("Gagal update status");
    else { toast.success("Status diperbarui"); fetchData(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{test.title}</h1>
              <p className="text-sm text-muted-foreground">Assessment Detail</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleActive}>
              {test.is_active ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {test.is_active ? "Nonaktifkan" : "Aktifkan"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <ClipboardList className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold text-foreground">{questions.length}</div>
              <div className="text-xs text-muted-foreground">Soal</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold text-foreground">{attemptCount}</div>
              <div className="text-xs text-muted-foreground">Attempts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold text-foreground">{orderCount}</div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${test.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {test.is_active ? "Aktif" : "Nonaktif"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Status</div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Informasi Umum</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input value={editData.title || ""} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
              </div>
              <div>
                <Label>Skill Name</Label>
                <Input value={editData.skill_name || ""} onChange={(e) => setEditData({ ...editData, skill_name: e.target.value })} />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={4} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Konfigurasi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipe Assessment</Label>
                  <Select value={editData.assessment_type || ""} onValueChange={(v) => setEditData({ ...editData, assessment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tier</Label>
                  <Select value={editData.test_tier || ""} onValueChange={(v) => setEditData({ ...editData, test_tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jumlah Soal</Label>
                  <Input type="number" value={editData.total_questions || 0} onChange={(e) => setEditData({ ...editData, total_questions: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input type="number" value={editData.passing_score || 0} onChange={(e) => setEditData({ ...editData, passing_score: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Waktu (menit)</Label>
                  <Input type="number" value={editData.time_limit_minutes || ""} onChange={(e) => setEditData({ ...editData, time_limit_minutes: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <Label>Harga (cents)</Label>
                  <Input type="number" value={editData.price_cents || 0} onChange={(e) => setEditData({ ...editData, price_cents: Number(e.target.value) })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Daftar Soal ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada soal</p>
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 min-w-[24px]">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{q.question_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{q.question_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{q.points} pts</span>
                        {q.skill_category && <span className="text-[10px] text-muted-foreground">• {q.skill_category}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAssessmentDetail;
