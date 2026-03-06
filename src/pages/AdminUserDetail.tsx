import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, MapPin, Phone, Globe, Linkedin, Briefcase,
  Calendar, Shield, Star, GraduationCap, Clock, Pencil, Save, X, Camera,
  Award, Heart, CreditCard, Building2, Users, Download, Loader2,
} from "lucide-react";
import { renderCvToPdf } from "@/lib/cv-pdf-helper";
import {
  EducationEditor, ExperienceEditor, OrganizationEditor,
  CertificationEditor, TrainingEditor, AwardEditor,
} from "@/components/admin/AdminUserSectionEditors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
import { CitySelect } from "@/components/ui/city-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface SkillScore {
  name: string;
  score: number;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  subdistrict: string | null;
  province: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string | null;
  phone_number: string | null;
  skills: string[] | null;
  soft_skills: SkillScore[] | null;
  technical_skills: SkillScore[] | null;
  kyc_status: string;
  account_type: string;
  oveercode: string;
  years_of_experience: number | null;
  daily_rate: number | null;
  linkedin_url: string | null;
  website_url: string | null;
  opportunity_availability: string | null;
  professional_summary: string | null;
  highest_education: string | null;
  created_at: string;
  last_online: string | null;
}

const calcProfileCompleteness = (p: Profile, expCount: number, eduCount: number): number => {
  let score = 0;
  const total = 14;
  if (p.full_name) score++;
  if (p.avatar_url) score++;
  if (p.phone_number) score++;
  if (p.skills && p.skills.length > 0) score++;
  if (p.years_of_experience != null && p.years_of_experience > 0) score++;
  if (p.highest_education) score++;
  if (p.bio || p.professional_summary) score++;
  if (p.city || p.country) score++;
  if (p.linkedin_url || p.website_url) score++;
  if (p.kyc_status === 'approved' || p.kyc_status === 'verified') score++;
  if ((p as any).date_of_birth) score++;
  if ((p as any).nationality) score++;
  if (expCount > 0) score++;
  if (eduCount > 0) score++;
  return Math.round((score / total) * 100);
};

