import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  LogOut, User, MapPin, Briefcase, Globe, Shield,
  Phone, Calendar, Award, Edit3, Save, X
} from "lucide-react";

interface Profile {
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
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, headline, bio, avatar_url, city, country, phone_number, skills, kyc_status, account_type, oveercode, years_of_experience, daily_rate, linkedin_url, website_url, opportunity_availability, professional_summary, highest_education")
      .eq("user_id", user!.id)
      .single();

    if (error) {
      console.error(error);
      toast.error("Gagal memuat profil");
    } else {
      setProfile(data as Profile);
      setEditData(data as Profile);
    }
    setLoading(false);
  };

  const handleSave = async () => {
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
        daily_rate: editData.daily_rate,
        linkedin_url: editData.linkedin_url,
        website_url: editData.website_url,
        opportunity_availability: editData.opportunity_availability,
        professional_summary: editData.professional_summary,
        highest_education: editData.highest_education,
      })
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Gagal menyimpan profil");
    } else {
      toast.success("Profil berhasil disimpan");
      setEditing(false);
      fetchProfile();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const kycBadge = {
    verified: { label: "Terverifikasi", color: "bg-primary/10 text-primary border-primary/20" },
    pending: { label: "Menunggu Verifikasi", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    unverified: { label: "Belum Verifikasi", color: "bg-destructive/10 text-destructive border-destructive/20" },
  }[profile.kyc_status] || { label: profile.kyc_status, color: "bg-muted text-muted-foreground border-border" };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">PartnerHub</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Keluar
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-8 mb-6 shadow-card"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-card-foreground">
                    {profile.full_name || "Nama belum diisi"}
                  </h1>
                  <p className="text-muted-foreground">{profile.headline || "Headline belum diisi"}</p>
                </div>
                <Button
                  variant={editing ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (editing) {
                      setEditing(false);
                      setEditData(profile);
                    } else {
                      setEditing(true);
                    }
                  }}
                >
                  {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {editing ? "Batal" : "Edit"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${kycBadge.color}`}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  KYC: {kycBadge.label}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                  {profile.account_type === "business" ? "Client" : "Partner"}
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                  {profile.oveercode}
                </span>
              </div>

              {profile.city && (
                <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {profile.city}{profile.country ? `, ${profile.country}` : ""}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Edit/View Content */}
        {editing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-5">
              <h2 className="text-lg font-bold text-card-foreground">Informasi Dasar</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-card-foreground">Nama Lengkap</Label>
                  <Input className="mt-1.5" value={editData.full_name || ""} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Headline</Label>
                  <Input className="mt-1.5" placeholder="Misal: Full Stack Developer" value={editData.headline || ""} onChange={(e) => setEditData({ ...editData, headline: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Kota</Label>
                  <Input className="mt-1.5" value={editData.city || ""} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Negara</Label>
                  <Input className="mt-1.5" value={editData.country || ""} onChange={(e) => setEditData({ ...editData, country: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">No. Telepon</Label>
                  <Input className="mt-1.5" value={editData.phone_number || ""} onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Daily Rate (IDR)</Label>
                  <Input className="mt-1.5" type="number" value={editData.daily_rate || ""} onChange={(e) => setEditData({ ...editData, daily_rate: Number(e.target.value) || null })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Pendidikan Terakhir</Label>
                  <Input className="mt-1.5" value={editData.highest_education || ""} onChange={(e) => setEditData({ ...editData, highest_education: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Ketersediaan</Label>
                  <select
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={editData.opportunity_availability || ""}
                    onChange={(e) => setEditData({ ...editData, opportunity_availability: e.target.value })}
                  >
                    <option value="">Pilih</option>
                    <option value="available">Available</option>
                    <option value="open">Open to Opportunities</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Not Available</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-card-foreground">Ringkasan Profesional</Label>
                <Textarea className="mt-1.5" rows={3} value={editData.professional_summary || ""} onChange={(e) => setEditData({ ...editData, professional_summary: e.target.value })} />
              </div>

              <div>
                <Label className="text-card-foreground">Skills (pisahkan dengan koma)</Label>
                <Input
                  className="mt-1.5"
                  placeholder="React, TypeScript, Node.js"
                  value={editData.skills?.join(", ") || ""}
                  onChange={(e) => setEditData({ ...editData, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-card-foreground">LinkedIn URL</Label>
                  <Input className="mt-1.5" value={editData.linkedin_url || ""} onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })} />
                </div>
                <div>
                  <Label className="text-card-foreground">Website URL</Label>
                  <Input className="mt-1.5" value={editData.website_url || ""} onChange={(e) => setEditData({ ...editData, website_url: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => { setEditing(false); setEditData(profile); }}>Batal</Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Simpan Profil
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-8 shadow-card"
            >
              <h2 className="text-lg font-bold text-card-foreground mb-4">Tentang</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {profile.professional_summary || profile.bio || "Belum ada deskripsi."}
              </p>

              <div className="mt-6 space-y-3">
                {profile.phone_number && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-card-foreground">{profile.phone_number}</span>
                  </div>
                )}
                {profile.years_of_experience != null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-card-foreground">{profile.years_of_experience} tahun pengalaman</span>
                  </div>
                )}
                {profile.daily_rate != null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span className="text-card-foreground">Rp {profile.daily_rate?.toLocaleString("id-ID")}/hari</span>
                  </div>
                )}
                {profile.highest_education && (
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-card-foreground">{profile.highest_education}</span>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">LinkedIn</a>
                  </div>
                )}
                {profile.website_url && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{profile.website_url}</a>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl border border-border p-8 shadow-card"
            >
              <h2 className="text-lg font-bold text-card-foreground mb-4">Skills & Ketersediaan</h2>

              {profile.opportunity_availability && (
                <div className="mb-5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                  <div className="mt-2">
                    <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                      profile.opportunity_availability === "available"
                        ? "bg-primary/10 text-primary"
                        : profile.opportunity_availability === "open"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {profile.opportunity_availability === "available" ? "🟢 Available" :
                       profile.opportunity_availability === "open" ? "🔵 Open to Opportunities" :
                       profile.opportunity_availability === "busy" ? "🟡 Busy" : "⚫ Not Available"}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada skills ditambahkan.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
