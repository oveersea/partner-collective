import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Upload, FileText, CheckCircle2, Clock, XCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import DashboardNav from "@/components/dashboard/DashboardNav";

type KycStatus = "unverified" | "pending" | "verified" | "rejected";

interface KycSubmission {
  id: string;
  status: string;
  primary_doc_type: string;
  primary_doc_file_name: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
}

const docTypes = [
  { value: "ktp", label: "KTP (Kartu Tanda Penduduk)" },
  { value: "passport", label: "Paspor" },
  { value: "sim", label: "SIM (Surat Izin Mengemudi)" },
];

const KYCVerification = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<KycStatus>("unverified");
  const [submission, setSubmission] = useState<KycSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [docType, setDocType] = useState("ktp");
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [supportFile, setSupportFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchKycStatus();
  }, [user]);

  const fetchKycStatus = async () => {
    // Get profile kyc_status
    const { data: profile } = await supabase
      .from("profiles")
      .select("kyc_status")
      .eq("user_id", user!.id)
      .single();

    if (profile) {
      setKycStatus(profile.kyc_status as KycStatus);
    }

    // Get latest submission
    const { data: sub } = await supabase
      .from("kyc_submissions")
      .select("id, status, primary_doc_type, primary_doc_file_name, rejection_reason, admin_notes, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sub) setSubmission(sub as KycSubmission);
    setLoading(false);
  };

  const uploadFile = async (file: File, folder: string): Promise<{ url: string; name: string }> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    return { url: data.publicUrl, name: file.name };
  };

  const handleSubmit = async () => {
    if (!primaryFile || !selfieFile) {
      toast.error("Dokumen identitas dan foto selfie wajib diunggah");
      return;
    }

    setSubmitting(true);
    try {
      // Upload files
      const primary = await uploadFile(primaryFile, "primary");
      const selfie = await uploadFile(selfieFile, "selfie");
      const support = supportFile ? await uploadFile(supportFile, "support") : null;

      // Create submission
      const { error } = await supabase.from("kyc_submissions").insert({
        user_id: user!.id,
        primary_doc_type: docType,
        primary_doc_file_name: primary.name,
        primary_doc_file_url: primary.url,
        support_doc1_file_name: selfie.name,
        support_doc1_file_url: selfie.url,
        support_doc1_label: "Foto Selfie dengan Dokumen",
        support_doc2_file_name: support?.name || "",
        support_doc2_file_url: support?.url || "",
        support_doc2_label: support ? "Dokumen Pendukung" : "",
        status: "pending",
      });

      if (error) throw error;

      // Update profile kyc_status to pending
      await supabase
        .from("profiles")
        .update({ kyc_status: "pending" })
        .eq("user_id", user!.id);

      toast.success("Dokumen KYC berhasil dikirim! Kami akan memverifikasi dalam 1-3 hari kerja.");
      setKycStatus("pending");
      fetchKycStatus();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim dokumen");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Back */}
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Verifikasi KYC</h1>
          <p className="text-muted-foreground text-sm">Verifikasi identitas Anda untuk mulai menggunakan platform</p>
        </motion.div>

        {/* Status Banner */}
        {kycStatus === "verified" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-bold text-card-foreground mb-1">Identitas Terverifikasi</h2>
            <p className="text-sm text-muted-foreground">Akun Anda telah terverifikasi. Anda dapat menggunakan semua fitur platform.</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")}>Ke Dashboard</Button>
          </motion.div>
        )}

        {kycStatus === "pending" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center mb-6">
            <Clock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-card-foreground mb-1">Menunggu Verifikasi</h2>
            <p className="text-sm text-muted-foreground">Dokumen Anda sedang ditinjau. Proses verifikasi membutuhkan 1-3 hari kerja.</p>
            {submission && (
              <div className="mt-4 bg-card rounded-xl p-4 border border-border text-left">
                <p className="text-xs text-muted-foreground">Dokumen utama</p>
                <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {submission.primary_doc_file_name}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Dikirim {new Date(submission.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {kycStatus === "rejected" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h2 className="text-lg font-bold text-card-foreground mb-1">Verifikasi Ditolak</h2>
              <p className="text-sm text-muted-foreground">Dokumen Anda tidak memenuhi persyaratan. Silakan kirim ulang.</p>
            </div>
            {submission?.rejection_reason && (
              <div className="mt-4 bg-card rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Alasan penolakan:</p>
                <p className="text-sm text-destructive font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {submission.rejection_reason}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* KYC Form - Show when unverified or rejected */}
        {(kycStatus === "unverified" || kycStatus === "rejected") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6">
            <div>
              <h2 className="text-lg font-bold text-card-foreground mb-1">Upload Dokumen</h2>
              <p className="text-sm text-muted-foreground">Lengkapi dokumen berikut untuk verifikasi identitas</p>
            </div>

            {/* Step 1: Document Type */}
            <div>
              <Label className="text-card-foreground">1. Tipe Dokumen Identitas</Label>
              <select
                className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {docTypes.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Primary document */}
            <div>
              <Label className="text-card-foreground">2. Upload Dokumen Identitas *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Foto atau scan dokumen yang jelas dan terbaca. Format: JPG, PNG, PDF. Maks 5MB.
              </p>
              <div className="relative">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {primaryFile && (
                  <span className="flex items-center gap-1.5 mt-2 text-sm text-primary">
                    <FileText className="w-4 h-4" />
                    {primaryFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* Step 3: Selfie with document */}
            <div>
              <Label className="text-card-foreground">3. Foto Selfie dengan Dokumen *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Foto diri Anda memegang dokumen identitas di samping wajah Anda.
              </p>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {selfieFile && (
                <span className="flex items-center gap-1.5 mt-2 text-sm text-primary">
                  <FileText className="w-4 h-4" />
                  {selfieFile.name}
                </span>
              )}
            </div>

            {/* Step 4: Optional support doc */}
            <div>
              <Label className="text-card-foreground">4. Dokumen Pendukung (opsional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                NPWP, SKCK, atau dokumen pendukung lainnya.
              </p>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setSupportFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {supportFile && (
                <span className="flex items-center gap-1.5 mt-2 text-sm text-primary">
                  <FileText className="w-4 h-4" />
                  {supportFile.name}
                </span>
              )}
            </div>

            {/* Info box */}
            <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-card-foreground">Informasi Penting:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Dokumen akan diverifikasi dalam 1-3 hari kerja</li>
                <li>Pastikan dokumen asli, tidak buram, dan masih berlaku</li>
                <li>Data Anda akan dijaga kerahasiaannya</li>
                <li>Anda akan mendapat notifikasi setelah verifikasi selesai</li>
              </ul>
            </div>

            {/* Submit */}
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
              <Upload className="w-4 h-4" />
              {submitting ? "Mengunggah..." : "Kirim Dokumen Verifikasi"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default KYCVerification;
