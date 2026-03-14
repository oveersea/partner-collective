import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Brush, HardHat, ShieldCheck, Camera, Megaphone,
  TrendingUp, Scale, Calculator, UserCheck, Zap, CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const serviceQuickLinks = [
  { icon: Brush, label: "Cleaning", color: "hsl(180 60% 45%)" },
  { icon: HardHat, label: "Civil", color: "hsl(30 70% 50%)" },
  { icon: ShieldCheck, label: "Guard", color: "hsl(220 60% 50%)" },
  { icon: Camera, label: "Content Creator", color: "hsl(330 60% 50%)" },
  { icon: Megaphone, label: "Digital Marketer", color: "hsl(270 50% 55%)" },
  { icon: TrendingUp, label: "Sales", color: "hsl(150 55% 45%)" },
  { icon: Scale, label: "Legal", color: "hsl(200 50% 45%)" },
  { icon: Calculator, label: "Finance & Tax", color: "hsl(45 70% 50%)" },
  { icon: UserCheck, label: "Secretary", color: "hsl(350 55% 50%)" },
];

const stats = [
  { value: "10,000+", label: "Ready Workforce" },
  { value: "<24 Hrs", label: "Average Matching" },
  { value: "98%", label: "Satisfaction Rate" },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/services");
  };

  return (
    <section className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(0 0% 4%), hsl(0 0% 7%), hsl(0 0% 5%))" }}>
      {/* Accent glow */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[150px] opacity-10" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] opacity-8" style={{ background: "hsl(38 90% 55%)" }} />

      <div className="relative container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border" style={{ borderColor: "hsl(0 0% 20%)", background: "hsl(0 0% 10%)" }}>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium" style={{ color: "hsl(0 0% 65%)" }}>#1 On-Demand Services Platform in Indonesia</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center text-3xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.08] mb-4 sm:mb-6 max-w-4xl mx-auto"
        >
          Professional Workforce,{" "}
          <span className="text-gradient-accent">Whenever</span>{" "}
          You Need
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          style={{ color: "hsl(0 0% 50%)" }}
        >
          From cleaning, construction workers, to digital marketers & lawyers —
          find and book verified professionals in minutes.
        </motion.p>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSearch}
          className="max-w-xl mx-auto flex gap-0 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search services... (e.g. Cleaning, Legal, Sales)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 sm:h-14 pl-11 pr-4 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-white/40 rounded-l-lg rounded-r-none"
            />
          </div>
          <Button
            type="submit"
            className="h-12 sm:h-14 px-6 sm:px-8 text-sm font-semibold shrink-0 rounded-l-none rounded-r-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            Search
          </Button>
        </motion.form>

        {/* Popular */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap justify-center gap-2 mb-12 sm:mb-16 px-2"
        >
          <span className="text-xs" style={{ color: "hsl(0 0% 35%)" }}>Popular:</span>
          {["Cleaning", "Security Guard", "Content Creator", "Sales"].map((tag) => (
            <Link key={tag} to="/services" className="text-xs px-3 py-1 rounded-full border transition-colors hover:border-white/30" style={{ borderColor: "hsl(0 0% 18%)", color: "hsl(0 0% 55%)" }}>
              {tag}
            </Link>
          ))}
        </motion.div>

        {/* Service category grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-12 sm:mb-16"
        >
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4">
            {serviceQuickLinks.map((svc, i) => (
              <motion.div
                key={svc.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + i * 0.04 }}
              >
                <Link
                  to="/services"
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all hover:scale-105 hover:border-white/20 group"
                  style={{ borderColor: "hsl(0 0% 14%)", background: "hsl(0 0% 8%)" }}
                >
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${svc.color}20` }}
                  >
                    <svc.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: svc.color }} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-white/70 text-center leading-tight group-hover:text-white transition-colors">
                    {svc.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-6 sm:gap-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl sm:text-2xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs sm:text-sm" style={{ color: "hsl(0 0% 40%)" }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8"
        >
          {["KYC Verified", "Work Insurance", "Result Guarantee"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs" style={{ color: "hsl(0 0% 45%)" }}>{item}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
