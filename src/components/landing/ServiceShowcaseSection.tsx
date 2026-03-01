import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Code, Palette, Briefcase, FileText, Calculator, Users, ArrowRight, CheckCircle2 } from "lucide-react";

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
}

const ServiceShowcaseSection = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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
        if (data.length > 0) setActiveCategory(data[0].id);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    const fetchServices = async () => {
      setLoadingServices(true);
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name, slug, description, required_skills")
        .eq("category_id", activeCategory)
        .eq("is_active", true)
        .order("sort_order");

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
        <div className="flex flex-wrap justify-center gap-3 mb-12 p-1.5 bg-muted/50 rounded-lg border border-border w-fit mx-auto">
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
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 animate-pulse">
                <div className="h-5 bg-muted rounded w-2/3 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded-full w-16" />
                  <div className="h-6 bg-muted rounded-full w-20" />
                </div>
              </div>
            ))
          ) : services.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Belum ada layanan di kategori ini.
            </div>
          ) : (
            services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all p-6" style={{ borderRadius: '5px' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  {service.provider_count > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                      <Users className="w-3 h-3" />
                      {service.provider_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {service.required_skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                    >
                      <CheckCircle2 className="w-3 h-3 text-primary/60" />
                      {skill}
                    </span>
                  ))}
                  {service.required_skills.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      +{service.required_skills.length - 4}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
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
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
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
