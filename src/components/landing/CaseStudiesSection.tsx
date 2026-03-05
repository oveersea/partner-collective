import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import case1 from "@/assets/case-1.jpg";
import case2 from "@/assets/case-2.jpg";
import case3 from "@/assets/case-3.jpg";
import case4 from "@/assets/case-4.jpg";
import case5 from "@/assets/case-5.jpg";
import case6 from "@/assets/case-6.jpg";

// Fallback images for case studies without image_url
const fallbackImages = [case1, case2, case3, case4, case5, case6];

const placeholderCases: CaseStudy[] = [
  { id: "1", title: "Digital Transformation for a Logistics Company", slug: "digital-transformation-logistics", description: "Built an end-to-end platform that improved operational efficiency by 40%.", company_name: "LogiTech Indonesia", industry: "Logistics", image_url: null, cta_label: "Baca cerita", cta_url: null, is_featured: true },
  { id: "2", title: "Rebranding & Digital Marketing for F&B Chain", slug: "rebranding-fnb-chain", description: "A new brand strategy that increased awareness 3x in 6 months.", company_name: "Warung Nusantara", industry: "F&B", image_url: null, cta_label: "Baca cerita", cta_url: null, is_featured: true },
  { id: "3", title: "Integrated HR System for a Fintech Startup", slug: "integrated-hr-fintech", description: "Automated recruitment and onboarding processes, saving 60% of HR time.", company_name: "PayEase", industry: "Fintech", image_url: null, cta_label: "Baca cerita", cta_url: null, is_featured: false },
  { id: "4", title: "E-Commerce Platform for a Local Fashion Brand", slug: "ecommerce-fashion-brand", description: "A custom platform that increased online sales conversion by 250%.", company_name: "Batik Moderna", industry: "Fashion", image_url: null, cta_label: "Baca cerita", cta_url: null, is_featured: false },
];

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
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
        .select("id, title, slug, description, company_name, industry, image_url, cta_label, cta_url, is_featured")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(4);

      if (data && data.length > 0) {
        setCases(data as unknown as CaseStudy[]);
      } else {
        setCases(placeholderCases);
      }
      setLoading(false);
    };
    fetchCases();
  }, []);

  if (loading) return null;

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Case Studies</span>
          <h2 className="text-4xl md:text-5xl font-semibold mt-3 mb-5 text-foreground">
            Trusted Across <span className="text-gradient-accent">Industries</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            See how our clients found the best talent and completed their projects.
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
                <Link
                  to={`/case-studies/${item.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground border-b-2 border-primary/60 hover:border-primary pb-0.5 w-fit mt-auto transition-colors"
                >
                  {item.cta_label || "Baca cerita"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
