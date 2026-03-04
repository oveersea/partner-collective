import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight, Check, X, Trash2, FileText } from "lucide-react";

interface CompetencyTest {
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
  oveercode: string | null;
  created_at: string;
}

interface AssessmentOrder {
  id: string;
  order_number: string;
  user_id: string;
  test_id: string;
  status: string;
  amount: number;
  currency: string;
  payment_proof_url: string | null;
  admin_notes: string | null;
  created_at: string;
  test_title?: string;
  user_name?: string;
  user_email?: string;
}

interface AssessmentAttempt {
  id: string;
  user_id: string;
  test_id: string;
  status: string;
  score: number | null;
  earned_points: number | null;
  total_points: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  test_title?: string;
  user_name?: string;
}

interface AssessmentEvidence {
  id: string;
  user_id: string;
  test_id: string;
  file_name: string;
  file_url: string;
  description: string | null;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  test_title?: string;
  user_name?: string;
}

const PAGE_SIZE = 20;

const AdminAssessment = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<CompetencyTest[]>([]);
  const [orders, setOrders] = useState<AssessmentOrder[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [evidence, setEvidence] = useState<AssessmentEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tests" | "orders" | "attempts" | "evidence">("tests");
  const [search, setSearch] = useState("");
  const [testPage, setTestPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [attemptPage, setAttemptPage] = useState(1);
  const [evidencePage, setEvidencePage] = useState(1);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setTestPage(1); setOrderPage(1); setAttemptPage(1); setEvidencePage(1); }, [search]);

  const fetchData = async () => {
    setLoading(true);
    const [testRes, orderRes, attemptRes, evidenceRes, profilesRes] = await Promise.all([
      supabase
        .from("competency_tests")
        .select("id, title, skill_name, assessment_type, test_tier, total_questions, passing_score, time_limit_minutes, price_cents, currency, is_active, description, oveercode, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("assessment_orders")
        .select("id, order_number, user_id, test_id, status, amount, currency, payment_proof_url, admin_notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("assessment_attempts")
        .select("id, user_id, test_id, status, score, earned_points, total_points, started_at, completed_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("assessment_evidence")
        .select("id, user_id, test_id, file_name, file_url, description, status, reviewer_notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("user_id, full_name"),
    ]);

    const testsData = (testRes.data || []) as CompetencyTest[];
    const testMap = new Map(testsData.map(t => [t.id, t.title]));
    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.full_name]));

    // Get user emails for orders
    let emailMap = new Map<string, string>();
    const orderUserIds = [...new Set((orderRes.data || []).map((o: any) => o.user_id))];
    if (orderUserIds.length > 0) {
      const { data: authData } = await supabase.rpc("admin_get_users_auth_info");
      if (authData) {
        emailMap = new Map(authData.map((u: any) => [u.id, u.email]));
      }
    }

    setTests(testsData);
    setOrders((orderRes.data || []).map((o: any) => ({
      ...o,
      test_title: testMap.get(o.test_id) || "—",
      user_name: profileMap.get(o.user_id) || "—",
      user_email: emailMap.get(o.user_id) || "",
    })));
    setAttempts((attemptRes.data || []).map((a: any) => ({
      ...a,
      test_title: testMap.get(a.test_id) || "—",
      user_name: profileMap.get(a.user_id) || "—",
    })));
    setEvidence((evidenceRes.data || []).map((e: any) => ({
      ...e,
      test_title: testMap.get(e.test_id) || "—",
      user_name: profileMap.get(e.user_id) || "—",
    })));
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("competency_tests").update({ is_active: !current }).eq("id", id);
    if (error) toast.error("Gagal update status");
    else { toast.success("Status diperbarui"); fetchData(); }
  };

  const updateOrderStatus = async (id: string, status: "paid" | "rejected") => {
    const updateData: any = { status };
    if (status === "paid") updateData.confirmed_at = new Date().toISOString();
    const { error } = await supabase.from("assessment_orders").update(updateData).eq("id", id);
    if (error) toast.error("Gagal update order");
    else { toast.success(`Order ${status === "paid" ? "disetujui" : "ditolak"}`); fetchData(); }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Yakin ingin menghapus order ini?")) return;
    const { error } = await supabase.from("assessment_orders").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus order");
    else { toast.success("Order dihapus"); fetchData(); }
  };

  const updateEvidenceStatus = async (id: string, status: "approved" | "rejected", notes?: string) => {
    const { error } = await supabase.from("assessment_evidence").update({
      status,
      reviewer_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error("Gagal update evidence");
    else { toast.success(`Evidence ${status === "approved" ? "disetujui" : "ditolak"}`); fetchData(); }
  };

  // Filters
  const filteredTests = tests.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.skill_name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter(
    (o) => o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.test_title || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.user_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredAttempts = attempts.filter(
    (a) => (a.test_title || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.user_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredEvidence = evidence.filter(
    (e) => e.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.test_title || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.user_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const testTotalPages = Math.max(1, Math.ceil(filteredTests.length / PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const attemptTotalPages = Math.max(1, Math.ceil(filteredAttempts.length / PAGE_SIZE));
  const evidenceTotalPages = Math.max(1, Math.ceil(filteredEvidence.length / PAGE_SIZE));

  const pagedTests = filteredTests.slice((testPage - 1) * PAGE_SIZE, testPage * PAGE_SIZE);
  const pagedOrders = filteredOrders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);
  const pagedAttempts = filteredAttempts.slice((attemptPage - 1) * PAGE_SIZE, attemptPage * PAGE_SIZE);
  const pagedEvidence = filteredEvidence.slice((evidencePage - 1) * PAGE_SIZE, evidencePage * PAGE_SIZE);

  const statusBadge = (s: string) => {
    if (["paid", "confirmed", "approved", "completed", "passed"].includes(s)) return "bg-primary/10 text-primary";
    if (["pending", "pending_payment", "in_progress"].includes(s)) return "bg-amber-500/10 text-amber-600";
    if (["rejected", "cancelled", "failed"].includes(s)) return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const formatPrice = (cents: number, currency: string) => {
    if (cents === 0) return "Gratis";
    if (currency === "USD") return `$${(cents / 100).toFixed(2)}`;
    return `Rp ${cents.toLocaleString("id-ID")}`;
  };

  const PaginationBar = ({ page, totalPages, total, onPrev, onNext }: { page: number; totalPages: number; total: number; onPrev: () => void; onNext: () => void }) => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} dari {total}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
        <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Assessment</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button size="sm" variant={tab === "tests" ? "default" : "outline"} onClick={() => setTab("tests")}>
          Competency Tests ({tests.length})
        </Button>
        <Button size="sm" variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")}>
          Orders ({orders.length})
        </Button>
        <Button size="sm" variant={tab === "attempts" ? "default" : "outline"} onClick={() => setTab("attempts")}>
          Attempts ({attempts.length})
        </Button>
        <Button size="sm" variant={tab === "evidence" ? "default" : "outline"} onClick={() => setTab("evidence")}>
          Evidence ({evidence.length})
        </Button>
      </div>

      {/* COMPETENCY TESTS TAB */}
      {tab === "tests" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Skill</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Soal</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Passing</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Waktu</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Harga</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={9} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedTests.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedTests.map((t) => (
                    <tr key={t.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/assessment/${t.oveercode}`)}>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{t.title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.skill_name}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{t.assessment_type}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{t.test_tier}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.total_questions}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.passing_score}%</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.time_limit_minutes ? `${t.time_limit_minutes} min` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatPrice(t.price_cents, t.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {t.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredTests.length > PAGE_SIZE && (
            <PaginationBar page={testPage} totalPages={testTotalPages} total={filteredTests.length} onPrev={() => setTestPage(p => p - 1)} onNext={() => setTestPage(p => p + 1)} />
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === "orders" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Test</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jumlah</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bukti Bayar</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedOrders.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{o.order_number}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="text-foreground">{o.user_name}</div>
                        {o.user_email && <div className="text-muted-foreground text-[10px]">{o.user_email}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{o.test_title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{o.currency} {o.amount.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-xs">
                        {o.payment_proof_url ? (
                          <a href={o.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lihat</a>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(o.status === "pending" || o.status === "pending_payment") && (
                            <>
                              <Button size="sm" variant="ghost" className="text-primary" onClick={() => updateOrderStatus(o.id, "paid")}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateOrderStatus(o.id, "rejected")}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteOrder(o.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredOrders.length > PAGE_SIZE && (
            <PaginationBar page={orderPage} totalPages={orderTotalPages} total={filteredOrders.length} onPrev={() => setOrderPage(p => p - 1)} onNext={() => setOrderPage(p => p + 1)} />
          )}
        </div>
      )}

      {/* ATTEMPTS TAB */}
      {tab === "attempts" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Test</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Skor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Poin</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mulai</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Selesai</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedAttempts.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedAttempts.map((a) => (
                    <tr key={a.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-foreground text-xs">{a.user_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{a.test_title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(a.status)}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.score != null ? `${a.score}%` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.earned_points != null ? `${a.earned_points}/${a.total_points}` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.started_at).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.completed_at ? new Date(a.completed_at).toLocaleString("id-ID") : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredAttempts.length > PAGE_SIZE && (
            <PaginationBar page={attemptPage} totalPages={attemptTotalPages} total={filteredAttempts.length} onPrev={() => setAttemptPage(p => p - 1)} onNext={() => setAttemptPage(p => p + 1)} />
          )}
        </div>
      )}

      {/* EVIDENCE TAB */}
      {tab === "evidence" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Test</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">File</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deskripsi</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedEvidence.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedEvidence.map((e) => (
                    <tr key={e.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-foreground text-xs">{e.user_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{e.test_title}</td>
                      <td className="px-4 py-3 text-xs">
                        <a href={e.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {e.file_name}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{e.description || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(e.status)}`}>{e.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(e.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-3 text-right">
                        {e.status === "pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="text-primary" onClick={() => updateEvidenceStatus(e.id, "approved")}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateEvidenceStatus(e.id, "rejected")}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredEvidence.length > PAGE_SIZE && (
            <PaginationBar page={evidencePage} totalPages={evidenceTotalPages} total={filteredEvidence.length} onPrev={() => setEvidencePage(p => p - 1)} onNext={() => setEvidencePage(p => p + 1)} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAssessment;
