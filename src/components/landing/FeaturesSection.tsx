import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Megaphone, Code, Palette, Briefcase, FileText, Calculator, Sparkles } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Megaphone, Code, Palette, Briefcase, FileText, Calculator,
};

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

const FeaturesSection = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("service_categories")
        .select("id, name, slug, description, icon")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setCategories(data);
    };
    fetch();
  }, []);

  // Split into rows: first 3, next 3, remainder
  const row1 = categories.slice(0, 3);
  const row2 = categories.slice(3, 6);
  const remaining = categories.slice(6);

  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6 max-w-full">
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          {/* Row 1 */}
          {row1.length > 0 && (
            <div className="grid md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-border">
              {row1.map((cat, i) => (
                <CategoryCard key={cat.id} cat={cat} index={i} />
              ))}
            </div>
          )}

          {row2.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="grid md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-border">
                {row2.map((cat, i) => (
                  <CategoryCard key={cat.id} cat={cat} index={i + 3} />
                ))}
              </div>
            </>
          )}

          {/* Bottom row: CTA */}
          <div className="border-t border-border" />
          <Link
            to="/services"
            className="p-8 flex flex-col justify-center hover:bg-muted/50 transition-colors cursor-pointer"
            style={{ background: "hsl(var(--muted) / 0.3)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold text-card-foreground">Plus Ribuan Skill Lainnya</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Apapun skill atau spesialisasi yang bisnis Anda butuhkan, kami memiliki talenta terbaik untuk memenuhinya.
              </p>
              <span className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-3">
                Lihat semua layanan <ArrowRight className="w-4 h-4" />
              </span>
            </motion.div>
          </Link>
        </div>
      </div>
    </section>
  );
};

const CategoryCard = ({ cat, index }: { cat: ServiceCategory; index: number }) => {
  const Icon = iconMap[cat.icon || ""] || Briefcase;
  return (
    <Link to={`/services?category=${cat.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="p-8 group cursor-pointer hover:bg-muted/50 transition-colors h-full"
      >
        <div className="w-14 h-14 rounded-xl border border-border bg-background flex items-center justify-center mb-5 group-hover:border-primary/30 transition-colors">
          <Icon className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">{cat.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
        <span className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          Lihat detail <ArrowRight className="w-4 h-4" />
        </span>
      </motion.div>
    </Link>
  );
};

export default FeaturesSection;
