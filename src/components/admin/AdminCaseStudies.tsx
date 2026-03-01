import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  X,
  GripVertical,
  ArrowLeft,
} from "lucide-react";

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  company_name: string;
  industry: string | null;
  image_url: string | null;
  client_logo_url: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  testimonial_role: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  sort_order: number | null;
  created_at: string;
  cta_label: string | null;
  cta_url: string | null;
}

interface Section {
  id?: string;
  section_type: string;
  title: string;
  body: string;
  image_url: string;
  sort_order: number;
}

interface ServiceOption {
  id: string;
  name: string;
}

interface LinkedService {
  id: string;
  service_id: string;
}

const emptyForm: Partial<CaseStudy> = {
  title: "",
  slug: "",
  description: "",
  content: "",
  company_name: "",
  industry: "",
  image_url: "",
  client_logo_url: "",
  challenge: "",
  solution: "",
  results: "",
  testimonial_quote: "",
  testimonial_author: "",
  testimonial_role: "",
  is_active: true,
  is_featured: false,
  sort_order: 0,
  cta_label: "",
  cta_url: "",
};

const PAGE_SIZE = 15;

const AdminCaseStudies = () => {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Edit page state
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Sections
  const [sections, setSections] = useState<Section[]>([]);

  // Services
  const [allServices, setAllServices] = useState<ServiceOption[]>([]);
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>([]);
  const [existingLinkedServices, setExistingLinkedServices] = useState<LinkedService[]>([]);

  // Active tab in edit page
  const [activeTab, setActiveTab] = useState<"general" | "content" | "sections" | "services">("general");

  useEffect(() => {
    fetchItems();
    fetchServices();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("case_studies")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data as unknown as CaseStudy[]);
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("id, name").order("name");
    if (data) setAllServices(data as ServiceOption[]);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setSections([]);
    setLinkedServiceIds([]);
    setExistingLinkedServices([]);
    setActiveTab("general");
    setEditMode(true);
  };

  const openEdit = async (cs: CaseStudy) => {
    setEditId(cs.id);
    setForm({ ...cs });
    setActiveTab("general");

    const [secRes, svcRes] = await Promise.all([
      supabase
        .from("case_study_sections")
        .select("id, section_type, title, body, image_url, sort_order")
        .eq("case_study_id", cs.id)
        .order("sort_order"),
      supabase
        .from("case_study_services")
        .select("id, service_id")
        .eq("case_study_id", cs.id),
    ]);

    setSections(
      (secRes.data || []).map((s: any) => ({
        id: s.id,
        section_type: s.section_type || "image",
        title: s.title || "",
        body: s.body || "",
        image_url: s.image_url || "",
        sort_order: s.sort_order,
      }))
    );

    const linked = (svcRes.data || []) as LinkedService[];
    setExistingLinkedServices(linked);
    setLinkedServiceIds(linked.map((l) => l.service_id));

    setEditMode(true);
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSave = async () => {
    if (!form.title || !form.company_name) {
      toast.error("Judul dan nama perusahaan wajib diisi");
      return;
    }

    setSaving(true);

    const slug = form.slug || generateSlug(form.title!);
    const payload = {
      title: form.title,
      slug,
      description: form.description || null,
      content: form.content || null,
      company_name: form.company_name,
      industry: form.industry || null,
      image_url: form.image_url || null,
      client_logo_url: form.client_logo_url || null,
      challenge: form.challenge || null,
      solution: form.solution || null,
      results: form.results || null,
      testimonial_quote: form.testimonial_quote || null,
      testimonial_author: form.testimonial_author || null,
      testimonial_role: form.testimonial_role || null,
      is_active: form.is_active ?? true,
      is_featured: form.is_featured ?? false,
      sort_order: form.sort_order ?? 0,
      cta_label: form.cta_label || null,
      cta_url: form.cta_url || null,
    };

    let csId = editId;

    if (editId) {
      const { error } = await supabase.from("case_studies").update(payload).eq("id", editId);
      if (error) {
        toast.error("Gagal update: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("case_studies").insert(payload).select("id").single();
      if (error || !data) {
        toast.error("Gagal membuat: " + (error?.message || "Unknown error"));
        setSaving(false);
        return;
      }
      csId = data.id;
    }

    if (csId) {
      await supabase.from("case_study_sections").delete().eq("case_study_id", csId);
      if (sections.length > 0) {
        const secPayload = sections.map((s, i) => ({
          case_study_id: csId!,
          section_type: s.section_type || "image",
          title: s.title || null,
          body: s.body || null,
          image_url: s.image_url || null,
          sort_order: i,
        }));
        await supabase.from("case_study_sections").insert(secPayload);
      }

      await supabase.from("case_study_services").delete().eq("case_study_id", csId);
      if (linkedServiceIds.length > 0) {
        const svcPayload = linkedServiceIds.map((sid) => ({
          case_study_id: csId!,
          service_id: sid,
        }));
        await supabase.from("case_study_services").insert(svcPayload);
      }
    }

    toast.success(editId ? "Case study diperbarui" : "Case study dibuat");
    setSaving(false);
    setEditMode(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus case study ini?")) return;
    const { error } = await supabase.from("case_studies").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus");
    else {
      toast.success("Case study dihapus");
      fetchItems();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("case_studies").update({ is_active: !current }).eq("id", id);
    fetchItems();
  };

  const addSection = () => {
    setSections([...sections, { section_type: "image", title: "", body: "", image_url: "", sort_order: sections.length }]);
  };

  const updateSection = (index: number, field: keyof Section, value: string) => {
    const updated = [...sections];
    (updated[index] as any)[field] = value;
    setSections(updated);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const toggleService = (serviceId: string) => {
    setLinkedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.company_name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusBadge = (active: boolean | null) =>
    active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  // ── Edit / Create Page ──
  if (editMode) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setEditMode(false)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">
              {editId ? "Edit Case Study" : "Tambah Case Study"}
            </h2>
            {editId && <p className="text-xs text-muted-foreground mt-0.5">{form.title}</p>}
          </div>
          <Button variant="outline" onClick={() => setEditMode(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : editId ? "Perbarui" : "Simpan"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
          {(["general", "content", "sections", "services"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 text-xs font-medium py-2.5 px-3 rounded-md transition-colors capitalize ${
                activeTab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "general" ? "Umum" : t === "content" ? "Konten" : t === "sections" ? "Section Media" : "Layanan"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-card border border-border rounded-xl p-6">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Judul *</Label>
                  <Input value={form.title || ""} onChange={(e) => { updateField("title", e.target.value); if (!editId) updateField("slug", generateSlug(e.target.value)); }} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={form.slug || ""} onChange={(e) => updateField("slug", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Perusahaan *</Label>
                  <Input value={form.company_name || ""} onChange={(e) => updateField("company_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Industri</Label>
                  <Input value={form.industry || ""} onChange={(e) => updateField("industry", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Gambar URL</Label>
                  <Input value={form.image_url || ""} onChange={(e) => updateField("image_url", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Logo Klien URL</Label>
                  <Input value={form.client_logo_url || ""} onChange={(e) => updateField("client_logo_url", e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi Singkat</Label>
                <Textarea rows={2} value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>CTA Label</Label>
                  <Input value={form.cta_label || ""} onChange={(e) => updateField("cta_label", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>CTA URL</Label>
                  <Input value={form.cta_url || ""} onChange={(e) => updateField("cta_url", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order ?? 0} onChange={(e) => updateField("sort_order", parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={!!form.is_active} onCheckedChange={(v) => updateField("is_active", v)} />
                  <Label>Aktif</Label>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={!!form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} />
                  <Label>Featured</Label>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Konten Lengkap</Label>
                <Textarea rows={5} value={form.content || ""} onChange={(e) => updateField("content", e.target.value)} placeholder="Konten lengkap case study..." />
              </div>
              <div className="space-y-1.5">
                <Label>Tantangan</Label>
                <Textarea rows={3} value={form.challenge || ""} onChange={(e) => updateField("challenge", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Solusi</Label>
                <Textarea rows={3} value={form.solution || ""} onChange={(e) => updateField("solution", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Hasil</Label>
                <Textarea rows={3} value={form.results || ""} onChange={(e) => updateField("results", e.target.value)} />
              </div>
              <hr className="border-border" />
              <div className="space-y-1.5">
                <Label>Testimonial Quote</Label>
                <Textarea rows={2} value={form.testimonial_quote || ""} onChange={(e) => updateField("testimonial_quote", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Testimonial</Label>
                  <Input value={form.testimonial_author || ""} onChange={(e) => updateField("testimonial_author", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Jabatan Testimonial</Label>
                  <Input value={form.testimonial_role || ""} onChange={(e) => updateField("testimonial_role", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Sections Tab */}
          {activeTab === "sections" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Tambahkan blok gambar/teks yang ditampilkan secara vertikal di halaman detail.</p>
                <Button size="sm" variant="outline" onClick={addSection}>
                  <Plus className="w-4 h-4 mr-1" /> Tambah Section
                </Button>
              </div>
              {sections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Belum ada section</div>
              )}
              {sections.map((sec, i) => (
                <div key={i} className="bg-muted/50 rounded-xl p-4 space-y-3 relative border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Section {i + 1}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeSection(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipe</Label>
                      <select
                        value={sec.section_type}
                        onChange={(e) => updateSection(i, "section_type", e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="image">Gambar</option>
                        <option value="text">Teks</option>
                        <option value="image_text">Gambar + Teks</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Judul</Label>
                      <Input value={sec.title} onChange={(e) => updateSection(i, "title", e.target.value)} />
                    </div>
                  </div>
                  {(sec.section_type === "image" || sec.section_type === "image_text") && (
                    <div className="space-y-1">
                      <Label className="text-xs">Image URL</Label>
                      <Input value={sec.image_url} onChange={(e) => updateSection(i, "image_url", e.target.value)} placeholder="https://..." />
                    </div>
                  )}
                  {(sec.section_type === "text" || sec.section_type === "image_text") && (
                    <div className="space-y-1">
                      <Label className="text-xs">Body</Label>
                      <Textarea rows={3} value={sec.body} onChange={(e) => updateSection(i, "body", e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Pilih layanan yang digunakan dalam case study ini.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allServices.map((svc) => {
                  const isLinked = linkedServiceIds.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-colors ${
                        isLinked
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Layers className={`w-4 h-4 flex-shrink-0 ${isLinked ? "text-primary" : ""}`} />
                      <span className="truncate">{svc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom save bar */}
        <div className="flex justify-end gap-2 pt-6">
          <Button variant="outline" onClick={() => setEditMode(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : editId ? "Perbarui" : "Simpan"}
          </Button>
        </div>
      </div>
    );
  }

  // ── List Page ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Manajemen Case Studies</h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Tambah
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perusahaan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Industri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Featured</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                paged.map((cs) => (
                  <tr key={cs.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[220px] truncate">{cs.title}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{cs.company_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{cs.industry || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(cs.is_active)}`}>
                        {cs.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {cs.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(cs.created_at).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(cs.id, !!cs.is_active)}>
                        {cs.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(cs)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cs.id)}>
                        <Trash2 className="w-4 h-4" />
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
              {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
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
    </div>
  );
};

export default AdminCaseStudies;
