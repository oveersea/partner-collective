import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Code, Palette, Briefcase, FileText, Calculator, ChevronRight, CheckCircle2, ArrowRight } from "lucide-react";

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

interface ServiceWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  required_skills: string[];
  provider_count: number;
  category_id: string;
}

const ServiceShowcaseSection = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [services, setServices] = useState<ServiceWithCount[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("service_categories")
        .select("id, name, slug, description, icon")
        .eq("is_active", true)
        .order("sort_order");
      if (data) {
        setCategories(data);
      }
    };
    fetchCategories();
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      let query = supabase
        .from("services")
        .select("id, name, slug, description, required_skills, category_id")
        .eq("is_active", true)
        .order("sort_order");

      if (activeCategory !== "all") {
        query = query.eq("category_id", activeCategory);
      }

      const { data: servicesData } = await query;

      if (servicesData) {
        // Get provider counts
        const serviceIds = servicesData.map(s => s.id);
        const { data: counts } = await supabase
          .from("user_services")
          .select("service_id")
          .in("service_id", serviceIds)
          .eq("is_active", true);

        const countMap: Record<string, number> = {};
        counts?.forEach(c => {
          countMap[c.service_id] = (countMap[c.service_id] || 0) + 1;
        });

        setServices(servicesData.map(s => ({
          ...s,
          required_skills: s.required_skills || [],
          provider_count: countMap[s.id] || 0,
        })));
      }
      setLoadingServices(false);
    };
    fetchServices();
  }, [activeCategory]);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Katalog Layanan</span>
          <h2 className="text-4xl md:text-5xl font-semibold mt-3 mb-5 text-foreground">
            Layanan dari <span className="text-gradient-accent">Talent Terverifikasi</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            Temukan layanan profesional dari talent yang telah terverifikasi skill-nya. Minimum 70% skill match dijamin.
          </p>
        </motion.div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 p-1.5 bg-muted/50 border border-border w-fit mx-auto" style={{ borderRadius: '5px' }}>
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all relative ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-card/80"
            }`}
            style={{ borderRadius: '5px' }}
          >
            Semua
          </button>
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon || ""] || Briefcase;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all relative ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/80"
                }`}
                style={{ borderRadius: '5px' }}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {loadingServices ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded-full w-16" />
                    <div className="h-6 bg-muted rounded-full w-20" />
                  </div>
                </div>
                <div className="h-12 border-t border-border bg-muted/30" />
              </div>
            ))
          ) : services.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Belum ada layanan di kategori ini.
            </div>
          ) : (
            services.map((service, i) => {
              const cat = categories.find(c => c.id === service.category_id);
              const Icon = iconMap[cat?.icon || ""] || Briefcase;
              return (
                <Link key={service.id} to={`/services/${service.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all h-full flex flex-col overflow-hidden"
                  >
                    {/* Card body */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>

                      {/* Title with chevron */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2 flex-1">
                        {service.description}
                      </p>

                      {/* Skill tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {service.required_skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                          >
                            <CheckCircle2 className="w-3 h-3 text-primary/50" />
                            {skill}
                          </span>
                        ))}
                        {service.required_skills.length > 4 && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            +{service.required_skills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-6 py-3.5 border-t border-border bg-muted/30 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Lihat detail
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                </Link>
              );
            })
          )}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/auth">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity" style={{ borderRadius: '5px' }}>
              Tawarkan Layanan Anda
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            Daftar, lengkapi profil skill Anda, dan mulai tawarkan layanan profesional.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceShowcaseSection;
