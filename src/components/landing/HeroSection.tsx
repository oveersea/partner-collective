import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Trophy, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroDashboard from "@/assets/hero-dashboard.png";

const socialProof = [
  { stars: 5, source: "Clutch", sub: "4.9 star rating" },
  { stars: 0, source: "Startup Award", sub: "Editor's Choice", icon: Trophy },
  { stars: 5, source: "GoodFirms", sub: "4.9 star rating" },
];

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleCTA = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/auth");
  };

  return (
    <section className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 60% 16%), hsl(270 50% 20%), hsl(265 45% 22%))" }}>
      {/* Subtle glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20" style={{ background: "hsl(270 60% 40%)" }} />

      <div className="relative container mx-auto px-6 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-7rem)]">
          {/* Left: Content */}
          <div className="max-w-xl">
            {/* Rating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(160 84% 39%)" }}>
                <span className="text-xs font-bold text-white">G</span>
              </div>
              <span className="text-sm font-semibold text-white">4.8 stars</span>
              <span className="text-sm" style={{ color: "hsl(270 20% 70%)" }}>13k+ reviews</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6"
            >
              Partner & tim terbaik untuk bisnis Anda
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg leading-relaxed mb-10"
              style={{ color: "hsl(270 20% 70%)" }}
            >
              Temukan partner freelance & tim terverifikasi KYC. Dari hiring request hingga project request — semua dimulai dengan kualitas.
            </motion.p>

            {/* Email CTA */}
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleCTA}
              className="flex flex-col sm:flex-row gap-0 mb-4"
            >
              <Input
                type="email"
                placeholder="Email bisnis Anda*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 px-5 text-base rounded-xl sm:rounded-r-none bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-white/40"
              />
              <Button
                type="submit"
                className="h-14 px-8 text-base font-semibold rounded-xl sm:rounded-l-none shrink-0"
                style={{ background: "hsl(38 90% 55%)", color: "hsl(270 50% 12%)" }}
              >
                Buat akun gratis
              </Button>
            </motion.form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs mb-8"
              style={{ color: "hsl(270 20% 60%)" }}
            >
              Kami menjaga privasi Anda.{" "}
              <a href="#" className="underline hover:text-white transition-colors">Pelajari lebih lanjut</a>.
            </motion.p>

            {/* Product tour link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mb-12"
            >
              <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white/60 transition-colors">
                  <Play className="w-3.5 h-3.5 fill-white/80" />
                </div>
                Lihat demo platform
              </Link>
            </motion.div>

            {/* Social proof badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-8 lg:gap-12"
            >
              {socialProof.map((item, i) => (
                <div key={i} className="text-center">
                  {item.stars > 0 ? (
                    <div className="flex items-center justify-center gap-0.5 mb-1.5">
                      {Array.from({ length: item.stars }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  ) : item.icon ? (
                    <div className="flex items-center justify-center mb-1.5">
                      <item.icon className="w-5 h-5 text-amber-400" />
                    </div>
                  ) : null}
                  <p className="text-sm font-bold text-white">{item.source}</p>
                  <p className="text-xs" style={{ color: "hsl(270 20% 60%)" }}>{item.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard image */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center"
          >
            <img
              src={heroDashboard}
              alt="PartnerHub dashboard interface showing HR, partner management, and workflow features"
              className="w-full max-w-lg xl:max-w-xl rounded-3xl shadow-2xl"
              loading="eager"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
