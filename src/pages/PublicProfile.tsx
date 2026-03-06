import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin, Briefcase, GraduationCap, Award, Globe, Linkedin,
  CheckCircle2, Phone, Calendar, User, Lock, Languages, Heart, Unlock
} from "lucide-react";
import { toast } from "sonner";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface SkillScore { name: string; score: number; }

const SkillRadarView = ({ skills, color, fillColor, label }: { skills: SkillScore[]; color: string; fillColor: string; label: string }) => {
  if (skills.length === 0) return null;
  const sorted = [...skills].sort((a, b) => b.score - a.score);
  const radarData = sorted.slice(0, 6);
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Radar dataKey="score" stroke={color} fill={fillColor} fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {sorted.map((s) => (
          <Badge key={s.name} variant="outline" className="text-xs gap-1">
            {s.name} <span className="text-muted-foreground">{s.score}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

/* ── helpers ── */
const fmtDate = (d: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const fmtRange = (start: string | null, end: string | null, isCurrent: boolean) => {
  const s = fmtDate(start);
  const e = isCurrent ? "Present" : fmtDate(end);
  if (!s && !e) return "";
  return `${s} — ${e}`;
};

const _maskEmail = (email: string | null) => {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!domain) return "••••@••••";
  return `${user.slice(0, 2)}${"•".repeat(Math.max(user.length - 2, 3))}@${domain}`;
};

const maskPhone = (phone: string | null) => {
  if (!phone) return null;
  if (phone.length <= 6) return "••••••";
  return `${phone.slice(0, 4)}${"•".repeat(phone.length - 6)}${phone.slice(-2)}`;
};

const maskUrl = (url: string | null) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.hostname}/••••`;
  } catch {
    return "••••••";
  }
};

const genderLabel: Record<string, string> = { male: "Male", female: "Female" };
const maritalLabel: Record<string, string> = { single: "Single", married: "Married", divorced: "Divorced", widowed: "Widowed" };
const availabilityLabel: Record<string, string> = { available: "Available", open: "Open to Opportunities", busy: "Busy", unavailable: "Not Available", not_available: "Not Available" };

/* ── component ── */
const PublicProfile = () => {
  const { oveercode } = useParams<{ oveercode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["public-profile", oveercode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("oveercode", oveercode)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!oveercode,
  });

  const userId = profile?.user_id;

  // Check if current user has unlocked this profile's contact
  const { data: isUnlocked } = useQuery({
    queryKey: ["profile-unlock", user?.id, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_unlocks")
        .select("id")
        .eq("unlocked_by", user!.id)
        .eq("profile_user_id", userId!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!userId && user.id !== userId,
  });

  // If it's the user's own profile, always show contact
  const showContact = user?.id === userId || isUnlocked === true;

  const unlockMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("unlock-profile-contact", {
        body: { profile_user_id: userId },
      });

      const result = (data || {}) as {
        error?: string;
        balance?: number;
        required?: number;
      };

      let backendError = result.error;

      // Supabase FunctionsError often stores real JSON body in error.context
      if (!backendError && error && typeof (error as any)?.context?.json === "function") {
        try {
          const payload = await (error as any).context.json();
          backendError = payload?.error;
        } catch {
          // ignore parse error
        }
      }

      // Treat 402 (insufficient credits) as expected business response, not runtime error
      if (backendError === "Insufficient credits") {
        return { ok: false as const, reason: "insufficient_credits" as const };
      }

      if (error || backendError) {
        throw new Error(backendError || "Gagal membuka kontak");
      }

      return { ok: true as const };
    },
    onSuccess: (result) => {
      if (!result.ok && result.reason === "insufficient_credits") {
        toast.error("Kredit tidak cukup", {
          description: "Silakan topup kredit terlebih dahulu.",
          action: {
            label: "Top Up",
            onClick: () => navigate("/credit-balance"),
          },
          duration: 6000,
        });
        return;
      }

      toast.success("Kontak berhasil dibuka!");
      queryClient.invalidateQueries({ queryKey: ["profile-unlock", user?.id, userId] });
    },
    onError: (err: Error) => {
      if (err.message.includes("non-2xx") || err.message.includes("Edge function returned")) {
        toast.error("Kredit tidak cukup", {
          description: "Silakan topup kredit terlebih dahulu.",
          action: {
            label: "Top Up",
            onClick: () => navigate("/credit-balance"),
          },
          duration: 6000,
        });
        return;
      }
      toast.error(err.message);
    },
  });

  const handleUnlock = () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/auth");
      return;
    }
    unlockMutation.mutate();
  };

  const { data: experiences } = useQuery({
    queryKey: ["public-exp", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_experiences")
        .select("*")
        .eq("user_id", userId!)
        .eq("status", "approved")
        .order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: education } = useQuery({
    queryKey: ["public-edu", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_education")
        .select("*")
        .eq("user_id", userId!)
        .eq("status", "approved")
        .order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: certifications } = useQuery({
    queryKey: ["public-cert", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_certifications")
        .select("*")
        .eq("user_id", userId!)
        .order("issue_date", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-2xl p-8 space-y-6">
          <Skeleton className="h-24 w-24 rounded-2xl mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  /* ── not found ── */
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Profil tidak ditemukan</h1>
          <p className="text-muted-foreground">Kode Oveersea tidak valid atau profil tidak tersedia.</p>
        </div>
      </div>
    );
  }

  const locationParts = [profile.city, profile.province, profile.country].filter(Boolean);
  const location = locationParts.join(", ");
  const skills = Array.isArray(profile.skills) ? (profile.skills as string[]) : [];
  const softSkills: SkillScore[] = Array.isArray((profile as any).soft_skills) ? (profile as any).soft_skills : [];
  const technicalSkills: SkillScore[] = Array.isArray((profile as any).technical_skills) ? (profile as any).technical_skills : [];
  const summary = (profile.professional_summary || profile.bio || "") as string;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-background border-b">
        <div className="w-full px-4 md:px-8 lg:px-16 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{profile.full_name || "Profile"}</span>
        </div>
      </div>

      {/* Top banner */}
      <div className="bg-[#D71920] h-36 md:h-44" />

      <div className="w-full mx-auto px-4 md:px-8 lg:px-16 -mt-20 pb-16">
        {/* Avatar floating above card */}
        <div className="flex justify-center sm:justify-start sm:pl-8 mb-[-64px] relative z-10">
          <div className="w-32 h-32 rounded-2xl border-4 border-card bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ""}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground">
                {(profile.full_name || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Profile header card */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-6 md:px-8 md:pb-8" style={{ paddingTop: '80px' }}>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
                {profile.kyc_status === "verified" && (
                  <CheckCircle2 className="w-5 h-5 text-[#D71920]" />
                )}
              </div>
              {profile.headline && (
                <p className="text-muted-foreground mt-1">{profile.headline}</p>
              )}
              {location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 justify-center sm:justify-start">
                  <MapPin className="w-3.5 h-3.5" /> {location}
                </p>
              )}
              {profile.opportunity_availability && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {availabilityLabel[profile.opportunity_availability] || profile.opportunity_availability}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 70 : 30 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* ── Main column (70%) ── */}
          <div className="space-y-6">
            {/* Summary */}
            {summary && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tentang</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {(skills.length > 0 || softSkills.length > 0 || technicalSkills.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Keahlian</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Radar charts */}
                  {(technicalSkills.length > 0 || softSkills.length > 0) && (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {technicalSkills.length > 0 && (
                        <SkillRadarView skills={technicalSkills} color="hsl(var(--primary))" fillColor="hsl(var(--primary) / 0.3)" label="Technical Skills" />
                      )}
                      {softSkills.length > 0 && (
                        <SkillRadarView skills={softSkills} color="hsl(var(--chart-2))" fillColor="hsl(var(--chart-2) / 0.3)" label="Soft Skills" />
                      )}
                    </div>
                  )}
                  {/* Skill tags */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {experiences && experiences.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Pengalaman Kerja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {experiences.map((e: any) => (
                      <div key={e.id} className="border-l-2 border-border pl-4">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-medium text-sm text-foreground">{e.position || e.title}</p>
                            {e.company && <p className="text-sm text-muted-foreground">{e.company}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {fmtRange(e.start_date, e.end_date, e.is_current)}
                          </span>
                        </div>
                        {e.description && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{e.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Pendidikan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {education.map((e: any) => (
                      <div key={e.id} className="border-l-2 border-border pl-4">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {e.degree}{e.field_of_study ? ` — ${e.field_of_study}` : ""}
                            </p>
                            {e.institution && <p className="text-sm text-muted-foreground">{e.institution}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {fmtRange(e.start_date, e.end_date, e.is_current)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {certifications && certifications.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4" /> Sertifikasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {certifications.map((c: any) => (
                      <div key={c.id} className="border-l-2 border-border pl-4">
                        <p className="font-medium text-sm text-foreground">{c.name}</p>
                        {c.issuing_organization && <p className="text-sm text-muted-foreground">{c.issuing_organization}</p>}
                        {c.issue_date && <span className="text-xs text-muted-foreground">{fmtDate(c.issue_date)}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Sidebar (30%) ── */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {showContact ? (
                    <Unlock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  Kontak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {showContact ? (
                  <>
                    {profile.phone_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <a href={`tel:${profile.phone_number}`} className="text-foreground hover:underline">
                          {profile.phone_number}
                        </a>
                      </div>
                    )}
                    {profile.linkedin_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Linkedin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline truncate">
                          {profile.linkedin_url}
                        </a>
                      </div>
                    )}
                    {profile.website_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline truncate">
                          {profile.website_url}
                        </a>
                      </div>
                    )}
                    {!profile.phone_number && !profile.linkedin_url && !profile.website_url && (
                      <p className="text-sm text-muted-foreground">Belum ada informasi kontak.</p>
                    )}
                  </>
                ) : (
                  <>
                    {profile.phone_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{maskPhone(profile.phone_number)}</span>
                      </div>
                    )}
                    {profile.linkedin_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Linkedin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{maskUrl(profile.linkedin_url)}</span>
                      </div>
                    )}
                    {profile.website_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{maskUrl(profile.website_url)}</span>
                      </div>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleUnlock}
                      disabled={unlockMutation.isPending}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      {unlockMutation.isPending ? "Membuka..." : "Buka Kontak — 2 Credit"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Personal Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informasi Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.gender && (
                  <InfoRow icon={User} label="Gender" value={genderLabel[profile.gender] || profile.gender} />
                )}
                {profile.date_of_birth && (
                  <InfoRow icon={Calendar} label="Tanggal Lahir" value={new Date(profile.date_of_birth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
                )}
                {profile.nationality && (
                  <InfoRow icon={Globe} label="Kewarganegaraan" value={profile.nationality} />
                )}
                {profile.languages && (
                  <InfoRow icon={Languages} label="Bahasa" value={profile.languages as string} />
                )}
                {profile.marital_status && (
                  <InfoRow icon={Heart} label="Status" value={maritalLabel[profile.marital_status] || profile.marital_status} />
                )}
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.years_of_experience != null && profile.years_of_experience > 0 && (
                  <InfoRow icon={Briefcase} label="Pengalaman" value={`${profile.years_of_experience} tahun`} />
                )}
                {profile.highest_education && (
                  <InfoRow icon={GraduationCap} label="Pendidikan Tertinggi" value={profile.highest_education} />
                )}
              </CardContent>
            </Card>

            {/* Footer branding */}
            <div className="flex items-center justify-between px-2">
              <img src="/oveersea-logo-dark-cv.png" alt="Oveersea" className="h-5 opacity-60" />
              <span className="text-xs text-muted-foreground font-mono">{profile.oveercode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── small info row ── */
const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2 text-sm">
    <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-foreground">{value}</p>
    </div>
  </div>
);

export default PublicProfile;
