import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, GraduationCap, Award, Mail, Globe, Linkedin, Building2, CheckCircle2 } from "lucide-react";

const PublicProfile = () => {
  const { oveercode } = useParams<{ oveercode: string }>();

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

  const { data: experiences } = useQuery({
    queryKey: ["public-exp", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_experiences")
        .select("*")
        .eq("user_id", userId!)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-2xl p-8 space-y-6">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

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
  const skills = Array.isArray(profile.skills) ? profile.skills as string[] : [];
  const summary = (profile.professional_summary || profile.bio || "") as string;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-[#D71920] h-32 md:h-40" />
      
      <div className="max-w-3xl mx-auto px-4 -mt-16 pb-16">
        {/* Profile Card */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Avatar + Name */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-20 sm:-mt-16 mb-6">
              <div className="w-28 h-28 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">
                    {(profile.full_name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-center sm:text-left flex-1 pb-1">
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
              </div>
            </div>

            {/* Contact Links */}
            <div className="flex flex-wrap gap-3 mb-6">
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
            </div>

            {/* Summary */}
            {summary && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Tentang</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Keahlian</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experiences && experiences.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Pengalaman Kerja
                </h2>
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
              </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Pendidikan
                </h2>
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
              </div>
            )}

            {/* Certifications */}
            {certifications && certifications.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Sertifikasi
                </h2>
                <div className="space-y-4">
                  {certifications.map((c: any) => (
                    <div key={c.id} className="border-l-2 border-border pl-4">
                      <p className="font-medium text-sm text-foreground">{c.name}</p>
                      {c.issuing_organization && <p className="text-sm text-muted-foreground">{c.issuing_organization}</p>}
                      {c.issue_date && <span className="text-xs text-muted-foreground">{fmtDate(c.issue_date)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-muted/50 px-6 py-4 flex items-center justify-between border-t border-border">
            <div className="flex items-center gap-2">
              <img src="/oveersea-logo-dark-cv.png" alt="Oveersea" className="h-5 opacity-60" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">{profile.oveercode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
