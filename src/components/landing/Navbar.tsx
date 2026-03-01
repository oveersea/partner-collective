import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Building2, Users, Briefcase, Globe, Monitor, Search, GraduationCap, Award, FileText, Shield, Target, Layers, ArrowUpRight, Wallet, ClipboardCheck, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface MegaMenuItem {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}

interface MegaMenuData {
  label: string;
  tagline: string;
  cta: { label: string; href: string };
  leftLinks: { label: string; href: string }[];
  leftDescription: string;
  items: MegaMenuItem[];
}

const megaMenus: MegaMenuData[] = [
  {
    label: "Layanan",
    tagline: "Solusi end-to-end untuk kebutuhan talent & bisnis Anda",
    cta: { label: "Lihat semua layanan", href: "/features" },
    leftLinks: [
      { label: "Talent Matchmaking", href: "/matchmaking" },
      { label: "Hiring Request", href: "/hiring-request" },
      { label: "Project Request", href: "/project-request" },
      { label: "Vendor Registration", href: "/vendor-registration" },
    ],
    leftDescription: "Temukan talent terbaik, ajukan kebutuhan hiring, atau daftarkan bisnis Anda sebagai vendor terverifikasi.",
    items: [
      { icon: Search, title: "Talent Matchmaking", description: "Temukan talent dengan AI matching", href: "/matchmaking" },
      { icon: Briefcase, title: "Hiring Request", description: "Ajukan kebutuhan rekrutmen", href: "/hiring-request" },
      { icon: FileText, title: "Project Request", description: "Posting kebutuhan proyek", href: "/project-request" },
      { icon: Building2, title: "Vendor Registration", description: "Daftar sebagai vendor terverifikasi", href: "/vendor-registration" },
    ],
  },
  {
    label: "Platform",
    tagline: "Infrastruktur lengkap untuk manajemen workforce",
    cta: { label: "Masuk ke platform", href: "/dashboard" },
    leftLinks: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "KYC Verification", href: "/kyc" },
      { label: "Kredit & Saldo", href: "/credit-balance" },
      { label: "Fitur Lengkap", href: "/features" },
    ],
    leftDescription: "Platform terpadu untuk mengelola profil, verifikasi, kredit, dan seluruh aktivitas workforce.",
    items: [
      { icon: Layers, title: "Dashboard", description: "Pusat kendali profil & aktivitas", href: "/dashboard" },
      { icon: Shield, title: "KYC Verification", description: "Verifikasi identitas & kredensial", href: "/kyc" },
      { icon: Wallet, title: "Kredit & Saldo", description: "Top-up kredit & kelola saldo wallet", href: "/credit-balance" },
      { icon: CreditCard, title: "Fitur Lengkap", description: "Semua fitur platform Oveersea", href: "/features" },
    ],
  },
  {
    label: "Learning",
    tagline: "Tingkatkan skill dengan program & assessment terstruktur",
    cta: { label: "Jelajahi program", href: "/learning" },
    leftLinks: [
      { label: "Program Pelatihan", href: "/learning" },
      { label: "Assessment & Sertifikasi", href: "/learning" },
      { label: "Career Path", href: "/learning" },
      { label: "Katalog Kursus", href: "/learning" },
    ],
    leftDescription: "Akses program pelatihan, assessment kompetensi, dan sertifikasi untuk meningkatkan karir Anda.",
    items: [
      { icon: GraduationCap, title: "Program Pelatihan", description: "Kursus & pengembangan skill", href: "/learning" },
      { icon: ClipboardCheck, title: "Assessment", description: "Uji kompetensi & skill scoring", href: "/learning" },
      { icon: Award, title: "Sertifikasi", description: "Raih kredensial terverifikasi", href: "/learning" },
      { icon: Target, title: "Career Path", description: "Pemetaan jalur karir ideal", href: "/learning" },
    ],
  },
  {
    label: "Jobs",
    tagline: "Temukan peluang karir terbaik melalui Oveersea",
    cta: { label: "Lihat semua lowongan", href: "/matchmaking" },
    leftLinks: [
      { label: "Semua Lowongan", href: "/matchmaking" },
      { label: "Overseas Jobs", href: "/matchmaking" },
      { label: "Remote Jobs", href: "/matchmaking" },
      { label: "Full-time", href: "/matchmaking" },
    ],
    leftDescription: "Jelajahi peluang karir domestik & internasional dengan sistem matchmaking bertenaga AI.",
    items: [
      { icon: Briefcase, title: "Semua Lowongan", description: "Telusuri semua posisi tersedia", href: "/matchmaking" },
      { icon: Globe, title: "Overseas Jobs", description: "Peluang karir internasional", href: "/matchmaking" },
      { icon: Monitor, title: "Remote Jobs", description: "Kerja dari mana saja", href: "/matchmaking" },
      { icon: Users, title: "Full-time", description: "Posisi penuh waktu", href: "/matchmaking" },
    ],
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { user } = useAuth();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: "hsla(0 0% 4% / 0.95)", backdropFilter: "blur(16px)", borderColor: "hsl(0 0% 18%)" }}
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(0 79% 47%)" }}>
            <span className="text-white font-semibold text-sm">O</span>
          </div>
          <span className="font-display text-lg font-semibold text-white">Oveersea</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {megaMenus.map((menu) => (
            <div
              key={menu.label}
              className="relative"
              onMouseEnter={() => setActiveMenu(menu.label)}
            >
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: activeMenu === menu.label ? "white" : "hsl(0 0% 60%)" }}
              >
                {menu.label}
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeMenu === menu.label ? "rotate-180" : ""}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <button className="px-5 py-2 text-sm font-semibold rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <span className="text-sm font-medium cursor-pointer transition-colors" style={{ color: "hsl(0 0% 60%)" }}>Login</span>
              </Link>
              <Link to="/auth">
                <button className="px-5 py-2 text-sm font-semibold rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>
                  See a demo
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mega Menu Dropdown */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="hidden md:block absolute left-0 right-0 border-t"
            style={{ background: "hsl(0 0% 100%)", borderColor: "hsl(0 0% 90%)" }}
            onMouseEnter={() => setActiveMenu(activeMenu)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            {megaMenus.filter(m => m.label === activeMenu).map((menu) => (
              <MegaMenuContent key={menu.label} menu={menu} onClose={() => setActiveMenu(null)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t"
            style={{ background: "hsl(0 0% 4%)", borderColor: "hsl(0 0% 18%)" }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {megaMenus.map((menu) => (
                <MobileMenuGroup key={menu.label} menu={menu} onClose={() => setIsOpen(false)} />
              ))}
              <div className="flex gap-3 pt-3 mt-2" style={{ borderTop: "1px solid hsl(0 0% 18%)" }}>
                <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                  <button className="w-full py-2 text-sm font-medium rounded-lg" style={{ color: "hsl(0 0% 60%)" }}>Login</button>
                </Link>
                <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                  <button className="w-full py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>See a demo</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const MegaMenuContent = ({ menu, onClose }: { menu: MegaMenuData; onClose: () => void }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left column */}
          <div className="col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "hsl(0 79% 47%)" }}>
              {menu.label}
            </p>
            <ul className="space-y-1 mb-6">
              {menu.leftLinks.map((link, index) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="block py-1.5 text-sm font-medium transition-colors"
                    style={{ color: hoveredIndex === index ? "hsl(0 79% 47%)" : "hsl(0 0% 20%)" }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(0 0% 50%)" }}>
              {menu.leftDescription}
            </p>
            <Link
              to={menu.cta.href}
              className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "hsl(0 79% 47%)" }}
              onClick={onClose}
            >
              {menu.cta.label} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Right grid */}
          <div className="col-span-9">
            <div className="grid grid-cols-2 gap-4">
              {menu.items.map((item, index) => {
                const isHighlighted = hoveredIndex === null || hoveredIndex === index;
                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="flex items-start gap-4 rounded-xl p-4 transition-all duration-200 group"
                    style={{
                      opacity: isHighlighted ? 1 : 0.35,
                      background: hoveredIndex === index ? "hsl(0 79% 47% / 0.06)" : "transparent",
                      transform: hoveredIndex === index ? "scale(1.02)" : "scale(1)",
                    }}
                    onClick={onClose}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200"
                      style={{ background: hoveredIndex === index ? "hsl(0 79% 47% / 0.15)" : "hsl(0 79% 47% / 0.08)" }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: "hsl(0 79% 47%)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 10%)" }}>
                        {item.title}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: "hsl(0 0% 50%)" }}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t" style={{ borderColor: "hsl(0 0% 92%)" }}>
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-sm" style={{ color: "hsl(0 0% 50%)" }}>
            {menu.tagline}
          </p>
          <Link
            to={menu.cta.href}
            className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "hsl(0 79% 47%)" }}
            onClick={onClose}
          >
            {menu.cta.label} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const MobileMenuGroup = ({ menu, onClose }: { menu: MegaMenuData; onClose: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 text-sm font-medium"
        style={{ color: "hsl(0 0% 70%)" }}
      >
        {menu.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-3 pb-2 flex flex-col gap-1">
              {menu.leftLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="py-1.5 text-sm"
                  style={{ color: "hsl(0 0% 50%)" }}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
