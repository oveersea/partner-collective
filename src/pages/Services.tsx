import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, CheckCircle2, Megaphone, Code, Palette, Briefcase, FileText, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    ? "All Services"
    : categories.find(c => c.slug === categoryParam || c.id === categoryParam)?.name || "Services";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold text-foreground mb-2">
              Service <span className="text-gradient-accent">Catalog</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl">
              Discover professional services from verified talents to help your business grow.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-2 mb-10">
            <Link to="/services?category=all">
              <Button variant={categoryParam === "all" ? "default" : "outline"} size="sm" className="rounded-full">All</Button>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div></CardContent></Card>
              ))
            ) : services.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No services in this category yet.
              </div>
            ) : (
              services.map((service, i) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link to={`/services/${service.slug}`}>
                    <Card className="group hover:shadow-md transition-all h-full cursor-pointer">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {service.name}
                          </h2>
                          {service.provider_count > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                              <Users className="w-3 h-3" />
                              {service.provider_count}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {service.required_skills.slice(0, 3).map(skill => (
                            <span key={skill} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {skill}
                            </span>
                          ))}
                          {service.required_skills.length > 3 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              +{service.required_skills.length - 3}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
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
