import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Clock, Star, Users, MapPin, GraduationCap, BookOpen,
  CheckCircle2, ChevronDown, User, HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface SyllabusModule {
  title: string;
  description?: string;
  topics?: string[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ProgramDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  level: string | null;
  duration: string | null;
  delivery_mode: string | null;
  price_cents: number;
  currency: string;
  rating: number | null;
  student_count: number | null;
  badge: string | null;
  thumbnail_url: string | null;
  location: string | null;
  instructor_name: string | null;
  instructor_bio: string | null;
  instructor_avatar_url: string | null;
  syllabus: SyllabusModule[] | null;
  learning_outcomes: string[] | null;
  target_audience: string[] | null;
  prerequisites: string[] | null;
  faq: FAQItem[] | null;
}

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const LearningDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("programs")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (data) {
        setProgram({
          ...data,
          syllabus: Array.isArray(data.syllabus) ? (data.syllabus as unknown as SyllabusModule[]) : null,
          learning_outcomes: Array.isArray(data.learning_outcomes) ? (data.learning_outcomes as string[]) : null,
          target_audience: Array.isArray(data.target_audience) ? (data.target_audience as string[]) : null,
          prerequisites: Array.isArray(data.prerequisites) ? (data.prerequisites as string[]) : null,
          faq: Array.isArray(data.faq) ? (data.faq as unknown as FAQItem[]) : null,
        } as ProgramDetail);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-40 w-full" />
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
          <Link to="/learning"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Learning</Button></Link>
        </div>
      </div>
    );
  }

  const syllabus = program.syllabus ?? [];
  const outcomes = program.learning_outcomes ?? [];
  const audience = program.target_audience ?? [];
  const prereqs = program.prerequisites ?? [];
  const faq = program.faq ?? [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link to="/learning" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Learning
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thumbnail */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl overflow-hidden bg-muted aspect-video">
              {program.thumbnail_url ? (
                <img src={program.thumbnail_url} alt={program.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-16 h-16 text-muted-foreground/20" /></div>
              )}
            </motion.div>

            {/* Title & badges */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge>{program.category}</Badge>
                {program.badge && <Badge variant="secondary">{program.badge}</Badge>}
                {program.level && <Badge variant="outline">{program.level}</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">{program.title}</h1>
              {program.description && <p className="text-muted-foreground leading-relaxed">{program.description}</p>}
            </motion.div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {program.duration && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{program.duration}</span>}
              {program.delivery_mode && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{program.delivery_mode}</span>}
              {program.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{program.location}</span>}
              {program.rating && <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{program.rating}</span>}
              {program.student_count != null && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{program.student_count} siswa</span>}
            </div>

            {/* Learning Outcomes */}
            {outcomes.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Yang Akan Anda Pelajari</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {outcomes.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />{o}</div>
                  ))}
                </div>
              </section>
            )}

            {/* Syllabus */}
            {syllabus.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Silabus</h2>
                <div className="space-y-2">
                  {syllabus.map((mod, i) => (
                    <Collapsible key={i}>
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardContent className="p-4 flex items-center justify-between">
                            <span className="font-medium text-sm text-foreground text-left">{mod.title}</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-2">
                            {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                            {mod.topics && mod.topics.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {mod.topics.map((t, j) => <li key={j}>{t}</li>)}
                              </ul>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </section>
            )}

            {/* Target audience */}
            {audience.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">Target Peserta</h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {audience.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </section>
            )}

            {/* Prerequisites */}
            {prereqs.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">Prasyarat</h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {prereqs.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </section>
            )}

            {/* FAQ */}
            {faq.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary" /> FAQ</h2>
                <div className="space-y-2">
                  {faq.map((f, i) => (
                    <Collapsible key={i}>
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardContent className="p-4 flex items-center justify-between">
                            <span className="font-medium text-sm text-foreground text-left">{f.question}</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4"><p className="text-sm text-muted-foreground">{f.answer}</p></div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-5">
                <div>
                  <span className="text-2xl font-semibold text-foreground">{formatRupiah(program.price_cents)}</span>
                </div>
                <Button className="w-full" size="lg">Daftar Program</Button>
                <div className="space-y-3 text-sm">
                  {program.duration && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><span>Durasi: {program.duration}</span></div>}
                  {program.level && <div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="w-4 h-4" /><span>Level: {program.level}</span></div>}
                  {program.delivery_mode && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>Mode: {program.delivery_mode}</span></div>}
                  {program.category && <div className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="w-4 h-4" /><span>{program.category}</span></div>}
                </div>

                {/* Instructor */}
                {program.instructor_name && (
                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Instruktur</h3>
                    <div className="flex items-center gap-3">
                      {program.instructor_avatar_url ? (
                        <img src={program.instructor_avatar_url} alt={program.instructor_name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{program.instructor_name}</p>
                        {program.instructor_bio && <p className="text-xs text-muted-foreground line-clamp-2">{program.instructor_bio}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearningDetail;
