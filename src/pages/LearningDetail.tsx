import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import OrderBarcode from "@/components/OrderBarcode";
import { useAuth } from "@/contexts/AuthContext";

import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Clock, Star, Users, MapPin, GraduationCap, BookOpen,
  CheckCircle2, ChevronDown, User, Globe, Building2,
  Award, Briefcase, Calendar, Shield, Layers, Play, Target,
  DollarSign, ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

interface SyllabusModule { title: string; description?: string; topics?: string[]; }
interface FAQItem { question: string; answer: string; }

interface InstructorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  title: string | null;
  experience_years: number | null;
  expertise: string[] | null;
  specializations: string[] | null;
  achievements: string[] | null;
  instructor_rating: number | null;
  total_programs: number | null;
  location: string | null;
  email: string | null;
  education: any | null;
  experiences: any | null;
}

interface InstructorWithProfile {
  name: string;
  avatar_url: string | null;
  profile: InstructorProfile | null;
  oveercode: string | null;
}

interface InstitutionData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  institution_type: string | null;
  founded_year: number | null;
}

interface ProgramDetail {
  id: string; title: string; slug: string; description: string | null; category: string;
  level: string | null; duration: string | null; delivery_mode: string | null;
  price_cents: number; currency: string; rating: number | null; student_count: number | null;
  badge: string | null; thumbnail_url: string | null; location: string | null;
  instructor_name: string | null; instructor_bio: string | null; instructor_avatar_url: string | null;
  instructor_id: string | null; institution_id: string | null;
  syllabus: SyllabusModule[] | null; learning_outcomes: string[] | null;
  target_audience: string[] | null; prerequisites: string[] | null; faq: FAQItem[] | null;
  certificate_method: string | null; organizer_type: string | null;
  oveercode: string | null; created_at: string;
  latitude: number | null; longitude: number | null;
}

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const NAV_ITEMS = [
  { id: "program", label: "Program" },
  { id: "kurikulum", label: "Kurikulum" },
  { id: "instruktur", label: "Instruktur" },
  { id: "institusi", label: "Institusi" },
  { id: "jadwal", label: "Jadwal & Biaya" },
  { id: "faq", label: "FAQ" },
];

