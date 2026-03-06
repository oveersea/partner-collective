import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Generic inline editor hook
function useInlineEditor<T extends Record<string, any>>(
  tableName: string,
  userId: string,
  items: T[],
  setItems: (v: T[]) => void,
  defaults: Partial<T>,
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<T>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const startAdd = () => { setEditingId("new"); setForm({ ...defaults }); };
  const startEdit = (item: T) => { setEditingId(item.id); setForm({ ...item }); };
  const cancel = () => { setEditingId(null); setForm({}); };

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async (requiredFields: string[]) => {
    for (const f of requiredFields) {
      if (!form[f] || (typeof form[f] === "string" && !(form[f] as string).trim())) {
        toast.error(`Field "${f}" wajib diisi`);
        return;
      }
    }
    setSaving(true);
    const payload = { ...form, user_id: userId, status: "approved" } as any;
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    let error: any;
    if (editingId === "new") {
      const res = await (supabase.from(tableName as any) as any).insert(payload).select().single();
      error = res.error;
      if (!error && res.data) setItems([res.data, ...items]);
    } else {
      const res = await (supabase.from(tableName as any) as any).update(payload).eq("id", editingId).select().single();
      error = res.error;
      if (!error && res.data) setItems(items.map((i: any) => i.id === editingId ? res.data : i));
    }

    if (error) toast.error("Gagal menyimpan: " + error.message);
    else { toast.success("Berhasil disimpan"); cancel(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    setDeleting(id);
    const { error } = await (supabase.from(tableName as any) as any).delete().eq("id", id);
    if (error) toast.error("Gagal menghapus");
    else { setItems(items.filter(i => i.id !== id)); toast.success("Berhasil dihapus"); }
    setDeleting(null);
  };

  return { editingId, form, saving, deleting, startAdd, startEdit, cancel, set, save, remove };
}

// Action buttons for each item
const ItemActions = ({ onEdit, onDelete, deleting }: { onEdit: () => void; onDelete: () => void; deleting: boolean }) => (
  <div className="flex items-center gap-1 shrink-0">
    <button onClick={onEdit} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
    <button onClick={onDelete} disabled={deleting} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive">
      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  </div>
);

const FormActions = ({ saving, onCancel }: { saving: boolean; onCancel: () => void }) => (
  <div className="flex gap-2 pt-2">
    <Button size="sm" type="button" onClick={undefined as any} disabled={saving}>
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
      <Check className="w-3.5 h-3.5 mr-1" /> Simpan
    </Button>
    <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-3.5 h-3.5 mr-1" /> Batal</Button>
  </div>
);

// ─── EDUCATION ──────────────────────────
export const EducationEditor = ({ userId, items, setItems }: { userId: string; items: any[]; setItems: (v: any[]) => void }) => {
  const { editingId, form, saving, deleting, startAdd, startEdit, cancel, set, save, remove } = useInlineEditor(
    "user_education", userId, items, setItems,
    { institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "" }
  );

  const handleSave = () => save(["institution"]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!editingId && <Button size="sm" variant="outline" onClick={startAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>}
      </div>
      {editingId && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Institusi *</Label><Input className="mt-1" value={form.institution || ""} onChange={e => set("institution", e.target.value)} /></div>
            <div><Label className="text-xs">Gelar</Label><Input className="mt-1" value={form.degree || ""} onChange={e => set("degree", e.target.value)} /></div>
            <div><Label className="text-xs">Bidang Studi</Label><Input className="mt-1" value={form.field_of_study || ""} onChange={e => set("field_of_study", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Mulai</Label><Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
              <div><Label className="text-xs">Selesai</Label><Input className="mt-1" type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} /></div>
            </div>
          </div>
          <div><Label className="text-xs">Deskripsi</Label><Textarea className="mt-1" rows={2} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}<Check className="w-3.5 h-3.5 mr-1" /> Simpan</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" /> Batal</Button>
          </div>
        </div>
      )}
      {items.map(e => (
        <div key={e.id} className="flex items-start justify-between gap-2 border-l-2 border-primary/30 pl-4">
          <div>
            <p className="text-sm font-medium text-card-foreground">{e.degree ? `${e.degree} — ${e.field_of_study || ""}` : e.institution}</p>
            {e.degree && <p className="text-xs text-muted-foreground">{e.institution}</p>}
            <p className="text-xs text-muted-foreground">{fmtDate(e.start_date)} – {e.end_date ? fmtDate(e.end_date) : "Sekarang"}</p>
            {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
          </div>
          <ItemActions onEdit={() => startEdit(e)} onDelete={() => remove(e.id)} deleting={deleting === e.id} />
        </div>
      ))}
    </div>
  );
};

// ─── EXPERIENCE ──────────────────────────
export const ExperienceEditor = ({ userId, items, setItems }: { userId: string; items: any[]; setItems: (v: any[]) => void }) => {
  const { editingId, form, saving, deleting, startAdd, startEdit, cancel, set, save, remove } = useInlineEditor(
    "user_experiences", userId, items, setItems,
    { company: "", position: "", location: "", start_date: "", end_date: "", is_current: false, description: "" }
  );

  const handleSave = () => save(["company", "position"]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!editingId && <Button size="sm" variant="outline" onClick={startAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>}
      </div>
      {editingId && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Perusahaan *</Label><Input className="mt-1" value={form.company || ""} onChange={e => set("company", e.target.value)} /></div>
            <div><Label className="text-xs">Posisi *</Label><Input className="mt-1" value={form.position || ""} onChange={e => set("position", e.target.value)} /></div>
            <div><Label className="text-xs">Lokasi</Label><Input className="mt-1" value={form.location || ""} onChange={e => set("location", e.target.value)} /></div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={form.is_current || false} onCheckedChange={v => set("is_current", v)} />
              <Label className="text-xs cursor-pointer" onClick={() => set("is_current", !form.is_current)}>Masih bekerja</Label>
            </div>
            <div><Label className="text-xs">Mulai</Label><Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
            {!form.is_current && <div><Label className="text-xs">Selesai</Label><Input className="mt-1" type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} /></div>}
          </div>
          <div><Label className="text-xs">Deskripsi</Label><Textarea className="mt-1" rows={2} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}<Check className="w-3.5 h-3.5 mr-1" /> Simpan</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" /> Batal</Button>
          </div>
        </div>
      )}
      {items.map(e => (
        <div key={e.id} className="flex items-start justify-between gap-2 border-l-2 border-primary/30 pl-4">
          <div>
            <p className="text-sm font-medium text-card-foreground">{e.position}</p>
            <p className="text-xs text-muted-foreground">{e.company}{e.location ? ` • ${e.location}` : ""}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(e.start_date)} – {e.is_current ? "Sekarang" : fmtDate(e.end_date)}</p>
            {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
          </div>
          <ItemActions onEdit={() => startEdit(e)} onDelete={() => remove(e.id)} deleting={deleting === e.id} />
        </div>
      ))}
    </div>
  );
};

