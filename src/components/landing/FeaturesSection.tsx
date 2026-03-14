import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Brush, HardHat, ShieldCheck, Camera, Megaphone, TrendingUp,
  Scale, Calculator, UserCheck, ArrowRight, Sparkles
} from "lucide-react";

const services = [
  {
    icon: Brush,
    title: "Cleaning",
    description: "Professional cleaning staff for homes, offices, and commercial areas. Available daily or on contract.",
    tags: ["Deep Clean", "Office", "Residential"],
    color: "hsl(180 60% 45%)",
  },
  {
    icon: HardHat,
    title: "Civil (Construction)",
    description: "Verified construction workers for renovation, repair, and light construction projects.",
    tags: ["Renovation", "Repair", "Construction"],
    color: "hsl(30 70% 50%)",
  },
  {
    icon: ShieldCheck,
    title: "Security Guard",
    description: "Trained security officers for events, buildings, and commercial areas.",
    tags: ["Guard", "Event Security", "Patrol"],
    color: "hsl(220 60% 50%)",
  },
  {
    icon: Camera,
    title: "Content Creator",
    description: "Photographers, videographers, and content creators for social media & branding needs.",
    tags: ["Photo", "Video", "Social Media"],
    color: "hsl(330 60% 50%)",
  },
  {
    icon: Megaphone,
    title: "Digital Marketer",
    description: "Digital marketing experts: SEO, SEM, social media ads, and growth hacking strategies.",
    tags: ["SEO", "Ads", "Growth"],
    color: "hsl(270 50% 55%)",
  },
  {
    icon: TrendingUp,
    title: "Sales",
    description: "Temporary & permanent sales professionals for B2B, B2C, retail, and direct selling.",
    tags: ["Temporary", "Permanent", "B2B"],
    color: "hsl(150 55% 45%)",
  },
  {
    icon: Scale,
    title: "Legal & Lawyer",
    description: "Legal consultants, attorneys, and legal advisors for business and personal needs.",
    tags: ["Contract", "Licensing", "Litigation"],
    color: "hsl(200 50% 45%)",
  },
  {
    icon: Calculator,
    title: "Finance & Tax",
    description: "Accountants, tax consultants, and financial planners for individuals and businesses.",
    tags: ["Tax", "Accounting", "Audit"],
    color: "hsl(45 70% 50%)",
  },
  {
    icon: UserCheck,
    title: "Secretary",
    description: "Professional secretaries and assistants: scheduling, correspondence, and administration.",
    tags: ["Admin", "Scheduling", "Virtual"],
    color: "hsl(350 55% 50%)",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-12 sm:py-24 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest">On-Demand Services</span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold mt-2 sm:mt-3 mb-3 sm:mb-5 text-foreground">
            Every Need, <span className="text-gradient-accent">One Platform</span>
          </h2>
          <p className="text-sm sm:text-lg max-w-2xl mx-auto text-muted-foreground">
            From physical labor to digital professionals — book quality services with verified guarantees.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {services.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to="/services">
                <div className="group flex flex-col items-center gap-3 p-4 sm:p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${svc.color}15` }}
                  >
                    <svc.icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: svc.color }} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground text-center leading-tight group-hover:text-primary transition-colors">
                    {svc.title}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <Link to="/services">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 p-5 sm:p-8 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">And Thousands More Services</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Whatever your business workforce needs, we provide the best professionals to fulfill them.
            </p>
            <span className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-3">
              View all services <ArrowRight className="w-4 h-4" />
            </span>
          </motion.div>
        </Link>
      </div>
    </section>
  );
};

export default FeaturesSection;
