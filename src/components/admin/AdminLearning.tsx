import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

interface LearningProgram {
  id: string;
  title: string;
  category: string | null;
  skill_name: string | null;
  difficulty_level: string | null;
  program_type: string | null;
  duration_hours: number | null;
  price: number | null;
  is_active: boolean | null;
  oveercode: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const AdminLearning = () => {
  const [programs, setPrograms] = useState<LearningProgram[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const fetchData = async () => {
    const [progRes, enrollRes] = await Promise.all([
      supabase
        .from("learning_programs")
        .select("id, title, category, skill_name, difficulty_level, program_type, duration_hours, price, is_active, oveercode, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("learning_enrollments")
        .select("program_id"),
    ]);

    if (progRes.data) setPrograms(progRes.data as unknown as LearningProgram[]);
    
    if (enrollRes.data) {
      const counts: Record<string, number> = {};
      (enrollRes.data as any[]).forEach((e) => {
        counts[e.program_id] = (counts[e.program_id] || 0) + 1;
      });
      setEnrollCounts(counts);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase.from("learning_programs").update({ is_active: !current } as any).eq("id", id);
    if (error) toast.error("Gagal update status");
    else { toast.success("Status diperbarui"); fetchData(); }
  };

  const filtered = programs.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.skill_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusBadge = (active: boolean | null) =>
    active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Learning Program</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari program..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Skill</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durasi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Harga</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enrolled</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={12} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                paged.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{p.title}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{p.category || "—"}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.skill_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{p.difficulty_level || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.program_type || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.duration_hours ? `${p.duration_hours}h` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.price != null ? `Rp ${p.price.toLocaleString("id-ID")}` : "Gratis"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{enrollCounts[p.id] || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(p.is_active)}`}>
                        {p.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.oveercode || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(p.id, p.is_active)}>
                        {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLearning;