// ─── ORGANIZATIONS ──────────────────────────
export const OrganizationEditor = ({ userId, items, setItems }: { userId: string; items: any[]; setItems: (v: any[]) => void }) => {
  const { editingId, form, saving, deleting, startAdd, startEdit, cancel, set, save, remove } = useInlineEditor(
    "user_organizations", userId, items, setItems,
    { organization_name: "", role: "", start_date: "", end_date: "", is_current: false, description: "" }
  );

  const handleSave = () => save(["organization_name"]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!editingId && <Button size="sm" variant="outline" onClick={startAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>}
      </div>
      {editingId && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Nama Organisasi *</Label><Input className="mt-1" value={form.organization_name || ""} onChange={e => set("organization_name", e.target.value)} /></div>
            <div><Label className="text-xs">Jabatan</Label><Input className="mt-1" value={form.role || ""} onChange={e => set("role", e.target.value)} /></div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={form.is_current || false} onCheckedChange={v => set("is_current", v)} />
              <Label className="text-xs cursor-pointer" onClick={() => set("is_current", !form.is_current)}>Masih aktif</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Mulai</Label><Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
              {!form.is_current && <div><Label className="text-xs">Selesai</Label><Input className="mt-1" type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} /></div>}
            </div>
          </div>
          <div><Label className="text-xs">Deskripsi</Label><Textarea className="mt-1" rows={2} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}<Check className="w-3.5 h-3.5 mr-1" /> Simpan</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" /> Batal</Button>
          </div>
        </div>
      )}
      {items.map(o => (
        <div key={o.id} className="flex items-start justify-between gap-2 border-l-2 border-primary/30 pl-4">
          <div>
            <p className="text-sm font-medium text-card-foreground">{o.role || o.organization_name}</p>
            {o.role && <p className="text-xs text-muted-foreground">{o.organization_name}</p>}
            <p className="text-xs text-muted-foreground">{fmtDate(o.start_date)} – {o.is_current ? "Sekarang" : fmtDate(o.end_date)}</p>
          </div>
          <ItemActions onEdit={() => startEdit(o)} onDelete={() => remove(o.id)} deleting={deleting === o.id} />
        </div>
      ))}
    </div>
  );
};

