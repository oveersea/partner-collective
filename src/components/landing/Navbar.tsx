import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu, X, ChevronDown, ChevronRight, Building2, Users, Briefcase, Globe, Monitor, Search,
  GraduationCap, Award, FileText, Shield, Target, Layers, ArrowUpRight, Wallet,
  ClipboardCheck, CreditCard, UserCheck, FolderOpen, BarChart3, BookOpen,
  MapPin, Clock, Star, Handshake, Settings, Bell, CircleDollarSign, BadgeCheck,
  Compass, TrendingUp, Landmark, BriefcaseBusiness, ScrollText, PackageCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface SubMenuItem {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}

interface MasterItem {
  label: string;
  description: string;
  icon: React.ElementType;
  subItems: SubMenuItem[];
}

interface MegaMenuData {
  label: string;
  tagline: string;
  cta: { label: string; href: string };
  masters: MasterItem[];
}

const megaMenus: MegaMenuData[] = [
  {
    label: "Layanan",
    tagline: "Solusi end-to-end untuk kebutuhan talent & bisnis Anda",
    cta: { label: "Lihat semua layanan", href: "/features" },
    masters: [
      {
        label: "Talent Matchmaking",
        description: "Temukan talent terbaik dengan AI",
        icon: Search,
        subItems: [
          { icon: Search, title: "Cari Talent", description: "Pencarian talent dengan filter & AI scoring", href: "/matchmaking" },
          { icon: Star, title: "Top Rated Talent", description: "Talent dengan rating & review terbaik", href: "/matchmaking" },
          { icon: MapPin, title: "Talent Berdasarkan Lokasi", description: "Filter talent berdasarkan kota & negara", href: "/matchmaking" },
          { icon: BadgeCheck, title: "Talent Terverifikasi", description: "Talent yang sudah lolos KYC & assessment", href: "/matchmaking" },
          { icon: BarChart3, title: "Skill Matching Score", description: "Lihat skor kecocokan skill otomatis", href: "/matchmaking" },
          { icon: Users, title: "Talent Pool", description: "Simpan & kelola daftar talent favorit", href: "/matchmaking" },
        ],
      },
      {
        label: "Hiring Request",
        description: "Ajukan kebutuhan rekrutmen",
        icon: Briefcase,
        subItems: [
          { icon: Briefcase, title: "Buat Hiring Request", description: "Ajukan permintaan rekrutmen baru", href: "/hiring-request" },
          { icon: Clock, title: "Status Request", description: "Pantau progres hiring request Anda", href: "/hiring-request" },
          { icon: Users, title: "Kandidat Terpilih", description: "Lihat kandidat yang sudah di-match", href: "/hiring-request" },
          { icon: Handshake, title: "SLA & Timeline", description: "Pilih paket SLA sesuai kebutuhan", href: "/hiring-request" },
        ],
      },
      {
        label: "Project Request",
        description: "Posting kebutuhan proyek",
        icon: FolderOpen,
        subItems: [
          { icon: FileText, title: "Buat Project Brief", description: "Posting scope & kebutuhan proyek", href: "/project-request" },
          { icon: PackageCheck, title: "Project Ongoing", description: "Pantau proyek yang sedang berjalan", href: "/project-request" },
          { icon: Users, title: "Tim Proyek", description: "Kelola anggota tim proyek Anda", href: "/project-request" },
          { icon: ScrollText, title: "Riwayat Proyek", description: "Lihat semua proyek yang telah selesai", href: "/project-request" },
        ],
      },
      {
        label: "Vendor Registration",
        description: "Daftar sebagai vendor terverifikasi",
        icon: Building2,
        subItems: [
          { icon: Building2, title: "Daftar Vendor", description: "Registrasi bisnis sebagai vendor", href: "/vendor-registration" },
          { icon: Shield, title: "Verifikasi Bisnis", description: "Upload dokumen & verifikasi legalitas", href: "/vendor-registration" },
          { icon: Landmark, title: "Profil Perusahaan", description: "Kelola profil & portfolio bisnis", href: "/vendor-registration" },
          { icon: BriefcaseBusiness, title: "Kelola Penawaran", description: "Atur layanan & paket yang ditawarkan", href: "/vendor-registration" },
        ],
      },
    ],
  },
  {
    label: "Platform",
    tagline: "Infrastruktur lengkap untuk manajemen workforce",
    cta: { label: "Masuk ke platform", href: "/dashboard" },
    masters: [
      {
        label: "Dashboard",
        description: "Pusat kendali profil & aktivitas",
        icon: Layers,
        subItems: [
          { icon: Layers, title: "Overview", description: "Ringkasan profil, statistik, & notifikasi", href: "/dashboard" },
          { icon: UserCheck, title: "Edit Profil", description: "Update data diri, foto, & bio", href: "/dashboard" },
          { icon: GraduationCap, title: "Pendidikan", description: "Kelola riwayat pendidikan formal", href: "/dashboard" },
          { icon: Briefcase, title: "Pengalaman Kerja", description: "Tambah & edit riwayat karir", href: "/dashboard" },
          { icon: FolderOpen, title: "Portfolio", description: "Upload & showcase proyek terbaik", href: "/dashboard" },
          { icon: Users, title: "Tim & Organisasi", description: "Lihat tim & afiliasi organisasi", href: "/dashboard" },
        ],
      },
      {
        label: "KYC Verification",
        description: "Verifikasi identitas & kredensial",
        icon: Shield,
        subItems: [
          { icon: Shield, title: "Mulai Verifikasi", description: "Upload KTP, paspor, atau dokumen resmi", href: "/kyc" },
          { icon: BadgeCheck, title: "Status Verifikasi", description: "Cek progres & hasil verifikasi Anda", href: "/kyc" },
          { icon: FileText, title: "Dokumen Tersimpan", description: "Kelola dokumen yang telah di-upload", href: "/kyc" },
          { icon: Bell, title: "Notifikasi KYC", description: "Update terkait hasil review dokumen", href: "/kyc" },
        ],
      },
      {
        label: "Kredit & Saldo",
        description: "Top-up kredit & kelola wallet",
        icon: Wallet,
        subItems: [
          { icon: Wallet, title: "Saldo Wallet", description: "Lihat saldo & riwayat deposit", href: "/credit-balance" },
          { icon: CreditCard, title: "Top-up Kredit", description: "Beli paket kredit untuk layanan", href: "/credit-balance" },
          { icon: CircleDollarSign, title: "Riwayat Transaksi", description: "Detail semua transaksi masuk & keluar", href: "/credit-balance" },
          { icon: ScrollText, title: "Order & Invoice", description: "Lihat pesanan & bukti pembayaran", href: "/credit-balance" },
        ],
      },
      {
        label: "Fitur Lengkap",
        description: "Semua fitur platform Oveersea",
        icon: Settings,
        subItems: [
          { icon: Settings, title: "Semua Fitur", description: "Eksplorasi seluruh kapabilitas platform", href: "/features" },
          { icon: Bell, title: "Notifikasi", description: "Pusat notifikasi & alert penting", href: "/features" },
          { icon: Compass, title: "Panduan Penggunaan", description: "Tutorial & cara menggunakan platform", href: "/features" },
          { icon: TrendingUp, title: "Insight & Analytics", description: "Data performa & statistik aktivitas", href: "/features" },
        ],
      },
    ],
  },
  {
    label: "Learning",
    tagline: "Tingkatkan skill dengan program & assessment terstruktur",
    cta: { label: "Jelajahi program", href: "/learning" },
    masters: [
      {
        label: "Program Pelatihan",
        description: "Kursus & pengembangan skill",
        icon: GraduationCap,
        subItems: [
          { icon: GraduationCap, title: "Semua Program", description: "Telusuri katalog program pelatihan", href: "/learning" },
          { icon: BookOpen, title: "Kursus Online", description: "Belajar mandiri kapan saja & di mana saja", href: "/learning" },
          { icon: Users, title: "Bootcamp", description: "Program intensif dengan mentor langsung", href: "/learning" },
          { icon: Clock, title: "Program Berlangsung", description: "Lanjutkan program yang sedang diikuti", href: "/learning" },
        ],
      },
      {
        label: "Assessment & Sertifikasi",
        description: "Uji kompetensi & raih kredensial",
        icon: ClipboardCheck,
        subItems: [
          { icon: ClipboardCheck, title: "Mulai Assessment", description: "Ikuti tes kompetensi & skill scoring", href: "/learning" },
          { icon: Award, title: "Sertifikat Saya", description: "Lihat semua sertifikat yang telah diraih", href: "/learning" },
          { icon: BarChart3, title: "Skill Score", description: "Lihat skor & analisis kemampuan Anda", href: "/learning" },
          { icon: FileText, title: "Riwayat Tes", description: "Review hasil assessment sebelumnya", href: "/learning" },
          { icon: BadgeCheck, title: "Bukti Kompetensi", description: "Upload portfolio sebagai bukti skill", href: "/learning" },
        ],
      },
      {
        label: "Career Path",
        description: "Pemetaan jalur karir ideal",
        icon: Target,
        subItems: [
          { icon: Target, title: "Pilih Jalur Karir", description: "Eksplorasi career path yang tersedia", href: "/learning" },
          { icon: Compass, title: "Rekomendasi Karir", description: "Saran karir berdasarkan skill & minat", href: "/learning" },
          { icon: TrendingUp, title: "Skill Gap Analysis", description: "Identifikasi skill yang perlu ditingkatkan", href: "/learning" },
          { icon: Star, title: "Career Roadmap", description: "Peta jalan menuju karir impian Anda", href: "/learning" },
        ],
      },
    ],
  },
  {
    label: "Jobs",
    tagline: "Temukan peluang karir terbaik melalui Oveersea",
    cta: { label: "Lihat semua lowongan", href: "/matchmaking" },
    masters: [
      {
        label: "Semua Lowongan",
        description: "Telusuri semua posisi tersedia",
        icon: Briefcase,
        subItems: [
          { icon: Briefcase, title: "Browse Lowongan", description: "Lihat semua posisi yang sedang dibuka", href: "/matchmaking" },
          { icon: Star, title: "Rekomendasi Untukmu", description: "Lowongan yang cocok berdasarkan profil", href: "/matchmaking" },
          { icon: Clock, title: "Baru Ditambahkan", description: "Lowongan terbaru minggu ini", href: "/matchmaking" },
          { icon: Bell, title: "Job Alert", description: "Terima notifikasi lowongan baru", href: "/matchmaking" },
        ],
      },
      {
        label: "Overseas Jobs",
        description: "Peluang karir internasional",
        icon: Globe,
        subItems: [
          { icon: Globe, title: "Semua Negara", description: "Lowongan dari berbagai negara", href: "/matchmaking" },
          { icon: MapPin, title: "Asia Tenggara", description: "Singapura, Malaysia, Thailand, dll.", href: "/matchmaking" },
          { icon: MapPin, title: "Timur Tengah", description: "UAE, Qatar, Arab Saudi, dll.", href: "/matchmaking" },
          { icon: MapPin, title: "Asia Timur & Eropa", description: "Jepang, Korea, Jerman, dll.", href: "/matchmaking" },
        ],
      },
      {
        label: "Remote & Freelance",
        description: "Kerja dari mana saja",
        icon: Monitor,
        subItems: [
          { icon: Monitor, title: "Remote Full-time", description: "Posisi tetap dengan kerja remote", href: "/matchmaking" },
          { icon: Clock, title: "Part-time", description: "Kerja paruh waktu fleksibel", href: "/matchmaking" },
          { icon: FileText, title: "Freelance Project", description: "Proyek berbasis kontrak jangka pendek", href: "/matchmaking" },
          { icon: Handshake, title: "Contract", description: "Posisi kontrak jangka menengah", href: "/matchmaking" },
        ],
      },
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
            <div key={menu.label} className="relative" onMouseEnter={() => setActiveMenu(menu.label)}>
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
  const [activeMaster, setActiveMaster] = useState(0);
  const currentMaster = menu.masters[activeMaster];

  return (
    <div>
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-0">
          {/* Left master menu */}
          <div className="col-span-3 border-r pr-6" style={{ borderColor: "hsl(0 0% 92%)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(0 79% 47%)" }}>
              {menu.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {menu.masters.map((master, index) => (
                <button
                  key={master.label}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150"
                  style={{
                    background: activeMaster === index ? "hsl(0 79% 47% / 0.07)" : "transparent",
                    color: activeMaster === index ? "hsl(0 79% 47%)" : "hsl(0 0% 30%)",
                  }}
                  onMouseEnter={() => setActiveMaster(index)}
                >
                  <master.icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{master.label}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid hsl(0 0% 92%)" }}>
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

          {/* Right sub-menu */}
          <div className="col-span-9 pl-6">
            <div className="flex items-center gap-2 mb-4">
              <currentMaster.icon className="w-5 h-5" style={{ color: "hsl(0 79% 47%)" }} />
              <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 10%)" }}>
                {currentMaster.label}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(0 79% 47% / 0.08)", color: "hsl(0 79% 47%)" }}>
                {currentMaster.subItems.length} item
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: "hsl(0 0% 50%)" }}>
              {currentMaster.description}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMaster}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 gap-2"
              >
                {currentMaster.subItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="flex items-start gap-3 rounded-xl p-3 transition-all duration-150 hover:scale-[1.01]"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(0 0% 96%)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={onClose}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "hsl(0 79% 47% / 0.08)" }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: "hsl(0 79% 47%)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "hsl(0 0% 10%)" }}>
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(0 0% 50%)" }}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            </AnimatePresence>
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
  const [activeMaster, setActiveMaster] = useState<number | null>(null);

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
            <div className="pl-2 pb-2 flex flex-col gap-0.5">
              {menu.masters.map((master, index) => (
                <div key={master.label}>
                  <button
                    onClick={() => setActiveMaster(activeMaster === index ? null : index)}
                    className="w-full flex items-center justify-between py-2 px-2 text-sm rounded-md"
                    style={{ color: activeMaster === index ? "hsl(0 79% 47%)" : "hsl(0 0% 55%)" }}
                  >
                    <span className="flex items-center gap-2">
                      <master.icon className="w-3.5 h-3.5" />
                      {master.label}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${activeMaster === index ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {activeMaster === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 pb-1 flex flex-col gap-0.5">
                          {master.subItems.map((item) => (
                            <Link
                              key={item.title}
                              to={item.href}
                              className="py-1.5 text-xs"
                              style={{ color: "hsl(0 0% 45%)" }}
                              onClick={onClose}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
