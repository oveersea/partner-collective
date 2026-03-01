import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Code, Palette, Briefcase, FileText, Calculator, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Megaphone, Code, Palette, Briefcase, FileText, Calculator,
};

// Service thumbnail imports
import imgDigitalMarketing from "@/assets/services/digital-marketing.jpg";
import imgDigitalMarketing2 from "@/assets/services/digital-marketing-2.jpg";
import imgDigitalMarketing3 from "@/assets/services/digital-marketing-3.jpg";
import imgWebDevelopment from "@/assets/services/web-development.jpg";
import imgWebDevelopment2 from "@/assets/services/web-development-2.jpg";
import imgWebDevelopment3 from "@/assets/services/web-development-3.jpg";
import imgUiUxDesign from "@/assets/services/ui-ux-design.jpg";
import imgUiUxDesign2 from "@/assets/services/ui-ux-design-2.jpg";
import imgUiUxDesign3 from "@/assets/services/ui-ux-design-3.jpg";
import imgBusinessConsulting from "@/assets/services/business-consulting.jpg";
import imgBusinessConsulting2 from "@/assets/services/business-consulting-2.jpg";
import imgBusinessConsulting3 from "@/assets/services/business-consulting-3.jpg";
import imgContentWriting from "@/assets/services/content-writing.jpg";
import imgContentWriting2 from "@/assets/services/content-writing-2.jpg";
import imgContentWriting3 from "@/assets/services/content-writing-3.jpg";
import imgAccountingTax from "@/assets/services/accounting-tax.jpg";
import imgAccountingTax2 from "@/assets/services/accounting-tax-2.jpg";
import imgAccountingTax3 from "@/assets/services/accounting-tax-3.jpg";
import imgMobileDevelopment from "@/assets/services/mobile-development.jpg";
import imgMobileDevelopment2 from "@/assets/services/mobile-development-2.jpg";
import imgMobileDevelopment3 from "@/assets/services/mobile-development-3.jpg";
import imgFinancialPlanning from "@/assets/services/financial-planning.jpg";
import imgFinancialPlanning2 from "@/assets/services/financial-planning-2.jpg";
import imgFinancialPlanning3 from "@/assets/services/financial-planning-3.jpg";
import imgGraphicDesign from "@/assets/services/graphic-design.jpg";
import imgGraphicDesign2 from "@/assets/services/graphic-design-2.jpg";
import imgGraphicDesign3 from "@/assets/services/graphic-design-3.jpg";
import imgVideoProduction from "@/assets/services/video-production.jpg";
import imgVideoProduction2 from "@/assets/services/video-production-2.jpg";
import imgVideoProduction3 from "@/assets/services/video-production-3.jpg";
import imgSocialMedia from "@/assets/services/social-media.jpg";
import imgSocialMedia2 from "@/assets/services/social-media-2.jpg";
import imgSocialMedia3 from "@/assets/services/social-media-3.jpg";
import imgHrRecruitment from "@/assets/services/hr-recruitment.jpg";
import imgHrRecruitment2 from "@/assets/services/hr-recruitment-2.jpg";
import imgHrRecruitment3 from "@/assets/services/hr-recruitment-3.jpg";
import imgDataAnalytics from "@/assets/services/data-analytics.jpg";
import imgDataAnalytics2 from "@/assets/services/data-analytics-2.jpg";
import imgDataAnalytics3 from "@/assets/services/data-analytics-3.jpg";
import imgSeoSem from "@/assets/services/seo-sem.jpg";
import imgSeoSem2 from "@/assets/services/seo-sem-2.jpg";
import imgSeoSem3 from "@/assets/services/seo-sem-3.jpg";
import imgMotionGraphics from "@/assets/services/motion-graphics.jpg";
import imgMotionGraphics2 from "@/assets/services/motion-graphics-2.jpg";
import imgMotionGraphics3 from "@/assets/services/motion-graphics-3.jpg";
import imgCloudDevops from "@/assets/services/cloud-devops.jpg";
import imgCloudDevops2 from "@/assets/services/cloud-devops-2.jpg";
import imgCloudDevops3 from "@/assets/services/cloud-devops-3.jpg";
import imgEmailMarketing from "@/assets/services/email-marketing.jpg";
import imgEmailMarketing2 from "@/assets/services/email-marketing-2.jpg";
import imgEmailMarketing3 from "@/assets/services/email-marketing-3.jpg";

const serviceImageMap: Record<string, string[]> = {
  "digital-marketing": [imgDigitalMarketing, imgDigitalMarketing2, imgDigitalMarketing3],
  "web-development": [imgWebDevelopment, imgWebDevelopment2, imgWebDevelopment3],
  "ui-ux-design": [imgUiUxDesign, imgUiUxDesign2, imgUiUxDesign3],
  "business-consulting": [imgBusinessConsulting, imgBusinessConsulting2, imgBusinessConsulting3],
  "content-writing": [imgContentWriting, imgContentWriting2, imgContentWriting3],
  "accounting-tax": [imgAccountingTax, imgAccountingTax2, imgAccountingTax3],
  "mobile-development": [imgMobileDevelopment, imgMobileDevelopment2, imgMobileDevelopment3],
  "financial-planning": [imgFinancialPlanning, imgFinancialPlanning2, imgFinancialPlanning3],
  "graphic-design": [imgGraphicDesign, imgGraphicDesign2, imgGraphicDesign3],
  "video-production": [imgVideoProduction, imgVideoProduction2, imgVideoProduction3],
  "social-media-management": [imgSocialMedia, imgSocialMedia2, imgSocialMedia3],
  "hr-recruitment": [imgHrRecruitment, imgHrRecruitment2, imgHrRecruitment3],
  "data-analytics": [imgDataAnalytics, imgDataAnalytics2, imgDataAnalytics3],
  "seo-sem": [imgSeoSem, imgSeoSem2, imgSeoSem3],
  "motion-graphics": [imgMotionGraphics, imgMotionGraphics2, imgMotionGraphics3],
  "cloud-devops": [imgCloudDevops, imgCloudDevops2, imgCloudDevops3],
  "email-marketing": [imgEmailMarketing, imgEmailMarketing2, imgEmailMarketing3],
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
                <div className="h-40 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
                <div className="h-14 border-t border-border bg-muted/30" />
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
              const thumbnailImgs = serviceImageMap[service.slug];
              return (
                <Link key={service.id} to={`/services/${service.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all h-full flex flex-col overflow-hidden"
                  >
                    {/* Thumbnail grid */}
                    <div className="grid grid-cols-3 gap-0.5 h-40 bg-muted overflow-hidden">
                      {thumbnailImgs ? (
                        <>
                          <img src={thumbnailImgs[0]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <img src={thumbnailImgs[1]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <img src={thumbnailImgs[2]} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </>
                      ) : (
                        <div className="col-span-3 w-full h-full bg-gradient-to-br from-primary/10 via-muted to-accent/10 flex items-center justify-center">
                          <Icon className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-1">
                        {service.name}
                      </h3>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
                        {service.description}
                      </p>

                      {/* Skill tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {service.required_skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                        {service.required_skills.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            +{service.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA footer */}
                    <div className="px-5 py-3.5 border-t border-border bg-muted/30 flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {service.provider_count > 0 ? `${service.provider_count} penyedia tersedia` : "Segera hadir"}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                        Lihat Detail
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
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