// ─── CERTIFICATIONS ──────────────────────────
export const CertificationEditor = ({ userId, items, setItems }: { userId: string; items: any[]; setItems: (v: any[]) => void }) => {
  const { editingId, form, saving, deleting, startAdd, startEdit, cancel, set, save, remove } = useInlineEditor(
    "user_certifications", userId, items, setItems,
    { name: "", issuing_organization: "", issue_date: "", expiry_date: "", credential_id: "", credential_url: "" }
  );

  const handleSave = () => save(["name", "issuing_organization"]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!editingId && <Button size="sm" variant="outline" onClick={startAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>}
      </div>
      {editingId && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Nama Sertifikasi *</Label><Input className="mt-1" value={form.name || ""} onChange={e => set("name", e.target.value)} /></div>
            <div><Label className="text-xs">Penerbit *</Label><Input className="mt-1" value={form.issuing_organization || ""} onChange={e => set("issuing_organization", e.target.value)} /></div>
            <div><Label className="text-xs">Tanggal Terbit</Label><Input className="mt-1" type="date" value={form.issue_date || ""} onChange={e => set("issue_date", e.target.value)} /></div>
            <div><Label className="text-xs">Tanggal Kadaluarsa</Label><Input className="mt-1" type="date" value={form.expiry_date || ""} onChange={e => set("expiry_date", e.target.value)} /></div>
            <div><Label className="text-xs">Credential ID</Label><Input className="mt-1" value={form.credential_id || ""} onChange={e => set("credential_id", e.target.value)} /></div>
            <div><Label className="text-xs">Credential URL</Label><Input className="mt-1" value={form.credential_url || ""} onChange={e => set("credential_url", e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}<Check className="w-3.5 h-3.5 mr-1" /> Simpan</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" /> Batal</Button>
          </div>
        </div>
      )}
      {items.map(c => (
        <div key={c.id} className="flex items-start justify-between gap-2 border-l-2 border-primary/30 pl-3">
          <div>
            <p className="text-sm font-medium text-card-foreground">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.issuing_organization}</p>
            {c.issue_date && <p className="text-xs text-muted-foreground">{fmtDate(c.issue_date)}{c.expiry_date ? ` – ${fmtDate(c.expiry_date)}` : ""}</p>}
            {c.credential_url && <a href={c.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Lihat Kredensial</a>}
          </div>
          <ItemActions onEdit={() => startEdit(c)} onDelete={() => remove(c.id)} deleting={deleting === c.id} />
        </div>
      ))}
    </div>
  );
};

