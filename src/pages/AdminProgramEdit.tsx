import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calendar, Users, Star, MapPin, Award, X, Plus, Building2, Upload, Trash2, BookOpen, ChevronDown, ChevronUp, HelpCircle, Sparkles, Loader2 } from "lucide-react";

const STATUS_OPTIONS = ["draft", "pending", "approved", "rejected", "archived"];
const LEVEL_OPTIONS = ["beginner", "intermediate", "advanced"];
const CATEGORY_OPTIONS = ["online", "Certification", "Workshop", "Bootcamp"];
const CERT_METHOD_OPTIONS = ["auto", "manual", "none"];

interface SyllabusModule { title: string; description?: string; topics?: string[]; }
interface FAQItem { question: string; answer: string; }

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
  instructor_id: string | null;
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
  syllabus: SyllabusModule[] | null;
  faq: FAQItem[] | null;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Institution {
  id: string;
  name: string;
}

interface Instructor {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
}

const AdminProgramEdit = () => {
  const { oveercode: paramCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreateMode = paramCode === "new";
  const [data, setData] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<Instructor[]>([]);

  const [newOutcome, setNewOutcome] = useState("");
  const [newAudience, setNewAudience] = useState("");
  const [newPrereq, setNewPrereq] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [generating, setGenerating] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    setUploadingThumb(true);
    const ext = file.name.split(".").pop();
    const path = `${data.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("program-thumbnails").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Gagal upload: " + error.message);
      setUploadingThumb(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("program-thumbnails").getPublicUrl(path);
    update("thumbnail_url", urlData.publicUrl);
    setUploadingThumb(false);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  useEffect(() => {
    if (isCreateMode) {
      setData({
        id: "",
        title: "",
        slug: "",
        description: null,
        category: "online",
        status: "draft",
        level: "beginner",
        price_cents: 0,
        currency: "IDR",
        duration: null,
        student_count: 0,
        oveercode: null,
        thumbnail_url: null,
        instructor_id: user?.id || null,
        instructor_name: null,
        instructor_bio: null,
        instructor_avatar_url: null,
        organizer_type: null,
        institution_id: null,
        delivery_mode: "Online",
        certificate_method: "none",
        badge: null,
        rating: null,
        location: null,
        latitude: null,
        longitude: null,
        learning_outcomes: [],
        target_audience: [],
        prerequisites: [],
        syllabus: [],
        faq: [],
        admin_notes: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
    } else {
      fetchProgram();
    }
    fetchInstitutions();
    fetchInstructors();
  }, [paramCode]);

  const fetchProgram = async () => {
    if (!paramCode || isCreateMode) return;
    setLoading(true);
    const { data: prog, error } = await supabase
      .from("programs")
      .select("*")
      .eq("oveercode", paramCode)
      .single();

    if (error || !prog) {
      toast.error("Program tidak ditemukan");
      navigate("/admin");
      return;
    }
    const parsed: ProgramData = {
      ...(prog as unknown as ProgramData),
      syllabus: Array.isArray(prog.syllabus) ? (prog.syllabus as unknown as SyllabusModule[]) : [],
      faq: Array.isArray(prog.faq) ? (prog.faq as unknown as FAQItem[]) : [],
    };
    setData(parsed);

    // Fetch assigned instructors
    const { data: assigned } = await supabase
      .from("program_instructors")
      .select("instructor_id, sort_order")
      .eq("program_id", prog.id)
      .order("sort_order");
    if (assigned && assigned.length > 0) {
      const ids = assigned.map((a: any) => a.instructor_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, bio")
        .in("user_id", ids);
      if (profiles) {
        // Maintain sort order
        const sorted = ids.map((id: string) => profiles.find((p: any) => p.user_id === id)).filter(Boolean) as Instructor[];
        setSelectedInstructors(sorted);
      }
    }

    setLoading(false);
  };

  const fetchInstitutions = async () => {
    const { data: inst } = await supabase
      .from("institutions")
      .select("id, name")
      .order("name");
    if (inst) setInstitutions(inst as Institution[]);
  };

  const fetchInstructors = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "instructor");
    if (!roles || roles.length === 0) return;
    const ids = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, bio")
      .in("user_id", ids)
      .order("full_name");
    if (profiles) setInstructors(profiles as Instructor[]);
  };

  const addInstructor = (userId: string) => {
    if (!data || userId === "none") return;
    if (selectedInstructors.some((i) => i.user_id === userId)) return;
    const inst = instructors.find((i) => i.user_id === userId);
    if (inst) setSelectedInstructors([...selectedInstructors, inst]);
  };

  const removeInstructor = (userId: string) => {
    setSelectedInstructors(selectedInstructors.filter((i) => i.user_id !== userId));
  };

  const update = (field: string, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!data) return;
    if (!data.title.trim()) {
      toast.error("Judul program wajib diisi");
      return;
    }
    setSaving(true);

    if (isCreateMode) {
      const slug = generateSlug(data.title);
      const { id: _id, created_at: _ca, updated_at: _ua, oveercode: _ov, approved_at: _aa, slug: _sl, ...fields } = data as any;
      const insertPayload = { ...fields, slug, instructor_id: user?.id || data.instructor_id };

      const { data: inserted, error } = await supabase
        .from("programs")
        .insert(insertPayload as any)
        .select("oveercode, id")
        .single();

      if (error) {
        toast.error("Gagal membuat program: " + error.message);
        setSaving(false);
        return;
      }

      if (inserted && selectedInstructors.length > 0) {
        const rows = selectedInstructors.map((inst, i) => ({
          program_id: (inserted as any).id,
          instructor_id: inst.user_id,
          sort_order: i,
        }));
        await supabase.from("program_instructors").insert(rows);
      }

      toast.success("Program berhasil dibuat");
      setSaving(false);
      navigate(`/admin/program/${(inserted as any).oveercode}`, { replace: true });
      return;
    }

    const { id: _id, created_at: _ca, updated_at: _ua, oveercode: _ov, slug: _sl, approved_at: _aa, ...fields } = data as any;
    const { error } = await supabase.from("programs").update(fields).eq("id", data.id);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
      setSaving(false);
      return;
    }

    await supabase.from("program_instructors").delete().eq("program_id", data.id);
    if (selectedInstructors.length > 0) {
      const rows = selectedInstructors.map((inst, i) => ({
        program_id: data.id,
        instructor_id: inst.user_id,
        sort_order: i,
      }));
      await supabase.from("program_instructors").insert(rows);
    }

    toast.success("Program berhasil diperbarui");
    setSaving(false);
  };

  const handleGenerateDetails = async () => {
    if (!data || !data.title.trim()) {
      toast.error("Judul program wajib diisi terlebih dahulu");
      return;
    }
    setGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-program-details", {
        body: {
          title: data.title,
          description: data.description,
          category: data.category,
          level: data.level,
          existing: {
            learning_outcomes: data.learning_outcomes,
            target_audience: data.target_audience,
            prerequisites: data.prerequisites,
            syllabus: data.syllabus,
            faq: data.faq,
          },
        },
      });
      if (error) throw error;
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      const gen = result.generated;
      const updated = { ...data };
      if (gen.description) updated.description = gen.description;
      if (gen.learning_outcomes) updated.learning_outcomes = gen.learning_outcomes;
      if (gen.target_audience) updated.target_audience = gen.target_audience;
      if (gen.prerequisites) updated.prerequisites = gen.prerequisites;
      if (gen.syllabus) updated.syllabus = gen.syllabus;
      if (gen.faq) updated.faq = gen.faq;
      setData(updated);
      toast.success(`${(result.fields as string[]).length} bagian konten berhasil di-generate!`);
    } catch (e: any) {
      toast.error("Gagal generate: " + (e.message || "Unknown error"));
    } finally {
      setGenerating(false);
    }
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
              <h1 className="text-sm font-semibold text-foreground truncate max-w-[400px]">
                {isCreateMode ? "Program Baru" : data.title}
              </h1>
              {!isCreateMode && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-muted-foreground">{data.oveercode}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(data.status)}`}>{data.status}</Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCreateMode && (
              <Button variant="outline" onClick={handleGenerateDetails} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generating..." : "Generate Details"}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : isCreateMode ? "Buat Program" : "Simpan"}
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Meta info row */}
        {!isCreateMode && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dibuat: {new Date(data.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {data.student_count || 0} peserta</span>
            {data.rating && <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {data.rating}</span>}
            {data.approved_at && <span className="inline-flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Approved: {new Date(data.approved_at).toLocaleDateString("id-ID")}</span>}
          </div>
        )}

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
                <Label>Thumbnail</Label>
                {data.thumbnail_url ? (
                  <div className="mt-1 relative group w-fit">
                    <img src={data.thumbnail_url} alt="Thumbnail" className="h-32 rounded-[5px] object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => update("thumbnail_url", null)}
                      className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="mt-1 flex flex-col items-center justify-center h-32 rounded-[5px] border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30"
                  >
                    {uploadingThumb ? (
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Klik untuk upload</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailUpload}
                />
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

        {/* Row 3b: Kurikulum / Syllabus */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Kurikulum / Syllabus
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                const modules = [...(data.syllabus || [])];
                modules.push({ title: "", description: "", topics: [] });
                update("syllabus", modules);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Tambah Modul
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!data.syllabus || data.syllabus.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                Belum ada modul kurikulum. Klik "Tambah Modul" untuk mulai.
              </div>
            ) : (
              data.syllabus.map((mod, modIdx) => (
                <div key={modIdx} className="border border-border rounded-xl p-4 space-y-3 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-semibold text-primary uppercase">Modul</span>
                      <span className="text-sm font-bold text-primary leading-none">{modIdx + 1}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={mod.title}
                        onChange={(e) => {
                          const modules = [...(data.syllabus || [])];
                          modules[modIdx] = { ...modules[modIdx], title: e.target.value };
                          update("syllabus", modules);
                        }}
                        placeholder="Judul modul..."
                        className="font-medium"
                      />
                      <Textarea
                        rows={2}
                        value={mod.description || ""}
                        onChange={(e) => {
                          const modules = [...(data.syllabus || [])];
                          modules[modIdx] = { ...modules[modIdx], description: e.target.value };
                          update("syllabus", modules);
                        }}
                        placeholder="Deskripsi modul (opsional)..."
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      {modIdx > 0 && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                          const modules = [...(data.syllabus || [])];
                          [modules[modIdx - 1], modules[modIdx]] = [modules[modIdx], modules[modIdx - 1]];
                          update("syllabus", modules);
                        }}>
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      )}
                      {modIdx < (data.syllabus?.length || 0) - 1 && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                          const modules = [...(data.syllabus || [])];
                          [modules[modIdx], modules[modIdx + 1]] = [modules[modIdx + 1], modules[modIdx]];
                          update("syllabus", modules);
                        }}>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                        const modules = [...(data.syllabus || [])];
                        modules.splice(modIdx, 1);
                        update("syllabus", modules);
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="ml-[52px]">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Topik dalam modul ini</Label>
                    {mod.topics && mod.topics.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {mod.topics.map((topic, topicIdx) => (
                          <div key={topicIdx} className="flex items-center gap-2 group">
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{topicIdx + 1}</span>
                            <Input
                              value={topic}
                              onChange={(e) => {
                                const modules = [...(data.syllabus || [])];
                                const topics = [...(modules[modIdx].topics || [])];
                                topics[topicIdx] = e.target.value;
                                modules[modIdx] = { ...modules[modIdx], topics };
                                update("syllabus", modules);
                              }}
                              className="h-8 text-sm"
                            />
                            <button
                              onClick={() => {
                                const modules = [...(data.syllabus || [])];
                                const topics = [...(modules[modIdx].topics || [])];
                                topics.splice(topicIdx, 1);
                                modules[modIdx] = { ...modules[modIdx], topics };
                                update("syllabus", modules);
                              }}
                              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs gap-1 h-7" onClick={() => {
                      const modules = [...(data.syllabus || [])];
                      const topics = [...(modules[modIdx].topics || []), ""];
                      modules[modIdx] = { ...modules[modIdx], topics };
                      update("syllabus", modules);
                    }}>
                      <Plus className="w-3 h-3" /> Tambah Topik
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Row 3c: FAQ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" /> FAQ
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => {
                const items = [...(data.faq || [])];
                items.push({ question: "", answer: "" });
                update("faq", items);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Tambah FAQ
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(!data.faq || data.faq.length === 0) ? (
              <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                Belum ada FAQ. Klik "Tambah FAQ" untuk mulai.
              </div>
            ) : (
              data.faq.map((item, faqIdx) => (
                <div key={faqIdx} className="border border-border rounded-lg p-4 space-y-2 bg-muted/20">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-primary mt-2">Q{faqIdx + 1}</span>
                    <Input
                      value={item.question}
                      onChange={(e) => {
                        const items = [...(data.faq || [])];
                        items[faqIdx] = { ...items[faqIdx], question: e.target.value };
                        update("faq", items);
                      }}
                      placeholder="Pertanyaan..."
                      className="font-medium"
                    />
                    <button
                      onClick={() => {
                        const items = [...(data.faq || [])];
                        items.splice(faqIdx, 1);
                        update("faq", items);
                      }}
                      className="text-muted-foreground hover:text-destructive mt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="ml-6">
                    <Textarea
                      rows={2}
                      value={item.answer}
                      onChange={(e) => {
                        const items = [...(data.faq || [])];
                        items[faqIdx] = { ...items[faqIdx], answer: e.target.value };
                        update("faq", items);
                      }}
                      placeholder="Jawaban..."
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Instruktur</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tambah Instruktur</Label>
                <Select value="none" onValueChange={addInstructor}>
                  <SelectTrigger><SelectValue placeholder="Pilih instruktur..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Pilih —</SelectItem>
                    {instructors
                      .filter((inst) => !selectedInstructors.some((s) => s.user_id === inst.user_id))
                      .map((inst) => (
                        <SelectItem key={inst.user_id} value={inst.user_id}>{inst.full_name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedInstructors.length > 0 && (
                <div className="space-y-2">
                  {selectedInstructors.map((inst) => (
                    <div key={inst.user_id} className="rounded-[5px] border border-border p-3 flex items-center gap-3">
                      {inst.avatar_url ? (
                        <img src={inst.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                          {(inst.full_name || "?")[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inst.full_name}</p>
                        {inst.bio && <p className="text-xs text-muted-foreground truncate">{inst.bio}</p>}
                      </div>
                      <button onClick={() => removeInstructor(inst.user_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {selectedInstructors.length === 0 && (
                <p className="text-xs text-muted-foreground">Belum ada instruktur yang ditambahkan</p>
              )}
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
