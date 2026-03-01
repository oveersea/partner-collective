import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Pencil, ChevronLeft, ChevronRight, Users } from "lucide-react";

interface Program {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  status: string;
  level: string | null;
  price_cents: number | null;
  currency: string | null;
  duration: string | null;
  student_count: number | null;
  oveercode: string | null;
  instructor_name: string | null;
  organizer_type: string | null;
  delivery_mode: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ["draft", "pending", "approved", "rejected", "archived"];
const LEVEL_OPTIONS = ["beginner", "intermediate", "advanced"];
const CATEGORY_OPTIONS = ["online", "Certification", "Workshop", "Bootcamp"];

const AdminLearning = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Program> | null>(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("programs")
      .select("id, title, slug, description, category, status, level, price_cents, currency, duration, student_count, oveercode, instructor_name, organizer_type, delivery_mode, created_at")
      .order("created_at", { ascending: false });

    if (data) setPrograms(data as unknown as Program[]);
    if (error) toast.error("Gagal memuat data program");
    setLoading(false);
  };

  const openEdit = (p: Program) => {
    setEditData({ ...p });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editData?.id) return;
    setSaving(true);
    const { id, created_at, oveercode, slug, ...updateFields } = editData as any;
    const { error } = await supabase.from("programs").update(updateFields).eq("id", editData.id);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Program berhasil diperbarui");
      setEditOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const filtered = programs.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.oveercode || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.instructor_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "bg-primary/10 text-primary";
      case "draft": return "bg-muted text-muted-foreground";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "rejected": return "bg-destructive/10 text-destructive";
      case "archived": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Gratis";
    return `Rp ${cents.toLocaleString("id-ID")}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Program Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari program..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-[5px] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Durasi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Harga</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Peserta</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={11} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                paged.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{p.title}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{p.category}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{p.level || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.delivery_mode || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.duration || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatPrice(p.price_cents)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{p.student_count || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.oveercode || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
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
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 mt-2">
              <div>
                <Label>Judul</Label>
                <Input value={editData.title || ""} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea rows={3} value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kategori</Label>
                  <Select value={editData.category || ""} onValueChange={(v) => setEditData({ ...editData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editData.status || ""} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Level</Label>
                  <Select value={editData.level || "beginner"} onValueChange={(v) => setEditData({ ...editData, level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mode Pengiriman</Label>
                  <Input value={editData.delivery_mode || ""} onChange={(e) => setEditData({ ...editData, delivery_mode: e.target.value })} placeholder="Online / Offline" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Durasi</Label>
                  <Input value={editData.duration || ""} onChange={(e) => setEditData({ ...editData, duration: e.target.value })} placeholder="e.g. 14 Hari" />
                </div>
                <div>
                  <Label>Harga (Rp)</Label>
                  <Input type="number" value={editData.price_cents ?? 0} onChange={(e) => setEditData({ ...editData, price_cents: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Instruktur</Label>
                  <Input value={editData.instructor_name || ""} onChange={(e) => setEditData({ ...editData, instructor_name: e.target.value })} />
                </div>
                <div>
                  <Label>Jumlah Peserta</Label>
                  <Input type="number" value={editData.student_count ?? 0} onChange={(e) => setEditData({ ...editData, student_count: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Tipe Organizer</Label>
                <Input value={editData.organizer_type || ""} onChange={(e) => setEditData({ ...editData, organizer_type: e.target.value })} placeholder="personal / institutional" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLearning;
