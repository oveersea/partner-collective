import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, Upload, FileText, CheckCircle2,
  Trash2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().trim().min(2, "Nama perusahaan minimal 2 karakter").max(200),
  description: z.string().trim().max(2000).optional(),
  industry: z.string().min(1, "Industri wajib dipilih"),
  company_size: z.string().min(1, "Ukuran perusahaan wajib dipilih"),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").max(500),
  city: z.string().trim().min(2, "Kota wajib diisi"),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 digit").max(20),
  email: z.string().email("Email tidak valid"),
  website: z.string().url("URL tidak valid").optional().or(z.literal("")),
  nib: z.string().trim().optional(),
  npwp: z.string().trim().optional(),
  akta_number: z.string().trim().optional(),
});

const industries = [
  "Teknologi", "Konstruksi", "Manufaktur", "Perdagangan", "Jasa Profesional",
  "Keuangan", "Pendidikan", "Kesehatan", "Logistik", "F&B",
  "Media & Kreatif", "Pertanian", "Energi", "Pertambangan", "Lainnya",
];

const companySizes = [
  { value: "1-10", label: "1-10 karyawan" },
  { value: "11-50", label: "11-50 karyawan" },
  { value: "51-200", label: "51-200 karyawan" },
  { value: "201-500", label: "201-500 karyawan" },
  { value: "500+", label: "500+ karyawan" },
];

interface DocUpload {
  type: string;
  label: string;
  file: File | null;
  required: boolean;
  uploading: boolean;
}

const initialDocs: DocUpload[] = [
  { type: "siup", label: "SIUP / Izin Usaha", file: null, required: true, uploading: false },
  { type: "nib", label: "NIB (Nomor Induk Berusaha)", file: null, required: true, uploading: false },
  { type: "npwp", label: "NPWP Perusahaan", file: null, required: true, uploading: false },
  { type: "akta", label: "Akta Pendirian", file: null, required: false, uploading: false },
  { type: "tdp", label: "TDP / SKU", file: null, required: false, uploading: false },
  { type: "other", label: "Dokumen Lainnya", file: null, required: false, uploading: false },
];

