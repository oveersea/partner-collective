import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, GraduationCap, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  status: string;
  category: string | null;
  job_type: string | null;
  location: string | null;
  created_at: string;
  business_profiles: { name: string } | null;
}

interface Program {
  id: string;
  title: string;
  status: string;
  category: string | null;
  oveercode: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const AdminContent = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"opportunities" | "programs">("opportunities");
  const [search, setSearch] = useState("");
  const [oppPage, setOppPage] = useState(1);
  const [progPage, setProgPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch all opportunities with pagination
    let allOpps: Opportunity[] = [];
    let oppFrom = 0;
    const batchSize = 1000;
    let oppHasMore = true;
    while (oppHasMore) {
      const { data } = await supabase
        .from("opportunities")
        .select("id, title, status, category, job_type, location, created_at, business_profiles!opportunities_business_id_fkey(name)")
        .order("created_at", { ascending: false })
        .range(oppFrom, oppFrom + batchSize - 1);
      if (data) {
        allOpps = [...allOpps, ...(data as unknown as Opportunity[])];
        oppHasMore = data.length === batchSize;
        oppFrom += batchSize;
      } else { oppHasMore = false; }
    }
    setOpportunities(allOpps);

    // Programs (likely under 1000, but safe)
    const { data: progData } = await supabase
      .from("programs")
      .select("id, title, status, category, oveercode, created_at")
      .order("created_at", { ascending: false });
    if (progData) setPrograms(progData as unknown as Program[]);

    setLoading(false);
  };

  const toggleOppStatus = async (id: string, current: string) => {
    const next = current === "open" ? "closed" : "open";
    const { error } = await supabase.from("opportunities").update({ status: next }).eq("id", id);
    if (error) toast.error("Gagal update status");
    else { toast.success("Status diperbarui"); fetchData(); }
  };

  const toggleProgStatus = async (id: string, current: string) => {
    const next = current === "approved" ? "draft" : "approved";
    const { error } = await supabase.from("programs").update({ status: next }).eq("id", id);
    if (error) toast.error("Gagal update status");
    else { toast.success("Status diperbarui"); fetchData(); }
  };

  const filteredOpps = opportunities.filter(
    (o) => o.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProgs = programs.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s: string) => {
    if (s === "open" || s === "approved" || s === "active") return "bg-primary/10 text-primary";
    if (s === "draft") return "bg-muted text-muted-foreground";
    if (s === "closed") return "bg-destructive/10 text-destructive";
    return "bg-amber-500/10 text-amber-600";
  };

  // Reset page on search change
  useEffect(() => {
    setOppPage(1);
    setProgPage(1);
  }, [search]);

  const oppTotalPages = Math.max(1, Math.ceil(filteredOpps.length / PAGE_SIZE));
  const progTotalPages = Math.max(1, Math.ceil(filteredProgs.length / PAGE_SIZE));
  const pagedOpps = filteredOpps.slice((oppPage - 1) * PAGE_SIZE, oppPage * PAGE_SIZE);
  const pagedProgs = filteredProgs.slice((progPage - 1) * PAGE_SIZE, progPage * PAGE_SIZE);

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
        <h2 className="text-xl font-semibold text-foreground">Peluang & Job</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={tab === "opportunities" ? "default" : "outline"} onClick={() => setTab("opportunities")}>
          <Briefcase className="w-4 h-4 mr-1" /> Opportunities ({opportunities.length})
        </Button>
        <Button size="sm" variant={tab === "programs" ? "default" : "outline"} onClick={() => setTab("programs")}>
          <GraduationCap className="w-4 h-4 mr-1" /> Programs ({programs.length})
        </Button>
      </div>

      {tab === "opportunities" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perusahaan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
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
                ) : pagedOpps.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedOpps.map((o) => (
                    <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{o.title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{o.business_profiles?.name || "—"}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{o.category || "—"}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{o.job_type || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleOppStatus(o.id, o.status)}>
                          {o.status === "open" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredOpps.length > PAGE_SIZE && (
            <PaginationBar page={oppPage} totalPages={oppTotalPages} total={filteredOpps.length} onPrev={() => setOppPage(p => p - 1)} onNext={() => setOppPage(p => p + 1)} />
          )}
        </div>
      )}

      {tab === "programs" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProgs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  pagedProgs.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{p.title}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{p.category || "—"}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.oveercode || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleProgStatus(p.id, p.status)}>
                          {p.status === "approved" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredProgs.length > PAGE_SIZE && (
            <PaginationBar page={progPage} totalPages={progTotalPages} total={filteredProgs.length} onPrev={() => setProgPage(p => p - 1)} onNext={() => setProgPage(p => p + 1)} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminContent;
