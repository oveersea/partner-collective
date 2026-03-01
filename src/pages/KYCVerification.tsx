import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Upload, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, User, MapPin, Calendar, CreditCard } from "lucide-react";
import DashboardBreadcrumb from "@/components/dashboard/DashboardBreadcrumb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DashboardNav from "@/components/dashboard/DashboardNav";

type KycStatus = "unverified" | "pending" | "verified" | "approved" | "rejected";

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
  const [step, setStep] = useState(1);

  // Personal info form
  const [fullName, setFullName] = useState("");
  const [nik, setNik] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  // Document form
  const [docType, setDocType] = useState("ktp");
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [supportFile, setSupportFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Bypass KYC page if already verified
  useEffect(() => {
    if (!loading && (kycStatus === "verified" || kycStatus === "approved")) {
      toast.success("Identitas Anda sudah terverifikasi");
      navigate("/dashboard");
    }
  }, [kycStatus, loading, navigate]);

  useEffect(() => {
    if (user) fetchKycStatus();
  }, [user]);

  const fetchKycStatus = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("kyc_status, full_name, city, country, phone_number")
      .eq("user_id", user!.id)
      .single();

    if (profile) {
      setKycStatus(profile.kyc_status as KycStatus);
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.city) setCity(profile.city);
      if (profile.phone_number) setPhone(profile.phone_number);
    }

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

  const validateStep1 = () => {
    if (!fullName.trim()) { toast.error("Nama lengkap wajib diisi"); return false; }
    if (!nik.trim() || nik.length < 10) { toast.error("Nomor identitas wajib diisi (min. 10 digit)"); return false; }
    if (!birthDate) { toast.error("Tanggal lahir wajib diisi"); return false; }
    if (!gender) { toast.error("Jenis kelamin wajib dipilih"); return false; }
    if (!address.trim()) { toast.error("Alamat wajib diisi"); return false; }
    if (!city.trim()) { toast.error("Kota wajib diisi"); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!primaryFile || !selfieFile) {
      toast.error("Dokumen identitas dan foto selfie wajib diunggah");
      return;
    }

    setSubmitting(true);
    try {
      const primary = await uploadFile(primaryFile, "primary");
      const selfie = await uploadFile(selfieFile, "selfie");
      const support = supportFile ? await uploadFile(supportFile, "support") : null;

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

      await supabase
        .from("profiles")
        .update({
          kyc_status: "pending",
          full_name: fullName,
          city,
          phone_number: phone,
        })
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

  const steps = [
    { num: 1, label: "Data Pribadi" },
    { num: 2, label: "Upload Dokumen" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <DashboardBreadcrumb items={[{ label: "Verifikasi KYC" }]} />
      <div className="w-full px-6 py-8">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Form (70%) */}
          <div className="lg:w-[70%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">Verifikasi KYC</h1>
              <p className="text-muted-foreground text-sm">Verifikasi identitas Anda untuk mulai menggunakan platform</p>
            </motion.div>

            {/* Status banners */}
            {(kycStatus === "verified" || kycStatus === "approved") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-card-foreground mb-1">Identitas Terverifikasi</h2>
                <p className="text-sm text-muted-foreground">Akun Anda telah terverifikasi. Anda dapat menggunakan semua fitur platform.</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard")}>Ke Dashboard</Button>
              </motion.div>
            )}

            {kycStatus === "pending" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center mb-6">
                <Clock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-card-foreground mb-1">Menunggu Verifikasi</h2>
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
                  <h2 className="text-lg font-semibold text-card-foreground mb-1">Verifikasi Ditolak</h2>
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

            {/* Form */}
            {(kycStatus === "unverified" || kycStatus === "rejected") && (
              <>
                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-6">
                  {steps.map((s, i) => (
                    <div key={s.num} className="flex items-center gap-3">
                      <button
                        onClick={() => { if (s.num < step) setStep(s.num); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          step === s.num
                            ? "bg-primary text-primary-foreground"
                            : step > s.num
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : <span>{s.num}</span>}
                        {s.label}
                      </button>
                      {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Personal Data */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground mb-1">Data Pribadi</h2>
                      <p className="text-sm text-muted-foreground">Isi data sesuai dengan dokumen identitas Anda</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <Label className="text-card-foreground">Nama Lengkap (sesuai KTP) *</Label>
                        <div className="relative mt-1.5">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Nama lengkap sesuai dokumen" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label className="text-card-foreground">Nomor Identitas (NIK/Paspor) *</Label>
                        <div className="relative mt-1.5">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="3171XXXXXXXXXXXX" value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))} />
                        </div>
                      </div>

                      <div>
                        <Label className="text-card-foreground">Nomor Telepon</Label>
                        <Input className="mt-1.5" placeholder="+62 812-XXXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">Tempat Lahir *</Label>
                        <Input className="mt-1.5" placeholder="Jakarta" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">Tanggal Lahir *</Label>
                        <div className="relative mt-1.5">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-card-foreground">Jenis Kelamin *</Label>
                        <div className="grid grid-cols-2 gap-3 mt-1.5">
                          <button type="button" onClick={() => setGender("male")} className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${gender === "male" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                            Laki-laki
                          </button>
                          <button type="button" onClick={() => setGender("female")} className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${gender === "female" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                            Perempuan
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-card-foreground">Alamat Lengkap *</Label>
                        <Textarea className="mt-1.5" rows={2} placeholder="Jl. Contoh No. 123, RT 01/RW 02, Kel. ..." value={address} onChange={(e) => setAddress(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">Kota/Kabupaten *</Label>
                        <div className="relative mt-1.5">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Jakarta Selatan" value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label className="text-card-foreground">Provinsi</Label>
                        <Input className="mt-1.5" placeholder="DKI Jakarta" value={province} onChange={(e) => setProvince(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">Kode Pos</Label>
                        <Input className="mt-1.5" placeholder="12345" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))} />
                      </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleNext}>
                      Lanjut ke Upload Dokumen
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Upload Documents */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-card-foreground mb-1">Upload Dokumen</h2>
                      <p className="text-sm text-muted-foreground">Lengkapi dokumen berikut untuk verifikasi identitas</p>
                    </div>

                    <div>
                      <Label className="text-card-foreground">Tipe Dokumen Identitas</Label>
                      <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
                        {docTypes.map((dt) => (<option key={dt.value} value={dt.value}>{dt.label}</option>))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-card-foreground">Upload Dokumen Identitas *</Label>
                      <p className="text-xs text-muted-foreground mb-2">Foto atau scan dokumen yang jelas dan terbaca. Format: JPG, PNG, PDF. Maks 5MB.</p>
                      <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                      {primaryFile && <span className="flex items-center gap-1.5 mt-2 text-sm text-primary"><FileText className="w-4 h-4" />{primaryFile.name}</span>}
                    </div>

                    <div>
                      <Label className="text-card-foreground">Foto Selfie dengan Dokumen *</Label>
                      <p className="text-xs text-muted-foreground mb-2">Foto diri Anda memegang dokumen identitas di samping wajah Anda.</p>
                      <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                      {selfieFile && <span className="flex items-center gap-1.5 mt-2 text-sm text-primary"><FileText className="w-4 h-4" />{selfieFile.name}</span>}
                    </div>

                    <div>
                      <Label className="text-card-foreground">Dokumen Pendukung (opsional)</Label>
                      <p className="text-xs text-muted-foreground mb-2">NPWP, SKCK, atau dokumen pendukung lainnya.</p>
                      <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setSupportFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                      {supportFile && <span className="flex items-center gap-1.5 mt-2 text-sm text-primary"><FileText className="w-4 h-4" />{supportFile.name}</span>}
                    </div>

                    <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                      <p className="font-medium text-card-foreground">Informasi Penting:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        <li>Dokumen akan diverifikasi dalam 1-3 hari kerja</li>
                        <li>Pastikan dokumen asli, tidak buram, dan masih berlaku</li>
                        <li>Data Anda akan dijaga kerahasiaannya</li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">Kembali</Button>
                      <Button className="flex-1" size="lg" onClick={handleSubmit} disabled={submitting}>
                        <Upload className="w-4 h-4" />
                        {submitting ? "Mengunggah..." : "Kirim Verifikasi"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Right: Summary sidebar (30%) */}
          <div className="lg:w-[30%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">Status KYC</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    kycStatus === "verified" ? "bg-primary/10 text-primary" :
                    kycStatus === "pending" ? "bg-amber-500/10 text-amber-600" :
                    kycStatus === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {kycStatus === "verified" ? "Terverifikasi" :
                     kycStatus === "pending" ? "Menunggu Review" :
                     kycStatus === "rejected" ? "Ditolak" : "Belum Verifikasi"}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Nama Lengkap</p>
                  <p className="text-card-foreground font-medium">{fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Nomor Identitas</p>
                  <p className="text-card-foreground font-medium">{nik ? nik.replace(/(\d{4})(?=\d)/g, "$1-") : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Tempat, Tanggal Lahir</p>
                  <p className="text-card-foreground font-medium">
                    {birthPlace && birthDate ? `${birthPlace}, ${new Date(birthDate).toLocaleDateString("id-ID")}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Alamat</p>
                  <p className="text-card-foreground font-medium">{address ? `${address}, ${city}` : "—"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <p className="text-muted-foreground text-xs font-medium">Dokumen</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${primaryFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {primaryFile ? "✓" : "1"}
                    </div>
                    <span className={`text-xs ${primaryFile ? "text-card-foreground" : "text-muted-foreground"}`}>
                      {primaryFile ? primaryFile.name : "Dokumen Identitas"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${selfieFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {selfieFile ? "✓" : "2"}
                    </div>
                    <span className={`text-xs ${selfieFile ? "text-card-foreground" : "text-muted-foreground"}`}>
                      {selfieFile ? selfieFile.name : "Foto Selfie"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${supportFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {supportFile ? "✓" : "3"}
                    </div>
                    <span className={`text-xs ${supportFile ? "text-card-foreground" : "text-muted-foreground"}`}>
                      {supportFile ? supportFile.name : "Dokumen Pendukung (opsional)"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;
