import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

interface CompetencyTest {
  id: string;
  title: string;
  skill_name: string | null;
  assessment_type: string | null;
  test_tier: string | null;
  total_questions: number | null;
  passing_score: number | null;
  time_limit_minutes: number | null;
  price: number | null;
  is_active: boolean | null;
  created_at: string;
}

interface AssessmentOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  amount: number;
  currency: string;
  payment_proof_url: string | null;
  admin_notes: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const AdminAssessment = () => {
  const [tests, setTests] = useState<CompetencyTest[]>([]);
  const [orders, setOrders] = useState<AssessmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tests" | "orders">("tests");
  const [search, setSearch] = useState("");
  const [testPage, setTestPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setTestPage(1); setOrderPage(1); }, [search]);

  const fetchData = async () => {
    const [testRes, orderRes] = await Promise.all([
      supabase
        .from("competency_tests")
        .select("id, title, skill_name, assessment_type, test_tier, total_questions, passing_score, time_limit_minutes, price, is_active, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("assessment_orders")
        .select("id, order_number, user_id, status, amount, currency, payment_proof_url, admin_notes, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (testRes.data) setTests(testRes.data as unknown as CompetencyTest[]);
    if (orderRes.data) setOrders(orderRes.data as unknown as AssessmentOrder[]);
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase.from("competency_tests").update({ is_active: !current } as any).eq("id", id);
    if (error) toast.error("Gagal update status");
    else { toast.success("Status diperbarui"); fetchData(); }
  };

  const updateOrderStatus = async (id: string, status: "paid" | "rejected") => {
    const updateData: any = { status };
    if (status === "paid") {
      updateData.confirmed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("assessment_orders").update(updateData).eq("id", id);
    if (error) toast.error("Gagal update order");
    else { toast.success(`Order ${status === "paid" ? "disetujui" : "ditolak"}`); fetchData(); }
  };

  const filteredTests = tests.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.skill_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter(
    (o) => o.order_number.toLowerCase().includes(search.toLowerCase())
  );

  const testTotalPages = Math.max(1, Math.ceil(filteredTests.length / PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedTests = filteredTests.slice((testPage - 1) * PAGE_SIZE, testPage * PAGE_SIZE);
  const pagedOrders = filteredOrders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);

  const statusBadge = (s: string) => {
    if (s === "paid" || s === "confirmed") return "bg-primary/10 text-primary";
    if (s === "pending" || s === "pending_payment") return "bg-amber-500/10 text-amber-600";
    if (s === "rejected" || s === "cancelled") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
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

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={tab === "tests" ? "default" : "outline"} onClick={() => setTab("tests")}>
          Competency Tests ({tests.length})
        </Button>
        <Button size="sm" variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")}>
          Assessment Orders ({orders.length})
        </Button>
      </div>

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
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={10} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedTests.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedTests.map((t) => (
                    <tr key={t.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{t.title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.skill_name || "—"}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{t.assessment_type || "—"}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{t.test_tier || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.total_questions ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.passing_score != null ? `${t.passing_score}%` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.time_limit_minutes ? `${t.time_limit_minutes} min` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{t.price != null ? `Rp ${t.price.toLocaleString("id-ID")}` : "Gratis"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {t.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(t.id, t.is_active)}>
                          {t.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
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

      {tab === "orders" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jumlah</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bukti Bayar</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{o.order_number}</td>
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
                        {(o.status === "pending" || o.status === "pending_payment") && (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="text-primary" onClick={() => updateOrderStatus(o.id, "paid")}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateOrderStatus(o.id, "rejected")}>
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
          {!loading && filteredOrders.length > PAGE_SIZE && (
            <PaginationBar page={orderPage} totalPages={orderTotalPages} total={filteredOrders.length} onPrev={() => setOrderPage(p => p - 1)} onNext={() => setOrderPage(p => p + 1)} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAssessment;
