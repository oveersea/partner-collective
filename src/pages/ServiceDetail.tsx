import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Users, Target, Briefcase, ArrowRight,
  Shield, Star, Award, Crown, AlertCircle, XCircle, Lightbulb, GraduationCap, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface ServiceDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  required_skills: string[];
  min_match_pct: number;
  category_id: string;
  category_name: string | null;
}

interface RelatedService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  required_skills: string[];
}

interface RecommendedProgram {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  thumbnail_url: string | null;
}

const ServiceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [_providerCount, setProviderCount] = useState(0);
  const [relatedServices, setRelatedServices] = useState<RelatedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [recommendedPrograms, setRecommendedPrograms] = useState<RecommendedProgram[]>([]);

  useEffect(() => {
    if (!slug) return;
    const fetchService = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("services")
        .select("id, name, slug, description, required_skills, min_match_pct, category_id")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!data) {
        setLoading(false);
        return;
      }

      // Get category name
      const { data: cat } = await supabase
        .from("service_categories")
        .select("name")
        .eq("id", data.category_id)
        .single();

      setService({
        ...data,
        required_skills: data.required_skills || [],
        category_name: cat?.name || null,
      });

      // Get provider count
      const { count } = await supabase
        .from("user_services")
        .select("id", { count: "exact", head: true })
        .eq("service_id", data.id)
        .eq("is_active", true);
      setProviderCount(count || 0);

      // Get related services in same category
      const { data: related } = await supabase
        .from("services")
        .select("id, name, slug, description, required_skills")
        .eq("category_id", data.category_id)
        .eq("is_active", true)
        .neq("id", data.id)
        .order("sort_order")
        .limit(4);
      setRelatedServices(
        (related || []).map((s) => ({ ...s, required_skills: s.required_skills || [] }))
      );

      setLoading(false);
    };
    fetchService();
  }, [slug]);

  // Fetch user skills
  useEffect(() => {
    if (!user) return;
    const fetchUserSkills = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("skills")
        .eq("user_id", user.id)
        .single();
      setUserSkills(data?.skills || []);
    };
    fetchUserSkills();
  }, [user]);

  // Fetch recommended programs for missing skills
  useEffect(() => {
    if (!service || !user) return;
    const missingSkills = service.required_skills.filter(
      (s) => !userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    if (missingSkills.length === 0) {
      setRecommendedPrograms([]);
      return;
    }
    const fetchPrograms = async () => {
      const { data } = await supabase
        .from("programs")
        .select("id, title, slug, category, thumbnail_url")
        .eq("status", "approved")
        .overlaps("skills", missingSkills)
        .limit(3);
      setRecommendedPrograms((data || []) as RecommendedProgram[]);
    };
    fetchPrograms();
  }, [service, userSkills, user]);

  // Calculate skill match
  const calcSkillMatch = () => {
    if (!service) return { score: 0, matched: [] as string[], missing: [] as string[] };
    const required = service.required_skills;
    if (required.length === 0) return { score: 100, matched: [], missing: [] };
    const matched = required.filter((s) =>
      userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    const missing = required.filter(
      (s) => !userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
    );
    const score = Math.round((matched.length / required.length) * 100);
    return { score, matched, missing };
  };

  const { score: matchScore, matched: matchedSkills, missing: missingSkills } = calcSkillMatch();
  const canApply = !user || (service ? matchScore >= service.min_match_pct : false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-24">
          <div className="animate-pulse space-y-6 max-w-3xl">
            <div className="h-4 bg-muted rounded w-40" />
            <div className="h-10 bg-muted rounded w-2/3" />
            <div className="h-5 bg-muted rounded w-full" />
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="flex gap-3 mt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded-md w-24" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-24 text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-4">Layanan tidak ditemukan</h1>
          <p className="text-muted-foreground mb-8">Layanan yang Anda cari tidak tersedia.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Kembali ke beranda
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Beranda</Link>
            <span>/</span>
            <span>Layanan</span>
            {service.category_name && (
              <>
                <span>/</span>
                <span>{service.category_name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-foreground font-medium">{service.name}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {service.category_name && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">
                    {service.category_name}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">{service.name}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>

              {/* Skills Required */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border border-border bg-card p-6"
                style={{ borderRadius: "5px" }}
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Skill yang Dibutuhkan
                </h2>
                <div className="flex flex-wrap gap-2">
                  {service.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary/10 text-primary font-medium"
                      style={{ borderRadius: "5px" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* How it works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border border-border bg-card p-6"
                style={{ borderRadius: "5px" }}
              >
                <h2 className="text-lg font-semibold text-foreground mb-6">Bagaimana Cara Kerjanya</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { step: "01", title: "Pilih Layanan", desc: "Pilih layanan yang sesuai kebutuhan Anda." },
                    { step: "02", title: "Match dengan Talent", desc: "Sistem kami mencocokkan Anda dengan talent terverifikasi." },
                    { step: "03", title: "Mulai Kolaborasi", desc: "Mulai bekerja sama dan pantau progresnya." },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground text-sm font-bold mb-3" style={{ borderRadius: "5px" }}>
                        {item.step}
                      </span>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="border border-border bg-card p-6 sticky top-28"
                style={{ borderRadius: "5px" }}
              >
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Ribuan talent terverifikasi siap membantu Anda</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Skills</span>
                    <span className="ml-auto font-semibold text-foreground">{service.required_skills.length}</span>
                  </div>
                  {/* Talent Tier */}
                  <div className="pt-3 border-t border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Talent Tier</span>
                    <div className="space-y-2">
                      {[
                        { label: "Advisor", min: 90, icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10" },
                        { label: "Expert", min: 70, icon: Award, color: "text-primary", bg: "bg-primary/10" },
                        { label: "Senior", min: 50, icon: Star, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Junior", min: 20, icon: Shield, color: "text-muted-foreground", bg: "bg-muted" },
                      ].map((tier) => {
                        const isActive = service.min_match_pct >= tier.min;
                        return (
                          <div
                            key={tier.label}
                            className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-md transition-colors ${
                              isActive ? `${tier.bg} ${tier.color} font-medium` : "text-muted-foreground/40"
                            }`}
                          >
                            <tier.icon className="w-4 h-4" />
                            <span>{tier.label}</span>
                            <span className="ml-auto text-xs">≥ {tier.min}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Link to={`/services/${service.slug}/order`}>
                  <button className="w-full py-3 bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2" style={{ borderRadius: "5px" }}>
                    Mulai Sekarang
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                {/* Skill Match Section for Talent */}
                {user && service && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                      Kecocokan Skill Anda
                    </span>

                    {/* Match Score Bar */}
                    <div className={`rounded-md p-3 mb-3 ${matchScore >= service.min_match_pct ? "bg-primary/10 border border-primary/20" : "bg-destructive/10 border border-destructive/20"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-2xl font-bold ${matchScore >= service.min_match_pct ? "text-primary" : "text-destructive"}`}>
                          {matchScore}%
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matchScore >= service.min_match_pct ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                          {matchScore >= service.min_match_pct ? "Memenuhi syarat" : `Min ${service.min_match_pct}%`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${matchScore >= service.min_match_pct ? "bg-primary" : matchScore >= 40 ? "bg-amber-500" : "bg-destructive"}`}
                          style={{ width: `${matchScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Skill Breakdown */}
                    <div className="space-y-1.5 mb-3">
                      {service.required_skills.map((skill) => {
                        const isMatched = matchedSkills.includes(skill);
                        return (
                          <div key={skill} className="flex items-center gap-2 text-xs">
                            {isMatched ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            )}
                            <span className={isMatched ? "text-foreground" : "text-muted-foreground"}>{skill}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recommendation when score is too low */}
                    {matchScore < service.min_match_pct && (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-semibold text-foreground">Tingkatkan Kecocokan</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {missingSkills.length > 0 && (
                            <li className="flex items-start gap-1.5">
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                              <span>Tambahkan skill: <strong className="text-foreground">{missingSkills.join(", ")}</strong></span>
                            </li>
                          )}
                          <li className="flex items-start gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <span>Lengkapi profil dan sertifikasi Anda</span>
                          </li>
                        </ul>

                        {/* Recommended Learning */}
                        {recommendedPrograms.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-primary" />
                              Rekomendasi Learning
                            </p>
                            <div className="space-y-1.5">
                              {recommendedPrograms.map((prog) => (
                                <Link
                                  key={prog.id}
                                  to={`/learning/${prog.slug}`}
                                  className="flex items-center gap-2.5 p-2 rounded-md bg-card border border-border hover:border-primary/30 transition-colors group"
                                >
                                  {prog.thumbnail_url ? (
                                    <img src={prog.thumbnail_url} alt={prog.title} className="w-8 h-8 rounded object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                                      <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors flex-1">{prog.title}</span>
                                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Apply Button */}
                    {canApply ? (
                      <Link to={`/services/${service.slug}/order`}>
                        <button className="w-full py-3 border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2" style={{ borderRadius: "5px" }}>
                          <Briefcase className="w-4 h-4" />
                          Tawarkan Layanan Ini
                        </button>
                      </Link>
                    ) : (
                      <button disabled className="w-full py-3 border border-border text-muted-foreground font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2 opacity-60" style={{ borderRadius: "5px" }}>
                        <Briefcase className="w-4 h-4" />
                        Skill Belum Memenuhi Syarat
                      </button>
                    )}
                  </div>
                )}

                {/* Show login prompt if not logged in */}
                {!user && (
                  <Link to="/auth">
                    <button className="w-full py-3 mt-3 border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2" style={{ borderRadius: "5px" }}>
                      <Briefcase className="w-4 h-4" />
                      Login untuk Tawarkan Layanan
                    </button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>

          {/* Related services */}
          {relatedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20"
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6">Layanan Terkait</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {relatedServices.map((rs) => (
                  <Link key={rs.id} to={`/services/${rs.slug}`}>
                    <div className="group border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all p-5 h-full" style={{ borderRadius: "5px" }}>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                        {rs.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{rs.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rs.required_skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Lihat detail <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