const VendorRegistration = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<DocUpload[]>(initialDocs);

  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    company_size: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    nib: "",
    npwp: "",
    akta_number: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const setDocFile = (index: number, file: File | null) => {
    setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, file } : d)));
  };

  const validateStep1 = (): boolean => {
    const parsed = vendorSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const missingRequired = docs.filter((d) => d.required && !d.file);
    if (missingRequired.length > 0) {
      toast.error(`Dokumen wajib belum lengkap: ${missingRequired.map((d) => d.label).join(", ")}`);
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File, folder: string): Promise<{ url: string; name: string; size: number }> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("business-documents").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("business-documents").getPublicUrl(path);
    return { url: data.publicUrl, name: file.name, size: file.size };
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setSubmitting(true);
    try {
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 100) + "-" + Date.now();

      const { data: business, error: bizErr } = await supabase
        .from("business_profiles")
        .insert({
          name: form.name,
          slug,
          description: form.description || null,
          industry: form.industry,
          company_size: form.company_size,
          address: form.address,
          city: form.city,
          phone: form.phone,
          email: form.email,
          website: form.website || null,
          nib: form.nib || null,
          npwp: form.npwp || null,
          akta_number: form.akta_number || null,
          created_by: user!.id,
          kyc_status: "pending",
        })
        .select("id")
        .single();

      if (bizErr) throw bizErr;

      await supabase.from("business_members").insert({
        business_id: business.id,
        user_id: user!.id,
        role: "owner",
        status: "active",
      });

      const docsToUpload = docs.filter((d) => d.file);
      for (const doc of docsToUpload) {
        const uploaded = await uploadFile(doc.file!, doc.type);
        await supabase.from("business_documents").insert({
          business_id: business.id,
          document_type: doc.type,
          document_label: doc.label,
          file_name: uploaded.name,
          file_url: uploaded.url,
          file_size_bytes: uploaded.size,
          uploaded_by: user!.id,
        });
      }

      toast.success("Registrasi vendor berhasil! Dokumen akan diverifikasi dalam 1-3 hari kerja.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Gagal mendaftarkan vendor");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  const uploadedCount = docs.filter((d) => d.file).length;
  const requiredCount = docs.filter((d) => d.required).length;
  const requiredUploaded = docs.filter((d) => d.required && d.file).length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="w-full px-6 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Form (70%) */}
          <div className="lg:w-[70%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Registrasi Vendor</h1>
              <p className="text-muted-foreground text-sm">Daftarkan perusahaan Anda dan upload dokumen legalitas</p>
            </motion.div>

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  <span className={`text-sm font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                    {s === 1 ? "Info Perusahaan" : "Dokumen Legalitas"}
                  </span>
                  {s === 1 && <div className="w-8 h-0.5 bg-border mx-1" />}
                </div>
              ))}
            </div>

            {/* Step 1: Company Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-5"
              >
                <div>
                  <Label className="text-card-foreground">Nama Perusahaan *</Label>
                  <Input className="mt-1.5" placeholder="PT Contoh Indonesia" value={form.name} onChange={(e) => set("name", e.target.value)} />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label className="text-card-foreground">Deskripsi Perusahaan</Label>
                  <Textarea className="mt-1.5" rows={3} placeholder="Deskripsi singkat tentang perusahaan Anda..." value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-card-foreground">Industri *</Label>
                    <select
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={form.industry}
                      onChange={(e) => set("industry", e.target.value)}
                    >
                      <option value="">Pilih industri</option>
                      {industries.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    {errors.industry && <p className="text-xs text-destructive mt-1">{errors.industry}</p>}
                  </div>
                  <div>
                    <Label className="text-card-foreground">Ukuran Perusahaan *</Label>
                    <select
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={form.company_size}
                      onChange={(e) => set("company_size", e.target.value)}
                    >
                      <option value="">Pilih ukuran</option>
                      {companySizes.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {errors.company_size && <p className="text-xs text-destructive mt-1">{errors.company_size}</p>}
                  </div>
                </div>

                <div>
                  <Label className="text-card-foreground">Alamat *</Label>
                  <Textarea className="mt-1.5" rows={2} placeholder="Jl. Sudirman No. 1, Jakarta" value={form.address} onChange={(e) => set("address", e.target.value)} />
                  {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-card-foreground">Kota *</Label>
                    <Input className="mt-1.5" placeholder="Jakarta" value={form.city} onChange={(e) => set("city", e.target.value)} />
                    {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label className="text-card-foreground">Telepon *</Label>
                    <Input className="mt-1.5" placeholder="021-12345678" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-card-foreground">Email Perusahaan *</Label>
                    <Input className="mt-1.5" type="email" placeholder="info@perusahaan.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label className="text-card-foreground">Website</Label>
                    <Input className="mt-1.5" placeholder="https://perusahaan.com" value={form.website} onChange={(e) => set("website", e.target.value)} />
                    {errors.website && <p className="text-xs text-destructive mt-1">{errors.website}</p>}
                  </div>
                </div>

                {/* Legal numbers */}
                <div className="border-t border-border pt-5">
                  <p className="text-sm font-semibold text-card-foreground mb-3">Nomor Legalitas (opsional di tahap ini)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-card-foreground text-xs">NIB</Label>
                      <Input className="mt-1" placeholder="1234567890" value={form.nib} onChange={(e) => set("nib", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-card-foreground text-xs">NPWP</Label>
                      <Input className="mt-1" placeholder="01.234.567.8-901.000" value={form.npwp} onChange={(e) => set("npwp", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-card-foreground text-xs">No. Akta</Label>
                      <Input className="mt-1" placeholder="AHU-00000" value={form.akta_number} onChange={(e) => set("akta_number", e.target.value)} />
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => { if (validateStep1()) setStep(2); }}
                >
                  Lanjut ke Upload Dokumen
                </Button>
              </motion.div>
            )}

            {/* Step 2: Document Upload */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-5"
              >
                <div>
                  <h2 className="text-lg font-bold text-card-foreground mb-1">Upload Dokumen Legalitas</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload dokumen perusahaan Anda. Format: JPG, PNG, PDF. Maks 10MB per file.
                  </p>
                </div>

                <div className="space-y-4">
                  {docs.map((doc, idx) => (
                    <div
                      key={doc.type}
                      className={`rounded-xl border p-4 transition-colors ${
                        doc.file
                          ? "border-primary/30 bg-primary/5"
                          : doc.required
                          ? "border-border"
                          : "border-dashed border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${doc.file ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium text-card-foreground">
                            {doc.label}
                            {doc.required && <span className="text-destructive ml-1">*</span>}
                          </span>
                        </div>
                        {doc.file && (
                          <button
                            onClick={() => setDocFile(idx, null)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {doc.file ? (
                        <p className="text-xs text-primary flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {doc.file.name} ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      ) : (
                        <div className="relative">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && file.size > 10 * 1024 * 1024) {
                                toast.error("File terlalu besar. Maks 10MB.");
                                return;
                              }
                              setDocFile(idx, file || null);
                            }}
                            className="cursor-pointer text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Info */}
                <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-card-foreground">Informasi:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Dokumen bertanda * wajib diunggah</li>
                    <li>Dokumen akan diverifikasi dalam 1-3 hari kerja</li>
                    <li>Pastikan dokumen masih berlaku dan terbaca jelas</li>
                    <li>Data perusahaan dijaga kerahasiaannya</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Kembali
                  </Button>
                  <Button className="flex-1" size="lg" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mendaftarkan...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Daftarkan Vendor
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Summary sidebar (30%) */}
          <div className="lg:w-[30%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Ringkasan Vendor</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Nama Perusahaan</p>
                  <p className="text-card-foreground font-medium">{form.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Industri</p>
                  <p className="text-card-foreground font-medium">{form.industry || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Ukuran</p>
                  <p className="text-card-foreground font-medium">{form.company_size || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Kota</p>
                  <p className="text-card-foreground font-medium">{form.city || "—"}</p>
                </div>
                {form.email && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Email</p>
                    <p className="text-card-foreground font-medium">{form.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Tahap</p>
                  <p className="text-card-foreground font-medium">
                    {step === 1 ? "📝 Info Perusahaan" : "📄 Upload Dokumen"}
                  </p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground text-xs mb-1">Dokumen</p>
                  <p className="text-card-foreground font-medium">
                    {uploadedCount} terupload ({requiredUploaded}/{requiredCount} wajib)
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;