const LearningDetail = () => {
  const { oveercode } = useParams<{ oveercode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [instructor, setInstructor] = useState<InstructorWithProfile | null>(null);
  const [additionalInstructors, setAdditionalInstructors] = useState<InstructorWithProfile[]>([]);
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const enrolling = false;
  const [activeSection, setActiveSection] = useState("program");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [userOrder, setUserOrder] = useState<{ order_number: string; checked_in_at: string | null; status: string } | null>(null);

  const handleEnroll = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!program) return;
    const params = new URLSearchParams({
      type: "program_order",
      program_id: program.id,
      title: program.title,
      amount: String(program.price_cents),
      currency: program.currency || "IDR",
    });
    if (program.oveercode) params.set("oveercode", program.oveercode);
    if (program.slug) params.set("slug", program.slug);
    if (program.category) params.set("category", program.category);
    if (program.thumbnail_url) params.set("thumbnail", program.thumbnail_url);
    if (program.duration) params.set("duration", program.duration);
    navigate(`/checkout?${params.toString()}`);
  };

  useEffect(() => {
    if (!oveercode) return;
    const fetchAll = async () => {
      setLoading(true);

      let { data } = await supabase.from("programs").select("*").eq("oveercode", oveercode).eq("status", "approved").maybeSingle();
      if (!data) {
        const fallback = await supabase.from("programs").select("*").eq("slug", oveercode).eq("status", "approved").maybeSingle();
        data = fallback.data;
      }
      if (!data) { setLoading(false); return; }

      const prog: ProgramDetail = {
        ...data,
        syllabus: Array.isArray(data.syllabus) ? (data.syllabus as unknown as SyllabusModule[]) : null,
        learning_outcomes: Array.isArray(data.learning_outcomes) ? (data.learning_outcomes as string[]) : null,
        target_audience: Array.isArray(data.target_audience) ? (data.target_audience as string[]) : null,
        prerequisites: Array.isArray(data.prerequisites) ? (data.prerequisites as string[]) : null,
        faq: Array.isArray(data.faq) ? (data.faq as unknown as FAQItem[]) : null,
      } as ProgramDetail;
      setProgram(prog);

      // Fetch instructors from program_instructors junction table (source of truth)
      const { data: junctionInstructors } = await supabase
        .from("program_instructors")
        .select("instructor_id, sort_order")
        .eq("program_id", prog.id)
        .order("sort_order", { ascending: true });

      const junctionIds = junctionInstructors?.map(ji => ji.instructor_id) ?? [];

      if (junctionIds.length > 0) {
        const allFetched: InstructorWithProfile[] = [];
        for (const uid of junctionIds) {
          const [{ data: ip }, { data: up }] = await Promise.all([
            supabase.from("instructor_profiles").select("*").eq("user_id", uid).maybeSingle(),
            supabase.from("profiles").select("full_name, avatar_url, oveercode").eq("user_id", uid).maybeSingle(),
          ]);
          allFetched.push({
            name: up?.full_name || "Instructor",
            avatar_url: up?.avatar_url,
            profile: ip as InstructorProfile | null,
            oveercode: up?.oveercode || null,
          });
        }
        setInstructor(allFetched[0] || null);
        setAdditionalInstructors(allFetched.slice(1));
      } else if (prog.instructor_id) {
        const [{ data: instrProfile }, { data: userProfile }] = await Promise.all([
          supabase.from("instructor_profiles").select("*").eq("user_id", prog.instructor_id).maybeSingle(),
          supabase.from("profiles").select("full_name, avatar_url, oveercode").eq("user_id", prog.instructor_id).maybeSingle(),
        ]);
        setInstructor({
          name: userProfile?.full_name || prog.instructor_name || "Instructor",
          avatar_url: userProfile?.avatar_url || prog.instructor_avatar_url,
          profile: instrProfile as InstructorProfile | null,
          oveercode: userProfile?.oveercode || null,
        });
      }

      if (prog.institution_id) {
        const { data: inst } = await supabase.from("institutions").select("*").eq("id", prog.institution_id).maybeSingle();
        if (inst) setInstitution(inst as InstitutionData);
      }

      setLoading(false);
    };
    fetchAll();
  }, [oveercode]);

  // Intersection observer for sticky nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [program]);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 sm:px-6 py-20 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold mb-2">Program tidak ditemukan</h2>
          <Link to="/learning"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Button></Link>
        </div>
      </div>
    );
  }

  const syllabus = program.syllabus ?? [];
  const outcomes = program.learning_outcomes ?? [];
  const audience = program.target_audience ?? [];
  const prereqs = program.prerequisites ?? [];
  const faq = program.faq ?? [];
  const allInstructors = [...(instructor ? [instructor] : []), ...additionalInstructors];

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.id === "kurikulum" && syllabus.length === 0) return false;
    if (item.id === "instruktur" && allInstructors.length === 0) return false;
    if (item.id === "institusi" && !institution) return false;
    if (item.id === "faq" && faq.length === 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 pt-6 pb-12">
          <Link to="/learning" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Learning
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text content */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="text-xs font-semibold">{program.category}</Badge>
                {program.badge && <Badge variant="secondary" className="text-xs">{program.badge}</Badge>}
                {program.level && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Target className="w-3 h-3" /> {program.level}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                {program.title}
              </h1>

              {program.description && (
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 max-w-xl">
                  {program.description}
                </p>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {program.duration && (
                  <div>
                    <p className="text-xl font-bold text-foreground">{program.duration}</p>
                    <p className="text-xs text-muted-foreground">Durasi Program</p>
                  </div>
                )}
                {syllabus.length > 0 && (
                  <div>
                    <p className="text-xl font-bold text-foreground">{syllabus.length}</p>
                    <p className="text-xs text-muted-foreground">Modul Materi</p>
                  </div>
                )}
                {program.student_count != null && program.student_count > 0 && (
                  <div>
                    <p className="text-xl font-bold text-foreground">{program.student_count.toLocaleString("id-ID")}+</p>
                    <p className="text-xs text-muted-foreground">Peserta</p>
                  </div>
                )}
                {program.rating != null && (
                  <div>
                    <p className="text-xl font-bold text-foreground flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {program.rating}
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {program.delivery_mode && (
                  <Badge variant="secondary" className="text-xs gap-1 py-1 px-3">
                    <MapPin className="w-3 h-3" /> {program.delivery_mode}
                  </Badge>
                )}
                {program.certificate_method && program.certificate_method !== "none" && (
                  <Badge variant="secondary" className="text-xs gap-1 py-1 px-3">
                    <Award className="w-3 h-3" /> Bersertifikat
                  </Badge>
                )}
                {program.organizer_type && (
                  <Badge variant="outline" className="text-xs gap-1 py-1 px-3 capitalize">
                    <Building2 className="w-3 h-3" /> {program.organizer_type}
                  </Badge>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2 text-sm" onClick={() => scrollToSection("jadwal")}>
                  <DollarSign className="w-4 h-4" /> Lihat Jadwal & Biaya
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-sm" onClick={() => scrollToSection("kurikulum")}>
                  <BookOpen className="w-4 h-4" /> Lihat Kurikulum
                </Button>
              </div>
            </motion.div>

            {/* Right: Thumbnail */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="rounded-2xl overflow-hidden bg-muted aspect-[4/5] shadow-xl">
                {program.thumbnail_url ? (
                  <img src={program.thumbnail_url} alt={program.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <GraduationCap className="w-20 h-20 text-primary/30" />
                  </div>
                )}
              </div>
              {/* Institution badge below thumbnail */}
              {institution && (
                <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-card border border-border">
                  {institution.logo_url ? (
                    <img src={institution.logo_url} alt={institution.name} className="w-10 h-10 rounded-lg object-contain bg-muted p-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Diselenggarakan oleh {institution.name}</p>
                    {(institution.city || institution.country) && (
                      <p className="text-xs text-muted-foreground">{[institution.city, institution.country].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== STICKY NAV ===== */}
      <nav className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0">
            {visibleNav.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === item.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 py-2">
              <Button size="sm" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? "Memproses..." : "Daftar Sekarang"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10">

          {/* LEFT COLUMN (70%) */}
          <div className="min-w-0">

            {/* PROGRAM SECTION */}
            <section id="program" ref={(el) => { sectionRefs.current["program"] = el; }} className="py-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">PROGRAM</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Yang akan kamu pelajari di program ini
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl">
                {program.description || `Pelajari ${program.title} dan kuasai keahlian yang dibutuhkan industri.`}
              </p>

              {/* Outcomes grid */}
              {outcomes.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                  {outcomes.map((o, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{o}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Target Audience */}
              {audience.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Siapa yang cocok mengikuti program ini?
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {audience.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisites */}
              {prereqs.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> Prasyarat
                  </h3>
                  <ul className="space-y-2">
                    {prereqs.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">{i + 1}</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <Separator />

            {/* KURIKULUM SECTION */}
            <section id="kurikulum" ref={(el) => { sectionRefs.current["kurikulum"] = el; }} className="py-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">KURIKULUM</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Kurikulum Teruji Industri
              </h2>
              {syllabus.length > 0 ? (
                <>
                  <p className="text-muted-foreground mb-8 max-w-2xl">
                    {syllabus.length} modul dirancang untuk memberikan pemahaman menyeluruh dari dasar hingga mahir.
                  </p>
                  <div className="space-y-3">
                    {syllabus.map((mod, i) => (
                      <Collapsible key={i}>
                        <Card className="overflow-hidden">
                          <CollapsibleTrigger className="w-full">
                            <CardContent className="p-0">
                              <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[10px] font-semibold text-primary uppercase">Modul</span>
                                  <span className="text-lg font-bold text-primary leading-none">{i + 1}</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{mod.title}</h3>
                                  {mod.topics && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{mod.topics.length} topik</p>
                                  )}
                                </div>
                                <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 transition-transform" />
                              </div>
                            </CardContent>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-5 pb-5 pl-[4.75rem] space-y-3 border-t border-border pt-4">
                              {mod.description && (
                                <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                              )}
                              {mod.topics && mod.topics.length > 0 && (
                                <ul className="space-y-1.5">
                                  {mod.topics.map((t, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <Play className="w-3 h-3 text-primary mt-1 shrink-0 fill-primary" />
                                      {t}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Kurikulum untuk program ini belum tersedia.</p>
                </div>
              )}
            </section>

            <Separator />

            {/* INSTRUKTUR SECTION */}
            {allInstructors.length > 0 && (
              <section id="instruktur" ref={(el) => { sectionRefs.current["instruktur"] = el; }} className="py-12">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">INSTRUKTUR</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Belajar Langsung dari Para Ahli
                </h2>
                <p className="text-muted-foreground mb-8 max-w-2xl">
                  Instruktur berpengalaman yang siap membimbing kamu menguasai materi.
                </p>

                <div className="grid sm:grid-cols-2 gap-6">
                  {allInstructors.map((instr, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card
                        className={`h-full overflow-hidden hover:shadow-lg transition-shadow ${instr.oveercode ? "cursor-pointer" : ""}`}
                        onClick={() => instr.oveercode && navigate(`/p/${instr.oveercode}`)}
                      >
                        <CardContent className="p-0">
                          <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-6 pb-4 flex flex-col items-center text-center">
                            {instr.avatar_url ? (
                              <img src={instr.avatar_url} alt={instr.name} className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md" />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-md">
                                <User className="w-10 h-10 text-primary" />
                              </div>
                            )}
                            <h3 className="font-semibold text-foreground mt-3">{instr.name}</h3>
                            {instr.profile?.title && (
                              <p className="text-sm text-muted-foreground">{instr.profile.title}</p>
                            )}
                          </div>

                          <div className="p-5 space-y-3">
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {instr.profile?.experience_years != null && (
                                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{instr.profile.experience_years} thn</span>
                              )}
                              {instr.profile?.instructor_rating != null && (
                                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />{instr.profile.instructor_rating}</span>
                              )}
                              {instr.profile?.total_programs != null && (
                                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{instr.profile.total_programs} program</span>
                              )}
                              {instr.profile?.location && (
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{instr.profile.location}</span>
                              )}
                            </div>

                            {instr.profile?.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{instr.profile.bio}</p>
                            )}

                            {instr.profile?.expertise && instr.profile.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {instr.profile.expertise.slice(0, 5).map((e, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                                ))}
                                {instr.profile.expertise.length > 5 && (
                                  <Badge variant="outline" className="text-xs">+{instr.profile.expertise.length - 5}</Badge>
                                )}
                              </div>
                            )}

                            {instr.profile?.achievements && instr.profile.achievements.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-primary" /> Pencapaian
                                </p>
                                <ul className="space-y-0.5">
                                  {instr.profile.achievements.slice(0, 3).map((a, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                      <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {allInstructors.length > 0 && <Separator />}

            {/* INSTITUSI SECTION */}
            {institution && (
              <section id="institusi" ref={(el) => { sectionRefs.current["institusi"] = el; }} className="py-12">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">INSTITUSI</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
                  Penyelenggara Program
                </h2>

                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 bg-gradient-to-br from-primary/5 to-accent/5 p-6 flex items-center justify-center shrink-0">
                        {institution.logo_url ? (
                          <img src={institution.logo_url} alt={institution.name} className="w-24 h-24 object-contain" />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-6">
                        <h3 className="text-xl font-bold text-foreground mb-2">{institution.name}</h3>
                        <div className="flex flex-wrap gap-3 mb-4">
                          {institution.institution_type && (
                            <Badge variant="secondary" className="text-xs capitalize">{institution.institution_type}</Badge>
                          )}
                          {(institution.city || institution.country) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" /> {[institution.city, institution.country].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {institution.founded_year && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" /> Berdiri {institution.founded_year}
                            </span>
                          )}
                        </div>
                        {institution.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{institution.description}</p>
                        )}
                        {institution.website && (
                          <a
                            href={institution.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                          >
                            <Globe className="w-4 h-4" /> Kunjungi Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {institution && <Separator />}

            {/* FAQ SECTION */}
            {faq.length > 0 && (
              <section id="faq" ref={(el) => { sectionRefs.current["faq"] = el; }} className="py-12">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">FAQ</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
                  Pertanyaan yang Sering Ditanyakan
                </h2>

                <div className="space-y-3">
                  {faq.map((f, i) => (
                    <Collapsible key={i}>
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                            <span className="font-medium text-sm sm:text-base text-foreground text-left">{f.question}</span>
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border pt-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* RIGHT COLUMN (30%) — Sticky Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <section id="jadwal" ref={(el) => { sectionRefs.current["jadwal"] = el; }}>
                <Card className="overflow-hidden border-primary/20 shadow-lg">
                  <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5 text-primary-foreground">
                    <p className="text-xs font-medium opacity-90 mb-1">{program.category}</p>
                    <h3 className="text-lg font-bold">{program.title}</h3>
                  </div>
                  <CardContent className="px-6 py-6 space-y-5">
                    {/* Price */}
                    <div>
                      <span className="text-3xl font-bold text-foreground">
                        {program.price_cents > 0 ? formatRupiah(program.price_cents) : "Gratis"}
                      </span>
                      {program.currency && program.currency !== "IDR" && program.price_cents > 0 && (
                        <span className="text-sm text-muted-foreground ml-1">({program.currency})</span>
                      )}
                    </div>

                    <Separator />

                    {/* Details list */}
                    <div className="space-y-3 text-sm">
                      {program.duration && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock className="w-4 h-4 shrink-0 text-primary" />
                          <span>Durasi: <strong className="text-foreground">{program.duration}</strong></span>
                        </div>
                      )}
                      {program.delivery_mode && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0 text-primary" />
                          <span>Mode: <strong className="text-foreground capitalize">{program.delivery_mode}</strong></span>
                        </div>
                      )}
                      {program.level && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Layers className="w-4 h-4 shrink-0 text-primary" />
                          <span>Level: <strong className="text-foreground capitalize">{program.level}</strong></span>
                        </div>
                      )}
                      {program.location && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0 text-primary" />
                          <span>Lokasi: <strong className="text-foreground">{program.location}</strong></span>
                        </div>
                      )}
                      {program.certificate_method && program.certificate_method !== "none" && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Award className="w-4 h-4 shrink-0 text-primary" />
                          <span>Sertifikat: <strong className="text-foreground capitalize">{program.certificate_method}</strong></span>
                        </div>
                      )}
                      {syllabus.length > 0 && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <BookOpen className="w-4 h-4 shrink-0 text-primary" />
                          <span><strong className="text-foreground">{syllabus.length} modul</strong> materi</span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" size="lg" onClick={handleEnroll} disabled={enrolling}>
                      <GraduationCap className="w-4 h-4 mr-2" /> {enrolling ? "Memproses..." : "Daftar Sekarang"}
                    </Button>

                    {program.oveercode && (
                      <p className="text-sm text-center text-muted-foreground font-mono">
                        Kode Program: {program.oveercode}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>

          {/* MOBILE: Jadwal & Biaya card (shown below content on small screens) */}
          <div className="lg:hidden">
            <Separator className="mb-8" />
            <section id="jadwal-mobile" ref={(el) => { if (!sectionRefs.current["jadwal"]) sectionRefs.current["jadwal"] = el; }}>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">JADWAL & BIAYA</p>
              <h2 className="text-2xl font-bold text-foreground mb-6">Mulai perjalanan belajarmu</h2>
              <Card className="overflow-hidden border-primary/20">
                <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground">
                  <p className="text-xs font-medium opacity-90 mb-1">{program.category}</p>
                  <h3 className="text-lg font-bold">{program.title}</h3>
                </div>
                <CardContent className="p-5 space-y-5">
                  <div>
                    <span className="text-3xl font-bold text-foreground">
                      {program.price_cents > 0 ? formatRupiah(program.price_cents) : "Gratis"}
                    </span>
                  </div>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    {program.duration && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0 text-primary" />
                        <span>Durasi: <strong className="text-foreground">{program.duration}</strong></span>
                      </div>
                    )}
                    {program.delivery_mode && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 text-primary" />
                        <span>Mode: <strong className="text-foreground capitalize">{program.delivery_mode}</strong></span>
                      </div>
                    )}
                    {program.level && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Layers className="w-4 h-4 shrink-0 text-primary" />
                        <span>Level: <strong className="text-foreground capitalize">{program.level}</strong></span>
                      </div>
                    )}
                  </div>
                  <Button className="w-full" size="lg" onClick={handleEnroll} disabled={enrolling}>
                    <GraduationCap className="w-4 h-4 mr-2" /> {enrolling ? "Memproses..." : "Daftar Sekarang"}
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>

        </div>

        {/* Bottom spacer */}
        <div className="h-16" />
      </main>
    </div>
  );
};

export default LearningDetail;
