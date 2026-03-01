import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import case1 from "@/assets/case-1.jpg";
import case2 from "@/assets/case-2.jpg";
import case3 from "@/assets/case-3.jpg";
import case4 from "@/assets/case-4.jpg";

// Fallback images for case studies without image_url
const fallbackImages = [case1, case2, case3, case4];

interface CaseStudy {
  id: string;
  title: string;
  description: string | null;
  company_name: string;
  industry: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_featured: boolean | null;
}

const CaseStudiesSection = () => {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      const { data } = await supabase
        .from("case_studies")
        .select("id, title, description, company_name, industry, image_url, cta_label, cta_url, is_featured")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(4);

      if (data) setCases(data as unknown as CaseStudy[]);
      setLoading(false);
    };
    fetchCases();
  }, []);

  if (loading || cases.length === 0) return null;

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Studi Kasus</span>
          <h2 className="text-4xl md:text-5xl font-semibold mt-3 mb-5 text-foreground">
            Dipercaya oleh <span className="text-gradient-accent">Berbagai Industri</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            Lihat bagaimana klien kami berhasil menemukan talenta terbaik dan menyelesaikan proyek mereka.
          </p>
        </motion.div>

        {/* Rippling-style card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cases.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:border-primary/30 transition-colors"
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={item.image_url || fallbackImages[i % fallbackImages.length]}
                  alt={item.company_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                {item.industry && (
                  <span className="text-xs font-medium text-primary mb-2">{item.industry}</span>
                )}
                <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {item.description}
                  </p>
                )}
                {item.cta_label && (
                  <a
                    href={item.cta_url || "#"}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border-b-2 border-primary/60 hover:border-primary pb-0.5 w-fit mt-auto transition-colors"
                  >
                    {item.cta_label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
