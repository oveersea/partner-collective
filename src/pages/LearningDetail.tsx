import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  CheckCircle2, ChevronDown, User, HelpCircle, Globe, Building2,
  Award, Briefcase, Calendar, Shield, Layers,
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

const LearningDetail = () => {
  const { oveercode } = useParams<{ oveercode: string }>();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [instructor, setInstructor] = useState<InstructorWithProfile | null>(null);
  const [additionalInstructors, setAdditionalInstructors] = useState<InstructorWithProfile[]>([]);
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!oveercode) return;
    const fetchAll = async () => {
      setLoading(true);

      // Fetch program
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

      // Fetch instructor profile (main instructor)
      if (prog.instructor_id) {
        const { data: instrProfile } = await supabase
          .from("instructor_profiles")
          .select("*")
          .eq("user_id", prog.instructor_id)
          .maybeSingle();

        // Get name & avatar from profiles table
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", prog.instructor_id)
          .maybeSingle();

        setInstructor({
          name: userProfile?.full_name || prog.instructor_name || "Instructor",
          avatar_url: userProfile?.avatar_url || prog.instructor_avatar_url,
          profile: instrProfile as InstructorProfile | null,
        });
      }

      // Fetch additional instructors from program_instructors junction
      const { data: extraInstructors } = await supabase
        .from("program_instructors")
        .select("instructor_id, sort_order")
        .eq("program_id", prog.id)
        .order("sort_order", { ascending: true });

      if (extraInstructors && extraInstructors.length > 0) {
        const extraIds = extraInstructors
          .map(ei => ei.instructor_id)
          .filter(id => id !== prog.instructor_id);

        if (extraIds.length > 0) {
          const extras: InstructorWithProfile[] = [];
          for (const uid of extraIds) {
            const [{ data: ip }, { data: up }] = await Promise.all([
              supabase.from("instructor_profiles").select("*").eq("user_id", uid).maybeSingle(),
              supabase.from("profiles").select("full_name, avatar_url").eq("user_id", uid).maybeSingle(),
            ]);
            extras.push({
              name: up?.full_name || "Instructor",
              avatar_url: up?.avatar_url,
              profile: ip as InstructorProfile | null,
            });
          }
          setAdditionalInstructors(extras);
        }
      }

      // Fetch institution
      if (prog.institution_id) {
        const { data: inst } = await supabase
          .from("institutions")
          .select("*")
          .eq("id", prog.institution_id)
          .maybeSingle();
        if (inst) setInstitution(inst as InstitutionData);
      }

      setLoading(false);
    };
    fetchAll();
  }, [oveercode]);

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
          <h2 className="text-xl font-semibold mb-2">Program not found</h2>
          <Link to="/learning"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Learning</Button></Link>
        </div>
      </div>
    );
  }

  const syllabus = program.syllabus ?? [];
  const outcomes = program.learning_outcomes ?? [];
  const audience = program.target_audience ?? [];
  const prereqs = program.prerequisites ?? [];
  const faq = program.faq ?? [];
  const allInstructors = [
    ...(instructor ? [instructor] : []),
    ...additionalInstructors,
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <Link to="/learning" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Learning
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thumbnail */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl overflow-hidden bg-muted aspect-video">
              {program.thumbnail_url ? (
                <img src={program.thumbnail_url} alt={program.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-16 h-16 text-muted-foreground/20" /></div>
              )}
            </motion.div>

            {/* Title & Meta */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge>{program.category}</Badge>
                {program.badge && <Badge variant="secondary">{program.badge}</Badge>}
                {program.level && <Badge variant="outline">{program.level}</Badge>}
                {program.delivery_mode && <Badge variant="outline" className="capitalize">{program.delivery_mode}</Badge>}
                {program.certificate_method && program.certificate_method !== 'none' && (
                  <Badge variant="secondary" className="gap-1"><Award className="w-3 h-3" />Certificate</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">{program.title}</h1>
              {program.description && <p className="text-muted-foreground leading-relaxed">{program.description}</p>}
              {program.oveercode && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">Code: {program.oveercode}</p>
              )}
            </motion.div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {program.duration && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{program.duration}</span>}
              {program.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{program.location}</span>}
              {program.rating != null && <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{program.rating}</span>}
              {program.student_count != null && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{program.student_count} students</span>}
              {program.organizer_type && <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 capitalize" />{program.organizer_type}</span>}
            </div>

            {/* Learning Outcomes */}
            {outcomes.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> What You Will Learn</h2>
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
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Syllabus ({syllabus.length} modules)</h2>
                <div className="space-y-2">
                  {syllabus.map((mod, i) => (
                    <Collapsible key={i}>
                      <Card>
                        <CollapsibleTrigger className="w-full">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-left">
                              <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">{i + 1}</span>
                              <span className="font-medium text-sm text-foreground">{mod.title}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pl-14 space-y-2">
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

            {/* Instructor Profiles (full section) */}
            {allInstructors.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> {allInstructors.length > 1 ? "Instructors" : "Instructor"}
                </h2>
                <div className="space-y-4">
                  {allInstructors.map((instr, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {instr.avatar_url ? (
                            <img src={instr.avatar_url} alt={instr.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{instr.name}</h3>
                            {instr.profile?.title && <p className="text-sm text-muted-foreground">{instr.profile.title}</p>}

                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              {instr.profile?.experience_years != null && (
                                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{instr.profile.experience_years} years exp.</span>
                              )}
                              {instr.profile?.instructor_rating != null && (
                                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />{instr.profile.instructor_rating}</span>
                              )}
                              {instr.profile?.total_programs != null && (
                                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{instr.profile.total_programs} programs</span>
                              )}
                              {instr.profile?.location && (
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{instr.profile.location}</span>
                              )}
                            </div>

                            {instr.profile?.bio && (
                              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{instr.profile.bio}</p>
                            )}

                            {instr.profile?.expertise && instr.profile.expertise.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {instr.profile.expertise.map((e, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                                ))}
                              </div>
                            )}

                            {instr.profile?.specializations && instr.profile.specializations.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {instr.profile.specializations.map((s, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                                ))}
                              </div>
                            )}

                            {instr.profile?.achievements && instr.profile.achievements.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-primary" /> Achievements</p>
                                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                                  {instr.profile.achievements.map((a, i) => <li key={i}>{a}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Institution */}
            {institution && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Institution
                </h2>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {institution.logo_url ? (
                        <img src={institution.logo_url} alt={institution.name} className="w-14 h-14 rounded-lg object-contain bg-muted p-1 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-7 h-7 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{institution.name}</h3>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {institution.institution_type && (
                            <Badge variant="outline" className="text-xs capitalize">{institution.institution_type}</Badge>
                          )}
                          {(institution.city || institution.country) && (
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[institution.city, institution.country].filter(Boolean).join(", ")}</span>
                          )}
                          {institution.founded_year && (
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Est. {institution.founded_year}</span>
                          )}
                        </div>
                        {institution.description && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{institution.description}</p>
                        )}
                        {institution.website && (
                          <a href={institution.website} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                            <Globe className="w-3.5 h-3.5" /> Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Target Audience */}
            {audience.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Target Audience</h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {audience.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </section>
            )}

            {/* Prerequisites */}
            {prereqs.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Prerequisites</h2>
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
                  <span className="text-2xl font-semibold text-foreground">
                    {program.price_cents > 0 ? formatRupiah(program.price_cents) : "Free"}
                  </span>
                  {program.currency && program.currency !== "IDR" && program.price_cents > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">({program.currency})</span>
                  )}
                </div>

                <Button className="w-full" size="lg">Enroll Now</Button>

                <Separator />

                <div className="space-y-3 text-sm">
                  <p className="font-medium text-foreground text-xs uppercase tracking-wider">Program Details</p>
                  {program.duration && (
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4 shrink-0" /><span>Duration: {program.duration}</span></div>
                  )}
                  {program.level && (
                    <div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="w-4 h-4 shrink-0" /><span>Level: {program.level}</span></div>
                  )}
                  {program.delivery_mode && (
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4 shrink-0" /><span>Mode: {program.delivery_mode}</span></div>
                  )}
                  {program.category && (
                    <div className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="w-4 h-4 shrink-0" /><span>{program.category}</span></div>
                  )}
                  {program.certificate_method && program.certificate_method !== "none" && (
                    <div className="flex items-center gap-2 text-muted-foreground"><Award className="w-4 h-4 shrink-0" /><span>Certificate: {program.certificate_method}</span></div>
                  )}
                  {syllabus.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground"><Layers className="w-4 h-4 shrink-0" /><span>{syllabus.length} modules</span></div>
                  )}
                </div>

                {/* Compact Instructor in sidebar */}
                {instructor && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-3">Instructor</p>
                      <div className="flex items-center gap-3">
                        {instructor.avatar_url ? (
                          <img src={instructor.avatar_url} alt={instructor.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{instructor.name}</p>
                          {instructor.profile?.title && <p className="text-xs text-muted-foreground">{instructor.profile.title}</p>}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Compact Institution in sidebar */}
                {institution && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-3">Institution</p>
                      <div className="flex items-center gap-3">
                        {institution.logo_url ? (
                          <img src={institution.logo_url} alt={institution.name} className="w-10 h-10 rounded-lg object-contain bg-muted p-0.5" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{institution.name}</p>
                          {(institution.city || institution.country) && (
                            <p className="text-xs text-muted-foreground">{[institution.city, institution.country].filter(Boolean).join(", ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
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