// ─── TRAININGS ──────────────────────────
export const TrainingEditor = ({ userId, items, setItems }: { userId: string; items: any[]; setItems: (v: any[]) => void }) => {
  const { editingId, form, saving, deleting, startAdd, startEdit, cancel, set, save, remove } = useInlineEditor(
    "user_trainings", userId, items, setItems,
    { title: "", organizer: "", start_date: "", end_date: "", training_type: "", description: "" }
  );

  const handleSave = () => save(["title"]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!editingId && <Button size="sm" variant="outline" onClick={startAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>}
      </div>
      {editingId && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Judul Training *</Label><Input className="mt-1" value={form.title || ""} onChange={e => set("title", e.target.value)} /></div>
            <div><Label className="text-xs">Penyelenggara</Label><Input className="mt-1" value={form.organizer || ""} onChange={e => set("organizer", e.target.value)} /></div>
            <div><Label className="text-xs">Mulai</Label><Input className="mt-1" type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} /></div>
            <div><Label className="text-xs">Selesai</Label><Input className="mt-1" type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} /></div>
            <div>
              <Label className="text-xs">Tipe</Label>
              <Select value={form.training_type || ""} onValueChange={v => set("training_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="bootcamp">Bootcamp</SelectItem>
                  <SelectItem value="online_course">Online Course</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Deskripsi</Label><Textarea className="mt-1" rows={2} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}<Check className="w-3.5 h-3.5 mr-1" /> Simpan</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" /> Batal</Button>
          </div>
        </div>
      )}
      {items.map(t => (
        <div key={t.id} className="flex items-start justify-between gap-2 border-l-2 border-primary/30 pl-3">
          <div>
            <p className="text-sm font-medium text-card-foreground">{t.title}</p>
            {t.organizer && <p className="text-xs text-muted-foreground">{t.organizer}</p>}
            <p className="text-xs text-muted-foreground">{fmtDate(t.start_date)}{t.end_date ? ` – ${fmtDate(t.end_date)}` : ""}</p>
          </div>
          <ItemActions onEdit={() => startEdit(t)} onDelete={() => remove(t.id)} deleting={deleting === t.id} />
        </div>
      ))}
    </div>
  );
};

// ─── AWARDS ──────────────────────────
export const AwardEditor = ({ userId, items, setItems }: { userId: string; items: any[]; setItems: (v: any[]) => void }) => {
  const { editingId, form, saving, deleting, startAdd, startEdit, cancel, set, save, remove } = useInlineEditor(
    "user_awards", userId, items, setItems,
    { title: "", issuer: "", date_received: "", description: "" }
  );

  const handleSave = () => save(["title"]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!editingId && <Button size="sm" variant="outline" onClick={startAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>}
      </div>
      {editingId && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Judul Award *</Label><Input className="mt-1" value={form.title || ""} onChange={e => set("title", e.target.value)} /></div>
            <div><Label className="text-xs">Pemberi</Label><Input className="mt-1" value={form.issuer || ""} onChange={e => set("issuer", e.target.value)} /></div>
            <div><Label className="text-xs">Tanggal</Label><Input className="mt-1" type="date" value={form.date_received || ""} onChange={e => set("date_received", e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Deskripsi</Label><Textarea className="mt-1" rows={2} value={form.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}<Check className="w-3.5 h-3.5 mr-1" /> Simpan</Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="w-3.5 h-3.5 mr-1" /> Batal</Button>
          </div>
        </div>
      )}
      {items.map(a => (
        <div key={a.id} className="flex items-start justify-between gap-2 border border-border rounded-xl p-3">
          <div>
            <p className="text-sm font-medium text-card-foreground">{a.title}</p>
            {a.issuer && <p className="text-xs text-muted-foreground">{a.issuer}</p>}
            {a.date_received && <p className="text-xs text-muted-foreground">{fmtDate(a.date_received)}</p>}
          </div>
          <ItemActions onEdit={() => startEdit(a)} onDelete={() => remove(a.id)} deleting={deleting === a.id} />
        </div>
      ))}
    </div>
  );
};

// Helper
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "";