const formatLastOnline = (d: string | null): string => {
  if (!d) return "Belum pernah";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Online sekarang";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

interface UserRole {
  role: string;
}

const SkillRadarView = ({ skills, color, fillColor }: { skills: SkillScore[]; color: string; fillColor: string }) => {
  if (skills.length === 0) return <p className="text-sm text-muted-foreground">Belum ada data skill</p>;
  const sorted = [...skills].sort((a, b) => b.score - a.score);
  const radarData = sorted.slice(0, 6);
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Radar dataKey="score" stroke={color} fill={fillColor} fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
      {sorted.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Semua skill ({sorted.length})</p>
          <div className="flex flex-wrap gap-2">
            {sorted.map((s) => (
              <span key={s.name} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {s.name} <span className="font-semibold">{s.score}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SkillRadarEditor = ({ skills, onChange }: { skills: SkillScore[]; onChange: (v: SkillScore[]) => void }) => {
  const [newName, setNewName] = useState("");
  const [newScore, setNewScore] = useState(10);

  const add = () => {
    const n = newName.trim();
    if (n && !skills.some((s) => s.name === n)) {
      onChange([...skills, { name: n, score: Math.min(100, Math.max(0, newScore)) }]);
      setNewName("");
      setNewScore(50);
    }
  };

  const remove = (name: string) => onChange(skills.filter((s) => s.name !== name));
  const updateScore = (name: string, score: number) =>
    onChange(skills.map((s) => (s.name === name ? { ...s, score: Math.min(100, Math.max(0, score)) } : s)));
  const updateName = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || (trimmed !== oldName && skills.some((s) => s.name === trimmed))) return;
    onChange(skills.map((s) => (s.name === oldName ? { ...s, name: trimmed } : s)));
  };

  return (
    <div className="space-y-3">
      {skills.length > 0 && (
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={skills} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      )}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {skills.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <Input
              className="flex-1 h-8 text-sm"
              defaultValue={s.name}
              onBlur={(e) => updateName(s.name, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
            />
            <Input
              type="number"
              min={0}
              max={100}
              className="w-20 h-8 text-sm"
              value={s.score}
              onChange={(e) => updateScore(s.name, Number(e.target.value))}
            />
            <button onClick={() => remove(s.name)} className="text-muted-foreground hover:text-destructive text-lg leading-none">&times;</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Nama skill..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 h-9"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <Input type="number" min={0} max={100} value={newScore} onChange={(e) => setNewScore(Number(e.target.value))} className="w-16 h-9" />
        <Button variant="outline" size="sm" onClick={add}>+</Button>
      </div>
      <p className="text-xs text-muted-foreground">Skor 0–100</p>
    </div>
  );
};

const AdminUserDetail = () => {
  const { oveercode: paramCode } = useParams<{ oveercode: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [downloadingCV, setDownloadingCV] = useState(false);

  // Related data
  const [education, setEducation] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [creditScores, setCreditScores] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);

  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && paramCode) checkAdminAndFetch();
  }, [user, paramCode]);

  const checkAdminAndFetch = async () => {
    const { data: adminData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .in("role", ["admin", "superadmin"]);

    if (!adminData || adminData.length === 0) {
      navigate("/dashboard");
      return;
    }
    setIsSuperadmin(adminData.some((r: any) => r.role === "superadmin"));

    // Resolve oveercode to user_id
    const { data: profileLookup } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("oveercode", paramCode!)
      .single();

    if (!profileLookup) {
      toast.error("User tidak ditemukan");
      navigate("/admin");
      return;
    }
    const userId = profileLookup.user_id;
    setResolvedUserId(userId);

    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, headline, bio, avatar_url, address, city, district, subdistrict, province, country, postal_code, latitude, longitude, formatted_address, phone_number, skills, soft_skills, technical_skills, kyc_status, account_type, oveercode, years_of_experience, daily_rate, linkedin_url, website_url, opportunity_availability, professional_summary, highest_education, created_at, last_online, date_of_birth, nationality")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId),
    ]);

    if (profileRes.data) {
      const p = profileRes.data as any;
      p.soft_skills = Array.isArray(p.soft_skills) ? p.soft_skills : [];
      p.technical_skills = Array.isArray(p.technical_skills) ? p.technical_skills : [];
      setProfile(p as Profile);
      setEditData({ ...p } as Profile);
    }
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);

    // Fetch related data in parallel
    const [eduRes, expRes, orgRes, certRes, trainRes, awardRes, creditRes, medRes] = await Promise.all([
      supabase.from("user_education").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      supabase.from("user_experiences").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      supabase.from("user_organizations").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      supabase.from("user_certifications").select("*").eq("user_id", userId).order("issue_date", { ascending: false }),
      supabase.from("user_trainings").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
      supabase.from("user_awards").select("*").eq("user_id", userId).order("date_received", { ascending: false }),
      supabase.from("user_credit_scores").select("*").eq("user_id", userId).order("report_date", { ascending: false }),
      supabase.from("user_medical_records").select("*").eq("user_id", userId).order("record_date", { ascending: false }),
    ]);

    if (eduRes.data) setEducation(eduRes.data);
    if (expRes.data) setExperiences(expRes.data);
    if (orgRes.data) setOrganizations(orgRes.data);
    if (certRes.data) setCertifications(certRes.data);
    if (trainRes.data) setTrainings(trainRes.data);
    if (awardRes.data) setAwards(awardRes.data);
    if (creditRes.data) setCreditScores(creditRes.data);
    if (medRes.data) setMedicalRecords(medRes.data);

    setLoading(false);
  };

  const assignRole = async (role: string) => {
    const { error } = await (supabase.from("user_roles") as any).upsert(
      { user_id: profile?.user_id, role },
      { onConflict: "user_id,role" }
    );
    if (error) toast.error("Gagal assign role: " + error.message);
    else {
      toast.success(`Role '${role}' berhasil ditambahkan`);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", profile?.user_id!);
      if (data) setRoles(data as UserRole[]);
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "";

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editData.full_name,
        headline: editData.headline,
        bio: editData.bio,
        address: editData.address,
        city: editData.city,
        district: editData.district,
        subdistrict: editData.subdistrict,
        province: editData.province,
        country: editData.country,
        postal_code: editData.postal_code,
        latitude: editData.latitude,
        longitude: editData.longitude,
        formatted_address: editData.formatted_address,
        phone_number: editData.phone_number,
        skills: editData.skills,
        soft_skills: editData.soft_skills as any,
        technical_skills: editData.technical_skills as any,
        kyc_status: editData.kyc_status,
        account_type: editData.account_type,
        daily_rate: editData.daily_rate,
        linkedin_url: editData.linkedin_url,
        website_url: editData.website_url,
        opportunity_availability: editData.opportunity_availability,
        professional_summary: editData.professional_summary,
        highest_education: editData.highest_education,
      } as any)
      .eq("user_id", profile?.user_id!);

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Profil berhasil diperbarui");
      setEditing(false);
      checkAdminAndFetch();
    }
    setSaving(false);
  };

  const set = (key: string, value: any) => setEditData((prev) => ({ ...prev, [key]: value }));

  const handleDownloadCV = async (includeContact: boolean) => {
    setDownloadingCV(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sesi kadaluarsa, silakan login ulang"); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cv`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: profile?.user_id, include_contact: includeContact }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal generate CV" }));
        throw new Error(err.error || "Gagal generate CV");
      }

      const html = await res.text();
      const userName = profile?.full_name?.replace(/[^a-zA-Z0-9]/g, "_") || "CV";
      const contactLabel = includeContact ? "with_contact" : "without_contact";

      const ok = renderCvToPdf({
        html,
        fileName: `CV_${userName}_${contactLabel}.pdf`,
      });
      if (!ok) throw new Error("Pop-up diblokir atau gagal membuka preview");
    } catch (err: any) {
      toast.error(err.message || "Gagal download CV");
    } finally {
      setDownloadingCV(false);
    }
  };


  const kycColor = (s: string) => {
    if (s === "approved" || s === "verified") return "text-primary bg-primary/10";
    if (s === "pending") return "text-amber-600 bg-amber-500/10";
    if (s === "rejected") return "text-destructive bg-destructive/10";
    return "text-muted-foreground bg-muted";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">User tidak ditemukan</h1>
          <Button onClick={() => navigate("/admin")}>Kembali ke Admin</Button>
        </div>
      </div>
    );
  }

  const location = [profile.address, profile.subdistrict, profile.district, profile.city, profile.province, profile.country, profile.postal_code].filter(Boolean).join(", ") || profile.formatted_address;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Admin
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Detail User</span>
          </div>
          {!editing && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={downloadingCV}>
                    {downloadingCV ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                    Download CV
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownloadCV(true)}>
                    Download CV (With Contact)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadCV(false)}>
                    Download CV (Without Contact)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isSuperadmin && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit Profil
                </Button>
              )}
            </div>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditData(profile); }}>
                <X className="w-4 h-4 mr-1" /> Batal
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" /> {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
            <div className="flex items-start gap-5">
              <div className="relative group w-28 h-28 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-28 h-28 rounded-2xl object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
                {editing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          set("avatar_url", url);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {editing ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
                          <Input value={editData.full_name || ""} onChange={(e) => set("full_name", e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Headline</Label>
                          <Input value={editData.headline || ""} onChange={(e) => set("headline", e.target.value)} className="mt-1" />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Account Type</Label>
                            <Select value={editData.account_type || "personal"} onValueChange={(v) => set("account_type", v)}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">KYC Status</Label>
                            <Select value={editData.kyc_status || "unverified"} onValueChange={(v) => set("kyc_status", v)}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unverified">Unverified</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-foreground">{profile.full_name || "—"}</h1>
                        {profile.headline && <p className="text-muted-foreground mt-0.5">{profile.headline}</p>}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{profile.oveercode}</span>
                          <Badge variant="secondary">{profile.account_type}</Badge>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${kycColor(profile.kyc_status)}`}>
                            KYC: {profile.kyc_status}
                          </span>
                          {(() => {
                            const pScore = calcProfileCompleteness(profile, experiences.length, education.length);
                            const scoreColor = pScore >= 70 ? "text-primary bg-primary/10" : pScore >= 40 ? "text-amber-600 bg-amber-500/10" : "text-destructive bg-destructive/10";
                            return (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor}`}>
                                Profil: {pScore}%
                              </span>
                            );
                          })()}
                          {roles.map((r) => (
                            <span key={r.role} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                              <Shield className="w-3 h-3" /> {r.role}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Last online: {formatLastOnline(profile.last_online)}</span>
                          {profile.last_online && Date.now() - new Date(profile.last_online).getTime() < 300000 && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {!editing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Shield className="w-4 h-4 mr-1" /> Role
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => assignRole("admin")}>Jadikan Admin</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => assignRole("instructor")}>Jadikan Instructor</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => assignRole("user")}>Set User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio / Summary */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-3">Tentang</h2>
                {editing ? (
                  <Textarea
                    rows={5}
                    value={editData.professional_summary || editData.bio || ""}
                    onChange={(e) => set("professional_summary", e.target.value)}
                    placeholder="Ringkasan profesional..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.professional_summary || profile.bio || "—"}
                  </p>
                )}
              </div>

              {/* Skill Radar Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Soft Skills Radar */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4">Soft Skills</h2>
                  {editing ? (
                    <SkillRadarEditor
                      skills={editData.soft_skills || []}
                      onChange={(v) => set("soft_skills", v)}
                    />
                  ) : (
                    <SkillRadarView skills={profile.soft_skills || []} color="hsl(var(--primary))" fillColor="hsl(var(--primary) / 0.3)" />
                  )}
                </div>

                {/* Technical Skills Radar */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4">Technical Skills</h2>
                  {editing ? (
                    <SkillRadarEditor
                      skills={editData.technical_skills || []}
                      onChange={(v) => set("technical_skills", v)}
                    />
                  ) : (
                    <SkillRadarView skills={profile.technical_skills || []} color="hsl(262, 80%, 60%)" fillColor="hsl(262, 80%, 60%, 0.3)" />
                  )}
                </div>
              </div>

              {/* Education Background */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Education Background
                </h2>
                {isSuperadmin ? (
                  <EducationEditor userId={profile.user_id} items={education} setItems={setEducation} />
                ) : education.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data</p>
                ) : (
                  <div className="space-y-4">
                    {education.map((e) => (
                      <div key={e.id} className="border-l-2 border-primary/30 pl-4">
                        <p className="text-sm font-medium text-card-foreground">{e.degree} — {e.field_of_study}</p>
                        <p className="text-xs text-muted-foreground">{e.institution}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.start_date)} – {e.end_date ? formatDate(e.end_date) : "Sekarang"}</p>
                        {e.status !== "approved" && <Badge variant="outline" className="text-xs mt-1">{e.status}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
                <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Experience
                </h2>
                {experiences.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data</p>
                ) : (
                  <div className="space-y-4">
                    {experiences.map((e) => (
                      <div key={e.id} className="border-l-2 border-primary/30 pl-4">
                        <p className="text-sm font-medium text-card-foreground">{e.position}</p>
                        <p className="text-xs text-muted-foreground">{e.company}{e.location ? ` • ${e.location}` : ""}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.start_date)} – {e.is_current ? "Sekarang" : formatDate(e.end_date)}</p>
                        {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Organization Experience */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Organization Experience
                </h2>
                {organizations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data</p>
                ) : (
                  <div className="space-y-4">
                    {organizations.map((o) => (
                      <div key={o.id} className="border-l-2 border-primary/30 pl-4">
                        <p className="text-sm font-medium text-card-foreground">{o.role}</p>
                        <p className="text-xs text-muted-foreground">{o.organization_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(o.start_date)} – {o.is_current ? "Sekarang" : formatDate(o.end_date)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications & Training/Workshop - side by side */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Certifications
                  </h2>
                  {certifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                  ) : (
                    <div className="space-y-3">
                      {certifications.map((c) => (
                        <div key={c.id} className="border-l-2 border-primary/30 pl-3">
                          <p className="text-sm font-medium text-card-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.issuing_organization}</p>
                          {c.issue_date && <p className="text-xs text-muted-foreground">{formatDate(c.issue_date)}{c.expiry_date ? ` – ${formatDate(c.expiry_date)}` : ""}</p>}
                          {c.credential_url && <a href={c.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Lihat Kredensial</a>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Training & Workshop
                  </h2>
                  {trainings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                  ) : (
                    <div className="space-y-3">
                      {trainings.map((t) => (
                        <div key={t.id} className="border-l-2 border-primary/30 pl-3">
                          <p className="text-sm font-medium text-card-foreground">{t.title}</p>
                          {t.organizer && <p className="text-xs text-muted-foreground">{t.organizer}</p>}
                          <p className="text-xs text-muted-foreground">{formatDate(t.start_date)}{t.end_date ? ` – ${formatDate(t.end_date)}` : ""}</p>
                          {t.training_type && <Badge variant="outline" className="text-xs mt-1">{t.training_type}</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Awards */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Awards
                </h2>
                {awards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {awards.map((a) => (
                      <div key={a.id} className="border border-border rounded-xl p-3">
                        <p className="text-sm font-medium text-card-foreground">{a.title}</p>
                        {a.issuer && <p className="text-xs text-muted-foreground">{a.issuer}</p>}
                        {a.date_received && <p className="text-xs text-muted-foreground">{formatDate(a.date_received)}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Credit Score & Medical History - side by side */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Credit Score
                  </h2>
                  {creditScores.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                  ) : (
                    <div className="space-y-3">
                      {creditScores.map((c) => (
                        <div key={c.id} className="border border-border rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-card-foreground">{c.provider_name}</p>
                            {c.score_value != null && (
                              <span className="text-lg font-bold text-primary">{c.score_value}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{c.score_type}{c.score_grade ? ` • Grade: ${c.score_grade}` : ""}</p>
                          {c.report_date && <p className="text-xs text-muted-foreground">{formatDate(c.report_date)}</p>}
                          <Badge variant="outline" className="text-xs mt-1">{c.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Medical History
                  </h2>
                  {medicalRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                  ) : (
                    <div className="space-y-3">
                      {medicalRecords.map((m) => (
                        <div key={m.id} className="border border-border rounded-xl p-3">
                          <p className="text-sm font-medium text-card-foreground">{m.title}</p>
                          <p className="text-xs text-muted-foreground">{m.record_type}{m.provider ? ` • ${m.provider}` : ""}</p>
                          {m.record_date && <p className="text-xs text-muted-foreground">{formatDate(m.record_date)}</p>}
                          <Badge variant="outline" className="text-xs mt-1">{m.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-4">Informasi</h2>
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Alamat</Label>
                      <Input className="mt-1" value={editData.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="Jl. Contoh No. 123" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Kelurahan</Label>
                        <Input className="mt-1" value={editData.subdistrict || ""} onChange={(e) => set("subdistrict", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Kecamatan</Label>
                        <Input className="mt-1" value={editData.district || ""} onChange={(e) => set("district", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Kota</Label>
                        <CitySelect className="mt-1" value={editData.city || ""} onChange={(v) => set("city", v)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Provinsi</Label>
                        <Input className="mt-1" value={editData.province || ""} onChange={(e) => set("province", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Negara</Label>
                        <CountrySelect className="mt-1" value={editData.country || ""} onChange={(v) => set("country", v)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Kode Pos</Label>
                        <Input className="mt-1" value={editData.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Latitude</Label>
                        <Input className="mt-1" type="number" step="any" value={editData.latitude ?? ""} onChange={(e) => set("latitude", e.target.value ? Number(e.target.value) : null)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Longitude</Label>
                        <Input className="mt-1" type="number" step="any" value={editData.longitude ?? ""} onChange={(e) => set("longitude", e.target.value ? Number(e.target.value) : null)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">No. Telepon</Label>
                      <PhoneInput className="mt-1" value={editData.phone_number || ""} onChange={(v) => set("phone_number", v)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">LinkedIn URL</Label>
                      <Input className="mt-1" value={editData.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Website URL</Label>
                      <Input className="mt-1" value={editData.website_url || ""} onChange={(e) => set("website_url", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Daily Rate (IDR)</Label>
                      <Input className="mt-1" type="number" value={editData.daily_rate ?? ""} onChange={(e) => set("daily_rate", e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ketersediaan</Label>
                      <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.opportunity_availability || ""} onChange={(e) => set("opportunity_availability", e.target.value)}>
                        <option value="">—</option>
                        <option value="available">Available</option>
                        <option value="open">Open</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {location && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> <span>{location}</span>
                      </div>
                    )}
                    {/* OpenStreetMap */}
                    {profile.latitude && profile.longitude && (
                      <div className="rounded-xl overflow-hidden border border-border h-48">
                        <iframe
                          title="Location Map"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${profile.longitude - 0.01},${profile.latitude - 0.01},${profile.longitude + 0.01},${profile.latitude + 0.01}&layer=mapnik&marker=${profile.latitude},${profile.longitude}`}
                        />
                      </div>
                    )}
                    {profile.phone_number && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 shrink-0" /> {profile.phone_number}
                      </div>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Linkedin className="w-4 h-4 shrink-0" /> LinkedIn
                      </a>
                    )}
                    {profile.website_url && (
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Globe className="w-4 h-4 shrink-0" /> Website
                      </a>
                    )}
                    {profile.years_of_experience != null && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="w-4 h-4 shrink-0" /> {profile.years_of_experience} tahun pengalaman
                      </div>
                    )}
                    {profile.daily_rate != null && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="w-4 h-4 shrink-0" /> Rp {profile.daily_rate.toLocaleString("id-ID")}/hari
                      </div>
                    )}
                    {profile.opportunity_availability && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" /> {profile.opportunity_availability}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0" /> Bergabung {new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
