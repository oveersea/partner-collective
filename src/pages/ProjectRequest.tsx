import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, FolderKanban, MapPin, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { z } from "zod";

const projectSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(5000, "Deskripsi maksimal 5000 karakter"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  skills_required: z.array(z.string().trim()).min(1, "Minimal 1 skill diperlukan"),
  budget_min: z.number().min(0).nullable(),
  budget_max: z.number().min(0).nullable(),
  deadline: z.string().optional(),
  is_remote: z.boolean(),
  location: z.string().max(200).optional(),
  project_scope: z.string().max(2000).optional(),
  project_duration: z.string().optional(),
  demand_type: z.enum(["partner", "team"]),
});

const categories = [
  "Web Development", "Mobile Development", "UI/UX Design", "Data Science",
  "DevOps", "Cloud", "Cybersecurity", "AI/ML", "Marketing Digital",
  "Content Writing", "Video Production", "Consulting", "Lainnya",
];

const currencies = [
  { value: "IDR", label: "IDR (Rp)", symbol: "Rp" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "SGD", label: "SGD (S$)", symbol: "S$" },
];

const durations = [
  { value: "1-2 minggu", label: "1-2 Minggu" },
  { value: "1 bulan", label: "1 Bulan" },
  { value: "2-3 bulan", label: "2-3 Bulan" },
  { value: "3-6 bulan", label: "3-6 Bulan" },
  { value: "6+ bulan", label: "6+ Bulan" },
];

