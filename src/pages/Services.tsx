import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Users, CheckCircle2, Megaphone, Code, Palette, Briefcase, FileText, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

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

const Services = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("service_categories")
        .select("id, name, slug, description, icon")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);

      // Find category_id from slug
      let categoryId: string | null = null;
      if (categoryParam !== "all" && categories.length > 0) {
        const found = categories.find(c => c.slug === categoryParam || c.id === categoryParam);
        categoryId = found?.id || null;
      }

      let query = supabase
        .from("services")
        .select("id, name, slug, description, required_skills")
        .eq("is_active", true)
        .order("sort_order");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data: servicesData } = await query;

      if (servicesData) {
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
      setLoading(false);
    };

    if (categories.length > 0 || categoryParam === "all") {
      fetchServices();
    }
  }, [categoryParam, categories]);

  const activeCategoryName = categoryParam === "all"
    ? "Semua Layanan"
    : categories.find(c => c.slug === categoryParam || c.id === categoryParam)?.name || "Layanan";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4">
              Katalog <span className="text-gradient-accent">Layanan</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Temukan layanan profesional dari talent terverifikasi untuk membantu bisnis Anda berkembang.
            </p>
          </motion.div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            <Link to="/services?category=all">
              <Button variant={categoryParam === "all" ? "default" : "outline"} size="sm" className="rounded-full">Semua</Button>
            </Link>
            {categories.map(cat => {
              const isActive = categoryParam === cat.slug || categoryParam === cat.id;
              return (
                <Link key={cat.id} to={`/services?category=${cat.slug}`}>
                  <Button variant={isActive ? "default" : "outline"} size="sm" className="rounded-full">{cat.name}</Button>
                </Link>
              );
            })}
          </div>

          {/* Services grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-8 rounded-2xl border border-border bg-card animate-pulse">
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
                <Link key={service.id} to={`/services/${service.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group p-8 rounded-2xl border border-border bg-card hover:shadow-card-hover hover:border-primary/30 transition-all h-full cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {service.name}
                      </h2>
                      {service.provider_count > 0 && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                          <Users className="w-3 h-3" />
                          {service.provider_count}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {service.required_skills.slice(0, 4).map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {skill}
                        </span>
                      ))}
                      {service.required_skills.length > 4 && (
                        <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                          +{service.required_skills.length - 4}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Lihat detail <ArrowRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
