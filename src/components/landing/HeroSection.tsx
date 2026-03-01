import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Trophy, Play, Users, Briefcase, GraduationCap, BarChart3, Wallet, Bell, Settings, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const socialProof = [
  { stars: 5, source: "Clutch", sub: "4.9 star rating" },
  { stars: 0, source: "Startup Award", sub: "Editor's Choice", icon: Trophy },
  { stars: 5, source: "GoodFirms", sub: "4.9 star rating" },
];

const sidebarItems = [
  { id: "talent", label: "Talent Pool", icon: Users },
  { id: "hiring", label: "Hiring", icon: Briefcase },
  { id: "learning", label: "Learning", icon: GraduationCap },
  { id: "assessment", label: "Assessment", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

const talentData = [
  { name: "Rina Maharani", role: "Frontend Dev", score: 94, color: "hsl(var(--primary))" },
  { name: "Budi Santoso", role: "Data Engineer", score: 91, color: "hsl(var(--primary))" },
  { name: "Ayu Lestari", role: "UI Designer", score: 88, color: "hsl(38 90% 55%)" },
  { name: "Dimas Pratama", role: "Backend Dev", score: 86, color: "hsl(38 90% 55%)" },
];

const hiringData = [
  { title: "Senior React Developer", status: "In Review", candidates: 12, urgency: "High" },
  { title: "Product Designer", status: "Matching", candidates: 8, urgency: "Medium" },
  { title: "Data Analyst", status: "Open", candidates: 5, urgency: "Low" },
];

const analyticsData = { totalTalent: "2,547", available: "1,832", inProcess: "715" };

const DashboardPanel = ({ activeTab }: { activeTab: string }) => {
  if (activeTab === "talent") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Talent Pool</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Total Talent", val: analyticsData.totalTalent },
            { label: "Available", val: analyticsData.available },
            { label: "In Process", val: analyticsData.inProcess },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ background: "hsl(0 0% 15%)" }}>
              <p className="text-base font-semibold text-white">{s.val}</p>
              <p className="text-[10px] text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {talentData.map((t) => (
            <div key={t.name} className="flex items-center gap-3 rounded-lg p-2.5" style={{ background: "hsl(0 0% 15%)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: "hsl(0 0% 22%)" }}>
                {t.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{t.name}</p>
                <p className="text-[10px] text-white/40">{t.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 20%)" }}>
                  <div className="h-full rounded-full" style={{ width: `${t.score}%`, background: t.color }} />
                </div>
                <span className="text-xs font-semibold text-white/70">{t.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "hiring") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Hiring Requests</h3>
        <div className="space-y-2">
          {hiringData.map((h) => (
            <div key={h.title} className="rounded-lg p-3" style={{ background: "hsl(0 0% 15%)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-white">{h.title}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${h.urgency === "High" ? "bg-red-500/20 text-red-400" : h.urgency === "Medium" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>{h.urgency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">{h.status}</span>
                <span className="text-[10px] text-white/50">{h.candidates} candidates</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "analytics") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Analytics Overview</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Match Rate", val: "98%" },
            { label: "Avg. Time to Hire", val: "<3 days" },
            { label: "Active Projects", val: "24" },
            { label: "Completion Rate", val: "96%" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: "hsl(0 0% 15%)" }}>
              <p className="text-lg font-semibold text-white">{s.val}</p>
              <p className="text-[10px] text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Mini bar chart */}
        <div className="flex items-end gap-1.5 h-20 px-2">
          {[40, 65, 50, 80, 60, 90, 75, 85, 70, 95, 80, 88].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i >= 10 ? "hsl(var(--primary))" : "hsl(0 0% 25%)" }} />
          ))}
        </div>
        <div className="flex justify-between px-2 mt-1">
          <span className="text-[9px] text-white/30">Jan</span>
          <span className="text-[9px] text-white/30">Dec</span>
        </div>
      </div>
    );
  }

  // Default for other tabs
  return (
    <div className="flex items-center justify-center h-40">
      <p className="text-xs text-white/40">Coming soon...</p>
    </div>
  );
};

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("talent");
  const navigate = useNavigate();

  const handleCTA = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/auth");
  };

  return (
    <section className="relative min-h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(0 0% 5%), hsl(0 0% 8%), hsl(0 0% 6%))" }}>
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15" style={{ background: "hsl(0 79% 47%)" }} />

      <div className="relative container mx-auto px-6 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-7rem)]">
          {/* Left: Content */}
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 mb-8">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(0 79% 47%)" }}>
                <span className="text-xs font-semibold text-white">G</span>
              </div>
              <span className="text-sm font-semibold text-white">4.8 stars</span>
              <span className="text-sm" style={{ color: "hsl(0 0% 55%)" }}>13k+ reviews</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1] mb-6">
              Partner & tim terbaik untuk bisnis Anda
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg leading-relaxed mb-10" style={{ color: "hsl(0 0% 55%)" }}>
              Temukan partner freelance & tim terverifikasi KYC. Dari hiring request hingga project request — semua dimulai dengan kualitas.
            </motion.p>

            <motion.form initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} onSubmit={handleCTA} className="flex flex-col sm:flex-row gap-0 mb-4">
              <Input type="email" placeholder="Email bisnis Anda*" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 px-5 text-base rounded-xl sm:rounded-r-none bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-white/40" />
              <Button type="submit" className="h-14 px-8 text-base font-semibold rounded-xl sm:rounded-l-none shrink-0" style={{ background: "hsl(0 79% 47%)", color: "white" }}>
                Buat akun gratis
              </Button>
            </motion.form>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs mb-8" style={{ color: "hsl(0 0% 45%)" }}>
              Kami menjaga privasi Anda.{" "}
              <a href="#" className="underline hover:text-white transition-colors">Pelajari lebih lanjut</a>.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mb-12">
              <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white/60 transition-colors">
                  <Play className="w-3.5 h-3.5 fill-white/80" />
                </div>
                Lihat demo platform
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="flex flex-wrap items-center gap-8 lg:gap-12">
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
                  <p className="text-sm font-semibold text-white">{item.source}</p>
                  <p className="text-xs" style={{ color: "hsl(0 0% 45%)" }}>{item.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Interactive Mini Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ background: "hsl(0 0% 10%)" }}>
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10" style={{ background: "hsl(0 0% 8%)" }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-5 rounded-md px-3 flex items-center text-[10px] text-white/30" style={{ background: "hsl(0 0% 14%)" }}>
                    oveersea.app/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard body */}
              <div className="flex" style={{ minHeight: 360 }}>
                {/* Sidebar */}
                <div className="w-16 border-r border-white/10 py-3 flex flex-col items-center gap-1" style={{ background: "hsl(0 0% 8%)" }}>
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                        activeTab === item.id
                          ? "text-white"
                          : "text-white/30 hover:text-white/60"
                      }`}
                      style={activeTab === item.id ? { background: "hsl(0 0% 18%)" } : {}}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-[8px] leading-none">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DashboardPanel activeTab={activeTab} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