const ProjectRequest = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    skillsInput: "",
    skills_required: [] as string[],
    budget_min: "",
    budget_max: "",
    deadline: "",
    is_remote: true,
    location: "",
    project_scope: "",
    project_duration: "",
    demand_type: "partner" as "partner" | "team",
    currency: "IDR",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const addSkill = () => {
    const skill = form.skillsInput.trim();
    if (skill && !form.skills_required.includes(skill)) {
      set("skills_required", [...form.skills_required, skill]);
      set("skillsInput", "");
    }
  };

  const removeSkill = (skill: string) => {
    set("skills_required", form.skills_required.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    const parsed = projectSchema.safeParse({
      title: form.title,
      description: form.description,
      category: form.category,
      skills_required: form.skills_required,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      deadline: form.deadline || undefined,
      is_remote: form.is_remote,
      location: form.location,
      project_scope: form.project_scope,
      project_duration: form.project_duration || undefined,
      demand_type: form.demand_type,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      toast.error("Silakan periksa kembali form Anda");
      return;
    }

    setSubmitting(true);
    try {
      // Generate a slug from title
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 100) + "-" + Date.now();

      const { error } = await supabase.from("opportunities").insert({
        user_id: user!.id,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        skills_required: parsed.data.skills_required,
        budget_min: parsed.data.budget_min,
        budget_max: parsed.data.budget_max,
        deadline: parsed.data.deadline || null,
        is_remote: parsed.data.is_remote,
        location: parsed.data.is_remote ? null : (parsed.data.location || null),
        project_scope: parsed.data.project_scope || null,
        project_duration: parsed.data.project_duration || null,
        demand_type: parsed.data.demand_type,
        slug,
        status: "open",
        job_type: "project",
        sla_type: "normal",
      });

      if (error) throw error;
      toast.success("Project request berhasil dibuat!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat project request");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="w-full px-6 py-8">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Form (70%) */}
          <div className="lg:w-[70%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">Project Request</h1>
              <p className="text-muted-foreground text-sm">Temukan partner atau tim untuk mengerjakan project Anda</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6">
              {/* Demand Type */}
              <div>
                <Label className="text-card-foreground">Cari Partner atau Tim?</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button type="button" onClick={() => set("demand_type", "partner")} className={`p-4 rounded-xl border text-center transition-all ${form.demand_type === "partner" ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                    <span className="text-2xl">👤</span>
                    <p className="font-semibold text-sm text-card-foreground mt-1">Partner</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Individu freelancer</p>
                  </button>
                  <button type="button" onClick={() => set("demand_type", "team")} className={`p-4 rounded-xl border text-center transition-all ${form.demand_type === "team" ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                    <span className="text-2xl">👥</span>
                    <p className="font-semibold text-sm text-card-foreground mt-1">Tim</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tim kolaboratif</p>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label className="text-card-foreground">Judul Project *</Label>
                <Input className="mt-1.5" placeholder="Contoh: Redesign Website E-Commerce" value={form.title} onChange={(e) => set("title", e.target.value)} />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              {/* Category */}
              <div>
                <Label className="text-card-foreground">Kategori *</Label>
                <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
              </div>

              {/* Description */}
              <div>
                <Label className="text-card-foreground">Deskripsi Project *</Label>
                <Textarea className="mt-1.5" rows={4} placeholder="Jelaskan scope project, deliverables, dan ekspektasi..." value={form.description} onChange={(e) => set("description", e.target.value)} />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>

              {/* Project Scope */}
              <div>
                <Label className="text-card-foreground">Scope of Work (opsional)</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="Detail scope pekerjaan, milestone, dan deliverables..." value={form.project_scope} onChange={(e) => set("project_scope", e.target.value)} />
              </div>

              {/* Skills */}
              <div>
                <Label className="text-card-foreground">Skills yang Dibutuhkan *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input placeholder="Tambah skill, tekan Enter" value={form.skillsInput} onChange={(e) => set("skillsInput", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                  <Button type="button" variant="outline" onClick={addSkill} size="sm">+</Button>
                </div>
                {form.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.skills_required.map((skill) => (
                      <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-destructive ml-0.5">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.skills_required && <p className="text-xs text-destructive mt-1">{errors.skills_required}</p>}
              </div>

              {/* Budget & Duration row */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label className="text-card-foreground">Budget</Label>
                  <div className="flex gap-2 mt-1.5">
                    <select
                      className="h-10 px-2 rounded-md border border-input bg-background text-sm w-[100px] shrink-0"
                      value={form.currency}
                      onChange={(e) => set("currency", e.target.value)}
                    >
                      {currencies.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{currencies.find(c => c.value === form.currency)?.symbol}</span>
                      <Input className="pl-10" type="number" placeholder="Min" value={form.budget_min} onChange={(e) => set("budget_min", e.target.value)} />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{currencies.find(c => c.value === form.currency)?.symbol}</span>
                      <Input className="pl-10" type="number" placeholder="Max" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-card-foreground">Estimasi Durasi</Label>
                  <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.project_duration} onChange={(e) => set("project_duration", e.target.value)}>
                    <option value="">Pilih durasi</option>
                    {durations.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                  </select>
                </div>
              </div>

              {/* Deadline & Mode row */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-card-foreground">Deadline</Label>
                  <div className="relative mt-1.5">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-card-foreground">Mode Kerja</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button type="button" onClick={() => set("is_remote", true)} className={`p-2.5 rounded-xl border text-sm font-medium transition-all text-center ${form.is_remote ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      🌍 Remote
                    </button>
                    <button type="button" onClick={() => set("is_remote", false)} className={`p-2.5 rounded-xl border text-sm font-medium transition-all text-center ${!form.is_remote ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      🏢 On-site
                    </button>
                  </div>
                </div>
              </div>

              {!form.is_remote && (
                <div>
                  <Label className="text-card-foreground">Lokasi</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Jakarta, Indonesia" value={form.location} onChange={(e) => set("location", e.target.value)} />
                  </div>
                </div>
              )}

              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Mengirim..." : "Buat Project Request"}
              </Button>
            </motion.div>
          </div>

          {/* Right: Summary sidebar (30%) */}
          <div className="lg:w-[30%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Ringkasan Project</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Tipe</p>
                  <p className="text-card-foreground font-medium">{form.demand_type === "partner" ? "👤 Partner" : "👥 Tim"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Judul</p>
                  <p className="text-card-foreground font-medium">{form.title || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Kategori</p>
                  <p className="text-card-foreground font-medium">{form.category || "—"}</p>
                </div>
                {form.skills_required.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {form.skills_required.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(form.budget_min || form.budget_max) && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Budget</p>
                    <p className="text-card-foreground font-medium">
                      {form.budget_min ? `${currencies.find(c => c.value === form.currency)?.symbol} ${Number(form.budget_min).toLocaleString("id-ID")}` : "—"} - {form.budget_max ? `${currencies.find(c => c.value === form.currency)?.symbol} ${Number(form.budget_max).toLocaleString("id-ID")}` : "—"}
                    </p>
                  </div>
                )}
                {form.project_duration && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Durasi</p>
                    <p className="text-card-foreground font-medium">{form.project_duration}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Mode Kerja</p>
                  <p className="text-card-foreground font-medium">{form.is_remote ? "🌍 Full Remote" : "🏢 On-site"}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRequest;
