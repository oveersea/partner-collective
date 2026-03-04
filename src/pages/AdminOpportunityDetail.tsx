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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Briefcase, MapPin, X, Plus } from "lucide-react";

const STATUS_OPTIONS = ["draft", "open", "closed", "filled", "cancelled"];
const JOB_TYPE_OPTIONS = ["full_time", "part_time", "contract", "freelance", "internship", "project"];
const CATEGORY_OPTIONS = ["technology", "engineering", "marketing", "design", "finance", "hr", "operations", "other"];
const SLA_OPTIONS = ["standard", "priority", "urgent"];

interface OpportunityData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  status: string;
  job_type: string | null;
  location: string | null;
  is_remote: boolean | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  deadline: string | null;
  skills_required: string[] | null;
  required_certifications: string[] | null;
  min_experience_years: number | null;
  min_education_level: string | null;
  company_name: string | null;
  business_id: string | null;
  oveercode: string | null;
  sla_type: string;
  sla_deadline: string | null;
  admin_notes: string | null;
  quantity: string | null;
  unit: string | null;
  specifications: string | null;
  project_scope: string | null;
  project_duration: string | null;
  delivery_terms: string | null;
  payment_terms: string | null;
  demand_type: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const AdminOpportunityDetail = () => {
  const { oveercode: paramCode } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<OpportunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [posterName, setPosterName] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunity();
  }, [paramCode]);

  const fetchOpportunity = async () => {
    if (!paramCode) return;
    setLoading(true);
    const { data: opp, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("oveercode", paramCode)
      .single();

    if (error || !opp) {
      toast.error("Opportunity tidak ditemukan");
      navigate("/admin");
      return;
    }
    setData(opp as unknown as OpportunityData);

    // Fetch related names
    if (opp.business_id) {
      supabase.from("business_profiles").select("name").eq("id", opp.business_id).single()
        .then(({ data: d }) => { if (d) setBusinessName(d.name); });
    }
    if (opp.user_id) {
      supabase.from("profiles").select("full_name").eq("user_id", opp.user_id).single()
        .then(({ data: d }) => { if (d) setPosterName(d.full_name); });
    }
    setLoading(false);
  };

  const update = (key: keyof OpportunityData, value: any) => {
    if (!data) return;
    setData({ ...data, [key]: value });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    const { id, created_at: _ca, updated_at: _ua, slug: _slug, oveercode: _ov, user_id: _uid, ...updateFields } = data;
    const { error } = await supabase
      .from("opportunities")
      .update(updateFields)
      .eq("id", id);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Berhasil disimpan");
    }
    setSaving(false);
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || !data) return;
    const current = data.skills_required || [];
    if (!current.includes(s)) {
      update("skills_required", [...current, s]);
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    if (!data) return;
    update("skills_required", (data.skills_required || []).filter((s) => s !== skill));
  };

  const addCert = () => {
    const c = newCert.trim();
    if (!c || !data) return;
    const current = data.required_certifications || [];
    if (!current.includes(c)) {
      update("required_certifications", [...current, c]);
    }
    setNewCert("");
  };

  const removeCert = (cert: string) => {
    if (!data) return;
    update("required_certifications", (data.required_certifications || []).filter((c) => c !== cert));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground truncate max-w-md">{data.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{data.oveercode}</span>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">{data.status}</Badge>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Info Bar */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {posterName && <span>Diposting oleh: <strong className="text-foreground">{posterName}</strong></span>}
          {businessName && <span>Perusahaan: <strong className="text-foreground">{businessName}</strong></span>}
          <span>Dibuat: {new Date(data.created_at).toLocaleDateString("id-ID")}</span>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4" /> Informasi Dasar</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Judul</Label>
              <Input value={data.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={data.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            <div>
              <Label>Tipe Pekerjaan</Label>
              <Select value={data.job_type || ""} onValueChange={(v) => update("job_type", v)}>
                <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                <SelectContent>
                  {JOB_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SLA</Label>
              <Select value={data.sla_type} onValueChange={(v) => update("sla_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLA_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Demand Type</Label>
              <Input value={data.demand_type || ""} onChange={(e) => update("demand_type", e.target.value)} placeholder="e.g. recruitment, procurement" />
            </div>
            <div>
              <Label>Company Name (manual)</Label>
              <Input value={data.company_name || ""} onChange={(e) => update("company_name", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Deskripsi</Label>
              <Textarea value={data.description || ""} onChange={(e) => update("description", e.target.value)} rows={5} />
            </div>
          </CardContent>
        </Card>

        {/* Location & Budget */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Lokasi & Budget</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Lokasi</Label>
              <Input value={data.location || ""} onChange={(e) => update("location", e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={data.is_remote || false} onCheckedChange={(v) => update("is_remote", v)} />
              <Label>Remote</Label>
            </div>
            <div>
              <Label>Budget Min</Label>
              <Input type="number" value={data.budget_min ?? ""} onChange={(e) => update("budget_min", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label>Budget Max</Label>
              <Input type="number" value={data.budget_max ?? ""} onChange={(e) => update("budget_max", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={data.currency || "IDR"} onChange={(e) => update("currency", e.target.value)} />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={data.deadline?.split("T")[0] || ""} onChange={(e) => update("deadline", e.target.value || null)} />
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader><CardTitle className="text-base">Persyaratan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Min. Pengalaman (tahun)</Label>
                <Input type="number" value={data.min_experience_years ?? ""} onChange={(e) => update("min_experience_years", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <Label>Min. Pendidikan</Label>
                <Input value={data.min_education_level || ""} onChange={(e) => update("min_education_level", e.target.value)} placeholder="e.g. S1, D3" />
              </div>
            </div>

            <div>
              <Label>Skills Required</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(data.skills_required || []).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs gap-1">
                    {s}
                    <button onClick={() => removeSkill(s)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Tambah skill" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                <Button size="sm" variant="outline" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div>
              <Label>Sertifikasi Required</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(data.required_certifications || []).map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs gap-1">
                    {c}
                    <button onClick={() => removeCert(c)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newCert} onChange={(e) => setNewCert(e.target.value)} placeholder="Tambah sertifikasi" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert())} />
                <Button size="sm" variant="outline" onClick={addCert}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details (for project type) */}
        <Card>
          <CardHeader><CardTitle className="text-base">Detail Proyek / Procurement</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input value={data.quantity || ""} onChange={(e) => update("quantity", e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={data.unit || ""} onChange={(e) => update("unit", e.target.value)} />
            </div>
            <div>
              <Label>Durasi Proyek</Label>
              <Input value={data.project_duration || ""} onChange={(e) => update("project_duration", e.target.value)} />
            </div>
            <div>
              <Label>Specifications</Label>
              <Input value={data.specifications || ""} onChange={(e) => update("specifications", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Project Scope</Label>
              <Textarea value={data.project_scope || ""} onChange={(e) => update("project_scope", e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Delivery Terms</Label>
              <Input value={data.delivery_terms || ""} onChange={(e) => update("delivery_terms", e.target.value)} />
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Input value={data.payment_terms || ""} onChange={(e) => update("payment_terms", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Admin Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={data.admin_notes || ""} onChange={(e) => update("admin_notes", e.target.value)} rows={3} placeholder="Catatan internal admin..." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOpportunityDetail;
