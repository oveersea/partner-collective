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
import { ArrowLeft, Save, Calendar, Users, Star, MapPin, Award, X, Plus, Building2 } from "lucide-react";

const STATUS_OPTIONS = ["draft", "pending", "approved", "rejected", "archived"];
const LEVEL_OPTIONS = ["beginner", "intermediate", "advanced"];
const CATEGORY_OPTIONS = ["online", "Certification", "Workshop", "Bootcamp"];
const CERT_METHOD_OPTIONS = ["auto", "manual", "none"];

interface ProgramData {
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
  thumbnail_url: string | null;
  instructor_name: string | null;
  instructor_bio: string | null;
  instructor_avatar_url: string | null;
  organizer_type: string | null;
  institution_id: string | null;
  delivery_mode: string | null;
  certificate_method: string;
  badge: string | null;
  rating: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  learning_outcomes: string[] | null;
  target_audience: string[] | null;
  prerequisites: string[] | null;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Institution {
  id: string;
  name: string;
}

const AdminProgramEdit = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [newOutcome, setNewOutcome] = useState("");
  const [newAudience, setNewAudience] = useState("");
  const [newPrereq, setNewPrereq] = useState("");

  useEffect(() => {
    fetchProgram();
    fetchInstitutions();
  }, [programId]);

  const fetchProgram = async () => {
    if (!programId) return;
    setLoading(true);
    const { data: prog, error } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (error || !prog) {
      toast.error("Program tidak ditemukan");
      navigate("/admin");
      return;
    }
    setData(prog as unknown as ProgramData);
    setLoading(false);
  };

  const fetchInstitutions = async () => {
    const { data: inst } = await supabase
      .from("institutions")
      .select("id, name")
      .order("name");
    if (inst) setInstitutions(inst as Institution[]);
  };

