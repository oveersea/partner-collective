import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, MapPin, Phone, Globe, Linkedin, Briefcase,
  Calendar, Shield, Star, GraduationCap, Clock, Pencil, Save, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  phone_number: string | null;
  skills: string[] | null;
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
}

interface UserRole {
  role: string;
}

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkAdminAndFetch();
  }, [user, userId]);

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

    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, full_name, headline, bio, avatar_url, city, country, phone_number, skills, kyc_status, account_type, oveercode, years_of_experience, daily_rate, linkedin_url, website_url, opportunity_availability, professional_summary, highest_education, created_at")
        .eq("user_id", userId!)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as Profile);
      setEditData(profileRes.data as Profile);
    }
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    setLoading(false);
  };

  const assignRole = async (role: string) => {
    const { error } = await (supabase.from("user_roles") as any).upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" }
    );
    if (error) toast.error("Gagal assign role: " + error.message);
    else {
      toast.success(`Role '${role}' berhasil ditambahkan`);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (data) setRoles(data as UserRole[]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editData.full_name,
        headline: editData.headline,
        bio: editData.bio,
        city: editData.city,
        country: editData.country,
        phone_number: editData.phone_number,
        skills: editData.skills,
        kyc_status: editData.kyc_status,
        account_type: editData.account_type,
        daily_rate: editData.daily_rate,
        linkedin_url: editData.linkedin_url,
        website_url: editData.website_url,
        opportunity_availability: editData.opportunity_availability,
        professional_summary: editData.professional_summary,
        highest_education: editData.highest_education,
      })
      .eq("user_id", userId!);

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

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !(editData.skills || []).includes(s)) {
      set("skills", [...(editData.skills || []), s]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    set("skills", (editData.skills || []).filter((s) => s !== skill));
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

  const location = [profile.city, profile.country].filter(Boolean).join(", ");

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
          {isSuperadmin && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit Profil
            </Button>
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
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
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
                            <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.account_type || "personal"} onChange={(e) => set("account_type", e.target.value)}>
                              <option value="personal">Personal</option>
                              <option value="business">Business</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">KYC Status</Label>
                            <select className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.kyc_status || "unverified"} onChange={(e) => set("kyc_status", e.target.value)}>
                              <option value="unverified">Unverified</option>
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
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
                          {roles.map((r) => (
                            <span key={r.role} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                              <Shield className="w-3 h-3" /> {r.role}
                            </span>
                          ))}
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

              {/* Skills */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-3">Skills</h2>
                {editing ? (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Tambah skill..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                      <Button variant="outline" size="sm" onClick={addSkill}>Tambah</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(editData.skills || []).map((s) => (
                        <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                          {s}
                          <button onClick={() => removeSkill(s)} className="hover:text-destructive ml-1">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile.skills || []).length > 0 ? profile.skills!.map((s) => (
                      <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                    )) : <p className="text-sm text-muted-foreground">—</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-4">Informasi</h2>
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Kota</Label>
                      <Input className="mt-1" value={editData.city || ""} onChange={(e) => set("city", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Negara</Label>
                      <Input className="mt-1" value={editData.country || ""} onChange={(e) => set("country", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">No. Telepon</Label>
                      <Input className="mt-1" value={editData.phone_number || ""} onChange={(e) => set("phone_number", e.target.value)} />
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
                      <Label className="text-xs text-muted-foreground">Pendidikan Tertinggi</Label>
                      <Input className="mt-1" value={editData.highest_education || ""} onChange={(e) => set("highest_education", e.target.value)} />
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
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" /> {location}
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
                    {profile.highest_education && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="w-4 h-4 shrink-0" /> {profile.highest_education}
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
