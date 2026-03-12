import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowLeft, Building2, Quote, Layers, ExternalLink } from "lucide-react";
import case1 from "@/assets/case-1.jpg";
import case2 from "@/assets/case-2.jpg";
import case3 from "@/assets/case-3.jpg";
import case4 from "@/assets/case-4.jpg";

const fallbackImages = [case1, case2, case3, case4];

interface CaseStudyData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  company_name: string;
  industry: string | null;
  image_url: string | null;
  client_logo_url: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  testimonial_role: string | null;
}

interface Section {
  id: string;
  section_type: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  sort_order: number;
}

interface RelatedService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

const CaseStudyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [cs, setCs] = useState<CaseStudyData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [services, setServices] = useState<RelatedService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetch = async () => {
      // Fetch case study by slug
      const { data: csData } = await (supabase as any)
        .from("case_studies")
        .select("id, title, slug, description, content, company_name, industry, image_url, client_logo_url, challenge, solution, results, testimonial_quote, testimonial_author, testimonial_role")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!csData) {
        setLoading(false);
        return;
      }

      setCs(csData as unknown as CaseStudyData);

      // Fetch sections and related services in parallel
      const [secRes, svcRes] = await Promise.all([
        supabase
          .from("case_study_sections")
          .select("id, section_type, title, body, image_url, sort_order")
          .eq("case_study_id", csData.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("case_study_services")
          .select("service_id")
          .eq("case_study_id", csData.id),
      ]);

      setSections((secRes.data || []) as unknown as Section[]);

      // Fetch actual service data
      if (svcRes.data && svcRes.data.length > 0) {
        const serviceIds = svcRes.data.map((s: any) => s.service_id);
        const { data: svcData } = await supabase
          .from("services")
          .select("id, name, slug, description, icon")
          .in("id", serviceIds);
        setServices((svcData || []) as unknown as RelatedService[]);
      }

      setLoading(false);
    };

    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!cs) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Case Study Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Halaman yang Anda cari tidak tersedia.</p>
          <Link to="/case-studies" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Case Studies
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const heroImage = cs.image_url || fallbackImages[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero — full-width image like Behance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full pt-16"
      >
        <div className="w-full aspect-[16/7] max-h-[70vh] overflow-hidden bg-muted">
          <img
            src={heroImage}
            alt={cs.title}
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {/* Title bar — Behance style */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            {cs.client_logo_url ? (
              <img src={cs.client_logo_url} alt={cs.company_name} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{cs.title}</h1>
              <p className="text-sm text-muted-foreground">
                {cs.company_name}
                {cs.industry && <span> · {cs.industry}</span>}
              </p>
            </div>
          </div>
          <Link
            to="/case-studies"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Semua Case Studies
          </Link>
        </div>
      </div>

      {/* Content body */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
          {/* Main content */}
          <div className="space-y-12">
            {/* Description */}
            {cs.description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-lg text-muted-foreground leading-relaxed">{cs.description}</p>
              </motion.div>
            )}

            {/* Long-form content */}
            {cs.content && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="prose prose-neutral dark:prose-invert max-w-none"
              >
                {cs.content.split("\n\n").map((para, i) => (
                  <p key={i} className="text-foreground/80 leading-relaxed mb-4">{para}</p>
                ))}
              </motion.div>
            )}

            {/* Challenge / Solution / Results blocks */}
            {(cs.challenge || cs.solution || cs.results) && (
              <div className="space-y-10">
                {cs.challenge && (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-lg font-bold text-foreground mb-3">Tantangan</h2>
                    <p className="text-muted-foreground leading-relaxed">{cs.challenge}</p>
                  </motion.div>
                )}
                {cs.solution && (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-lg font-bold text-foreground mb-3">Solusi</h2>
                    <p className="text-muted-foreground leading-relaxed">{cs.solution}</p>
                  </motion.div>
                )}
                {cs.results && (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-lg font-bold text-foreground mb-3">Hasil</h2>
                    <p className="text-muted-foreground leading-relaxed">{cs.results}</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Sections — Behance-style vertical image/text blocks */}
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {section.image_url && (
                  <div className="rounded-xl overflow-hidden mb-6">
                    <img
                      src={section.image_url}
                      alt={section.title || cs.title}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                {section.title && (
                  <h3 className="text-lg font-bold text-foreground mb-2">{section.title}</h3>
                )}
                {section.body && (
                  <p className="text-muted-foreground leading-relaxed">{section.body}</p>
                )}
              </motion.div>
            ))}

            {/* Testimonial */}
            {cs.testimonial_quote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 relative"
              >
                <Quote className="w-8 h-8 text-primary/20 absolute top-6 left-6" />
                <blockquote className="text-lg text-foreground italic leading-relaxed pl-10 mb-4">
                  "{cs.testimonial_quote}"
                </blockquote>
                {cs.testimonial_author && (
                  <div className="pl-10">
                    <p className="text-sm font-semibold text-foreground">{cs.testimonial_author}</p>
                    {cs.testimonial_role && (
                      <p className="text-xs text-muted-foreground">{cs.testimonial_role}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar — Related Services */}
          <aside className="space-y-6">
            {/* Services used */}
            {services.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Layanan yang Digunakan
                </h3>
                <div className="space-y-2">
                  {services.map((svc) => (
                    <Link
                      key={svc.id}
                      to={`/services/${svc.slug}`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-sm">
                        {svc.icon || "🔧"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {svc.name}
                        </p>
                        {svc.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{svc.description}</p>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Company info card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Tentang Klien</h3>
              <div className="flex items-center gap-3 mb-3">
                {cs.client_logo_url ? (
                  <img src={cs.client_logo_url} alt={cs.company_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{cs.company_name}</p>
                  {cs.industry && <p className="text-xs text-muted-foreground">{cs.industry}</p>}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CaseStudyDetail;