  const update = (field: string, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    const { id: _id, created_at: _ca, updated_at: _ua, oveercode: _ov, slug: _sl, approved_at: _aa, ...fields } = data as any;
    const { error } = await supabase.from("programs").update(fields).eq("id", data.id);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Program berhasil diperbarui");
    }
    setSaving(false);
  };

  const addToArray = (field: "learning_outcomes" | "target_audience" | "prerequisites", value: string, setter: (v: string) => void) => {
    if (!value.trim() || !data) return;
    const current = (data[field] as string[] | null) || [];
    update(field, [...current, value.trim()]);
    setter("");
  };

  const removeFromArray = (field: "learning_outcomes" | "target_audience" | "prerequisites", index: number) => {
    if (!data) return;
    const current = (data[field] as string[] | null) || [];
    update(field, current.filter((_, i) => i !== index));
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "bg-primary/10 text-primary";
      case "draft": return "bg-muted text-muted-foreground";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="w-full px-4 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground truncate max-w-[400px]">{data.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-muted-foreground">{data.oveercode}</span>
                <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(data.status)}`}>{data.status}</Badge>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </header>

      <div className="w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Meta info row */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dibuat: {new Date(data.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {data.student_count || 0} peserta</span>
          {data.rating && <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {data.rating}</span>}
          {data.approved_at && <span className="inline-flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Approved: {new Date(data.approved_at).toLocaleDateString("id-ID")}</span>}
        </div>

        {/* Row 1: Basic Info + Status & Classification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Informasi Dasar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Judul Program</Label>
                <Input value={data.title} onChange={(e) => update("title", e.target.value)} />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea rows={4} value={data.description || ""} onChange={(e) => update("description", e.target.value)} />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input value={data.thumbnail_url || ""} onChange={(e) => update("thumbnail_url", e.target.value)} placeholder="https://..." />
                {data.thumbnail_url && (
                  <img src={data.thumbnail_url} alt="Thumbnail" className="mt-2 h-32 rounded-[5px] object-cover border border-border" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Status & Klasifikasi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={data.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={data.category} onValueChange={(v) => update("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Level</Label>
                  <Select value={data.level || "beginner"} onValueChange={(v) => update("level", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Badge</Label>
                  <Input value={data.badge || ""} onChange={(e) => update("badge", e.target.value)} placeholder="e.g. Bestseller" />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Institusi</Label>
                <Select value={data.institution_id || "none"} onValueChange={(v) => update("institution_id", v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih institusi..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tidak ada —</SelectItem>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Pricing & Duration + Stats & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Harga & Durasi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Harga (Rp)</Label>
                  <Input type="number" value={data.price_cents ?? 0} onChange={(e) => update("price_cents", Number(e.target.value))} />
                </div>
                <div>
                  <Label>Durasi</Label>
                  <Input value={data.duration || ""} onChange={(e) => update("duration", e.target.value)} placeholder="e.g. 14 Hari" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mode Pengiriman</Label>
                  <Input value={data.delivery_mode || ""} onChange={(e) => update("delivery_mode", e.target.value)} placeholder="Online / Offline" />
                </div>
                <div>
                  <Label>Metode Sertifikat</Label>
                  <Select value={data.certificate_method} onValueChange={(v) => update("certificate_method", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CERT_METHOD_OPTIONS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Statistik & Lokasi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jumlah Peserta</Label>
                  <p className="text-sm font-medium mt-1">{data.student_count ?? 0}</p>
                </div>
                <div>
                  <Label>Rating</Label>
                  <p className="text-sm font-medium mt-1">{data.rating ?? "—"}</p>
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Lokasi</Label>
                <Input value={data.location || ""} onChange={(e) => update("location", e.target.value)} placeholder="Kota / Alamat" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Latitude</Label>
                  <Input type="number" step="any" value={data.latitude ?? ""} onChange={(e) => update("latitude", e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <Label className="text-xs">Longitude</Label>
                  <Input type="number" step="any" value={data.longitude ?? ""} onChange={(e) => update("longitude", e.target.value ? Number(e.target.value) : null)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Learning Details (full width) */}
        <Card>
          <CardHeader><CardTitle className="text-base">Detail Pembelajaran</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Learning Outcomes */}
              <div>
                <Label>Learning Outcomes</Label>
                <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                  {(data.learning_outcomes || []).map((item, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs pr-1">
                      {item}
                      <button onClick={() => removeFromArray("learning_outcomes", i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} placeholder="Tambah outcome..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("learning_outcomes", newOutcome, setNewOutcome))} />
                  <Button size="sm" variant="outline" onClick={() => addToArray("learning_outcomes", newOutcome, setNewOutcome)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <Label>Target Audience</Label>
                <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                  {(data.target_audience || []).map((item, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs pr-1">
                      {item}
                      <button onClick={() => removeFromArray("target_audience", i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newAudience} onChange={(e) => setNewAudience(e.target.value)} placeholder="Tambah target audience..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("target_audience", newAudience, setNewAudience))} />
                  <Button size="sm" variant="outline" onClick={() => addToArray("target_audience", newAudience, setNewAudience)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <Label>Prasyarat</Label>
                <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                  {(data.prerequisites || []).map((item, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs pr-1">
                      {item}
                      <button onClick={() => removeFromArray("prerequisites", i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newPrereq} onChange={(e) => setNewPrereq(e.target.value)} placeholder="Tambah prasyarat..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("prerequisites", newPrereq, setNewPrereq))} />
                  <Button size="sm" variant="outline" onClick={() => addToArray("prerequisites", newPrereq, setNewPrereq)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Row 4: Instructor + Admin Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Instruktur</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nama Instruktur</Label>
                  <Input value={data.instructor_name || ""} onChange={(e) => update("instructor_name", e.target.value)} />
                </div>
                <div>
                  <Label>Avatar URL</Label>
                  <Input value={data.instructor_avatar_url || ""} onChange={(e) => update("instructor_avatar_url", e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label>Bio Instruktur</Label>
                <Textarea rows={3} value={data.instructor_bio || ""} onChange={(e) => update("instructor_bio", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Catatan Admin</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={6} value={data.admin_notes || ""} onChange={(e) => update("admin_notes", e.target.value)} placeholder="Catatan internal..." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProgramEdit;
