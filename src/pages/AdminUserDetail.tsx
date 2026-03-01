import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Mail, MapPin, Phone, Globe, Linkedin, Briefcase,
  Calendar, Shield, Star, GraduationCap, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
    setIsAdmin(true);

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

    if (profileRes.data) setProfile(profileRes.data as Profile);
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
        <div className="container mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Admin
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">Detail User</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
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
                  </div>
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
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {(profile.professional_summary || profile.bio) && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-3">Tentang</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.professional_summary || profile.bio}
                  </p>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h2 className="text-sm font-semibold text-card-foreground mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s) => (
                      <span key={s} className="text-sm px-3 py-1.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-sm font-semibold text-card-foreground mb-4">Informasi</h2>
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
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
