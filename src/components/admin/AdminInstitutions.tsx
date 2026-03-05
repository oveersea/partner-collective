import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
import { CitySelect } from "@/components/ui/city-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Building2, Globe, MapPin } from "lucide-react";

interface Institution {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  institution_type: string | null;
  country: string | null;
  city: string | null;
  founded_year: number | null;
  created_at: string;
}

const TYPE_OPTIONS = ["education", "training", "certification", "government", "corporate", "other"];

const emptyForm = {
  name: "",
  description: "",
  logo_url: "",
  website: "",
  institution_type: "education",
  country: "",
  city: "",
  founded_year: "",
};

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("institutions")
      .select("*")
      .order("name");
    if (error) {
      toast.error("Gagal memuat data institusi");
    } else {
      setInstitutions((data || []) as Institution[]);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (inst: Institution) => {
    setEditingId(inst.id);
    setForm({
      name: inst.name,
      description: inst.description || "",
      logo_url: inst.logo_url || "",
      website: inst.website || "",
      institution_type: inst.institution_type || "education",
      country: inst.country || "",
      city: inst.city || "",
      founded_year: inst.founded_year?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama institusi wajib diisi");
      return;
    }
    setSaving(true);

    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
      website: form.website.trim() || null,
      institution_type: form.institution_type || null,
      country: form.country.trim() || null,
      city: form.city.trim() || null,
      founded_year: form.founded_year ? Number(form.founded_year) : null,
    };

    if (editingId) {
      const { error } = await supabase.from("institutions").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Gagal memperbarui: " + error.message);
      } else {
        toast.success("Institusi berhasil diperbarui");
        setDialogOpen(false);
        fetchInstitutions();
      }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      payload.created_by = userData.user?.id;
      const { error } = await supabase.from("institutions").insert(payload);
      if (error) {
        toast.error("Gagal menambahkan: " + error.message);
      } else {
        toast.success("Institusi berhasil ditambahkan");
        setDialogOpen(false);
        fetchInstitutions();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("institutions").delete().eq("id", deleteId);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
    } else {
      toast.success("Institusi berhasil dihapus");
      fetchInstitutions();
    }
    setDeleteId(null);
  };

  const filtered = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(search.toLowerCase()) ||
    (inst.city || "").toLowerCase().includes(search.toLowerCase()) ||
    (inst.institution_type || "").toLowerCase().includes(search.toLowerCase())
  );

  const typeColor = (t: string | null) => {
    switch (t) {
      case "education": return "bg-blue-100 text-blue-700";
      case "training": return "bg-green-100 text-green-700";
      case "certification": return "bg-purple-100 text-purple-700";
      case "government": return "bg-yellow-100 text-yellow-700";
      case "corporate": return "bg-orange-100 text-orange-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Manajemen Institusi</h2>
          <p className="text-sm text-muted-foreground">{institutions.length} institusi terdaftar</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Institusi
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari institusi..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="border border-border rounded-[5px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institusi</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Tahun Berdiri</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {search ? "Tidak ada hasil pencarian" : "Belum ada data institusi"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {inst.logo_url ? (
                          <img src={inst.logo_url} alt="" className="w-8 h-8 rounded-[5px] object-cover border border-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-[5px] bg-muted flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{inst.name}</p>
                          {inst.website && (
                            <a href={inst.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] capitalize ${typeColor(inst.institution_type)}`}>
                        {inst.institution_type || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inst.city || inst.country ? (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[inst.city, inst.country].filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inst.founded_year || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inst)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(inst.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Institusi" : "Tambah Institusi"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nama Institusi *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama institusi..." />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipe</Label>
                <Select value={form.institution_type} onValueChange={(v) => setForm({ ...form, institution_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tahun Berdiri</Label>
                <Select value={form.founded_year} onValueChange={(v) => setForm({ ...form, founded_year: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih tahun" /></SelectTrigger>
                  <SelectContent className="max-h-[240px]">
                    {Array.from({ length: 80 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kota</Label>
                <CitySelect value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              </div>
              <div>
                <Label>Negara</Label>
                <CountrySelect value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              </div>
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Institusi?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan. Institusi akan dihapus secara permanen.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInstitutions;
