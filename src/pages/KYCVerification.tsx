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
  { value: "ktp", label: "National ID Card (KTP)" },
  { value: "passport", label: "Passport" },
  { value: "sim", label: "Driver's License (SIM)" },
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
      toast.success("Your identity is already verified");
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
    if (!fullName.trim()) { toast.error("Full name is required"); return false; }
    if (!nik.trim() || nik.length < 10) { toast.error("ID number is required (min. 10 digits)"); return false; }
    if (!birthDate) { toast.error("Date of birth is required"); return false; }
    if (!gender) { toast.error("Gender is required"); return false; }
    if (!address.trim()) { toast.error("Address is required"); return false; }
    if (!city.trim()) { toast.error("City is required"); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!primaryFile || !selfieFile) {
      toast.error("ID document and selfie photo are required");
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
        support_doc1_label: "Selfie with Document",
        support_doc2_file_name: support?.name || "",
        support_doc2_file_url: support?.url || "",
        support_doc2_label: support ? "Supporting Document" : "",
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

      toast.success("KYC documents submitted successfully! We will verify within 1-3 business days.");
      setKycStatus("pending");
      fetchKycStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit documents");
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
    { num: 1, label: "Personal Data" },
    { num: 2, label: "Upload Documents" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
       <DashboardBreadcrumb items={[{ label: "KYC Verification" }]} />
      <div className="w-full px-6 py-8">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Form (70%) */}
          <div className="lg:w-[70%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">KYC Verification</h1>
              <p className="text-muted-foreground text-sm">Verify your identity to start using the platform</p>
            </motion.div>

            {/* Status banners */}
            {(kycStatus === "verified" || kycStatus === "approved") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-card-foreground mb-1">Identity Verified</h2>
                <p className="text-sm text-muted-foreground">Your account has been verified. You can use all platform features.</p>
                <Button className="mt-4" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
              </motion.div>
            )}

            {kycStatus === "pending" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center mb-6">
                <Clock className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-card-foreground mb-1">Pending Verification</h2>
                <p className="text-sm text-muted-foreground">Your documents are being reviewed. Verification takes 1-3 business days.</p>
                {submission && (
                  <div className="mt-4 bg-card rounded-xl p-4 border border-border text-left">
                    <p className="text-xs text-muted-foreground">Primary document</p>
                    <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {submission.primary_doc_file_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted {new Date(submission.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {kycStatus === "rejected" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-6">
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                   <h2 className="text-lg font-semibold text-card-foreground mb-1">Verification Rejected</h2>
                  <p className="text-sm text-muted-foreground">Your documents did not meet the requirements. Please resubmit.</p>
                </div>
                {submission?.rejection_reason && (
                  <div className="mt-4 bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Rejection reason:</p>
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
                     <h2 className="text-lg font-semibold text-card-foreground mb-1">Personal Data</h2>
                      <p className="text-sm text-muted-foreground">Fill in the data according to your identity document</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <Label className="text-card-foreground">Full Name (as per ID) *</Label>
                        <div className="relative mt-1.5">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Full name as per document" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label className="text-card-foreground">ID Number (NIK/Passport) *</Label>
                        <div className="relative mt-1.5">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="3171XXXXXXXXXXXX" value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))} />
                        </div>
                      </div>

                      <div>
                        <Label className="text-card-foreground">Phone Number</Label>
                        <Input className="mt-1.5" placeholder="+62 812-XXXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">Place of Birth *</Label>
                        <Input className="mt-1.5" placeholder="Jakarta" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">Date of Birth *</Label>
                        <div className="relative mt-1.5">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-card-foreground">Gender *</Label>
                        <div className="grid grid-cols-2 gap-3 mt-1.5">
                          <button type="button" onClick={() => setGender("male")} className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${gender === "male" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                            Male
                          </button>
                          <button type="button" onClick={() => setGender("female")} className={`p-3 rounded-xl border text-sm font-medium text-center transition-all ${gender === "female" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                            Female
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-card-foreground">Full Address *</Label>
                        <Textarea className="mt-1.5" rows={2} placeholder="Jl. Contoh No. 123, RT 01/RW 02, Kel. ..." value={address} onChange={(e) => setAddress(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">City *</Label>
                        <div className="relative mt-1.5">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Jakarta Selatan" value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label className="text-card-foreground">Province</Label>
                        <Input className="mt-1.5" placeholder="DKI Jakarta" value={province} onChange={(e) => setProvince(e.target.value)} />
                      </div>

                      <div>
                        <Label className="text-card-foreground">Postal Code</Label>
                        <Input className="mt-1.5" placeholder="12345" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))} />
                      </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleNext}>
                      Continue to Document Upload
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Upload Documents */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-card-foreground mb-1">Upload Documents</h2>
                      <p className="text-sm text-muted-foreground">Complete the following documents for identity verification</p>
                    </div>

                    <div>
                      <Label className="text-card-foreground">ID Document Type</Label>
                      <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
                        {docTypes.map((dt) => (<option key={dt.value} value={dt.value}>{dt.label}</option>))}
                      </select>
                    </div>

                    <div>
                       <Label className="text-card-foreground">Upload ID Document *</Label>
                      <p className="text-xs text-muted-foreground mb-2">Clear and readable photo or scan of your document. Format: JPG, PNG, PDF. Max 5MB.</p>
                      <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setPrimaryFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                      {primaryFile && <span className="flex items-center gap-1.5 mt-2 text-sm text-primary"><FileText className="w-4 h-4" />{primaryFile.name}</span>}
                    </div>

                    <div>
                       <Label className="text-card-foreground">Selfie with Document *</Label>
                      <p className="text-xs text-muted-foreground mb-2">Photo of yourself holding the ID document next to your face.</p>
                      <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                      {selfieFile && <span className="flex items-center gap-1.5 mt-2 text-sm text-primary"><FileText className="w-4 h-4" />{selfieFile.name}</span>}
                    </div>

                    <div>
                       <Label className="text-card-foreground">Supporting Document (optional)</Label>
                      <p className="text-xs text-muted-foreground mb-2">Tax ID, police clearance, or other supporting documents.</p>
                      <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setSupportFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                      {supportFile && <span className="flex items-center gap-1.5 mt-2 text-sm text-primary"><FileText className="w-4 h-4" />{supportFile.name}</span>}
                    </div>

                    <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                       <p className="font-medium text-card-foreground">Important Information:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        <li>Documents will be verified within 1-3 business days</li>
                        <li>Ensure documents are original, clear, and still valid</li>
                        <li>Your data will be kept confidential</li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                       <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">Back</Button>
                      <Button className="flex-1" size="lg" onClick={handleSubmit} disabled={submitting}>
                        <Upload className="w-4 h-4" />
                        {submitting ? "Uploading..." : "Submit Verification"}
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
                     {kycStatus === "verified" ? "Verified" :
                     kycStatus === "pending" ? "Pending Review" :
                     kycStatus === "rejected" ? "Rejected" : "Unverified"}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Full Name</p>
                  <p className="text-card-foreground font-medium">{fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">ID Number</p>
                  <p className="text-card-foreground font-medium">{nik ? nik.replace(/(\d{4})(?=\d)/g, "$1-") : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Place & Date of Birth</p>
                  <p className="text-card-foreground font-medium">
                    {birthPlace && birthDate ? `${birthPlace}, ${new Date(birthDate).toLocaleDateString("id-ID")}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Address</p>
                  <p className="text-card-foreground font-medium">{address ? `${address}, ${city}` : "—"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <p className="text-muted-foreground text-xs font-medium">Documents</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${primaryFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {primaryFile ? "✓" : "1"}
                    </div>
                    <span className={`text-xs ${primaryFile ? "text-card-foreground" : "text-muted-foreground"}`}>
                      {primaryFile ? primaryFile.name : "ID Document"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${selfieFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {selfieFile ? "✓" : "2"}
                    </div>
                    <span className={`text-xs ${selfieFile ? "text-card-foreground" : "text-muted-foreground"}`}>
                      {selfieFile ? selfieFile.name : "Selfie Photo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${supportFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {supportFile ? "✓" : "3"}
                    </div>
                    <span className={`text-xs ${supportFile ? "text-card-foreground" : "text-muted-foreground"}`}>
                      {supportFile ? supportFile.name : "Supporting Document (optional)"}
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
