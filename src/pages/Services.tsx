import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Search,
  Brush, HardHat, ShieldCheck, Camera, Megaphone, TrendingUp,
  Scale, Calculator, UserCheck, Sparkles, CheckCircle2, Phone, Clock
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ServiceCategory {
  slug: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  subServices: {
    name: string;
    description: string;
    tags: string[];
    availability: string;
  }[];
}

const categories: ServiceCategory[] = [
  {
    slug: "cleaning",
    name: "Cleaning",
    icon: Brush,
    color: "hsl(180 60% 45%)",
    description: "Tenaga kebersihan profesional untuk rumah, kantor, gudang, dan area komersial.",
    subServices: [
      { name: "Office Cleaning", description: "Kebersihan rutin kantor harian atau mingguan", tags: ["Harian", "Mingguan", "Bulanan"], availability: "Tersedia 24 Jam" },
      { name: "Deep Cleaning", description: "Pembersihan menyeluruh termasuk karpet, kaca, dan AC", tags: ["Rumah", "Kantor", "Gudang"], availability: "Booking H-1" },
      { name: "Post-Construction Cleaning", description: "Bersih-bersih setelah renovasi atau pembangunan", tags: ["Konstruksi", "Renovasi"], availability: "Booking H-2" },
      { name: "Industrial Cleaning", description: "Kebersihan pabrik, gudang, dan area industri", tags: ["Pabrik", "Gudang", "Industri"], availability: "Kontrak Bulanan" },
    ],
  },
  {
    slug: "civil",
    name: "Civil (Tukang Bangunan)",
    icon: HardHat,
    color: "hsl(30 70% 50%)",
    description: "Tukang bangunan, renovasi, perbaikan, dan konstruksi ringan dengan keahlian terverifikasi.",
    subServices: [
      { name: "Renovasi Rumah", description: "Renovasi kamar, dapur, kamar mandi, dan ruang tamu", tags: ["Interior", "Eksterior"], availability: "Booking H-3" },
      { name: "Perbaikan & Maintenance", description: "Perbaikan atap, dinding, plumbing, dan listrik", tags: ["Plumbing", "Listrik", "Atap"], availability: "Tersedia Hari Ini" },
      { name: "Konstruksi Ringan", description: "Pembangunan pagar, carport, kanopi, dan partisi", tags: ["Pagar", "Kanopi", "Partisi"], availability: "Booking H-3" },
      { name: "Cat & Finishing", description: "Pengecatan interior-eksterior dan finishing dinding", tags: ["Cat", "Wallpaper", "Plester"], availability: "Booking H-1" },
    ],
  },
  {
    slug: "guard",
    name: "Pengamanan (Guard)",
    icon: ShieldCheck,
    color: "hsl(220 60% 50%)",
    description: "Satpam dan petugas keamanan terlatih untuk gedung, acara, dan area komersial.",
    subServices: [
      { name: "Security Guard", description: "Satpam terlatih untuk gedung perkantoran dan perumahan", tags: ["24 Jam", "Shift"], availability: "Tersedia Besok" },
      { name: "Event Security", description: "Pengamanan acara, konser, pameran, dan gathering", tags: ["Acara", "Konser", "Pameran"], availability: "Booking H-3" },
      { name: "VIP Protection", description: "Pengawal pribadi untuk eksekutif dan tamu VIP", tags: ["Personal", "Eksekutif"], availability: "Booking H-7" },
      { name: "Patroli & Monitoring", description: "Layanan patroli berkala dan pemantauan CCTV", tags: ["Patroli", "CCTV", "Monitoring"], availability: "Kontrak Bulanan" },
    ],
  },
  {
    slug: "content-creator",
    name: "Content Creator",
    icon: Camera,
    color: "hsl(330 60% 50%)",
    description: "Fotografer, videografer, dan kreator konten untuk kebutuhan sosial media & branding.",
    subServices: [
      { name: "Social Media Content", description: "Konten foto & video untuk Instagram, TikTok, dan YouTube", tags: ["Instagram", "TikTok", "YouTube"], availability: "Booking H-2" },
      { name: "Product Photography", description: "Foto produk profesional untuk e-commerce dan katalog", tags: ["E-commerce", "Katalog", "Flatlay"], availability: "Booking H-3" },
      { name: "Video Production", description: "Produksi video company profile, iklan, dan testimonial", tags: ["Company Profile", "Iklan", "Testimonial"], availability: "Booking H-5" },
      { name: "Live Streaming", description: "Host & operator untuk live shopping dan webinar", tags: ["Live Shopping", "Webinar"], availability: "Booking H-3" },
    ],
  },
  {
    slug: "digital-marketer",
    name: "Digital Marketer",
    icon: Megaphone,
    color: "hsl(270 50% 55%)",
    description: "Ahli pemasaran digital: SEO, SEM, social media ads, dan strategi growth hacking.",
    subServices: [
      { name: "Social Media Management", description: "Kelola akun sosial media, content plan, dan engagement", tags: ["Instagram", "LinkedIn", "Facebook"], availability: "Kontrak Bulanan" },
      { name: "SEO & SEM", description: "Optimasi mesin pencari dan iklan Google/Bing", tags: ["Google Ads", "SEO", "SEM"], availability: "Kontrak Bulanan" },
      { name: "Performance Marketing", description: "Facebook Ads, Instagram Ads, TikTok Ads dengan ROI tracking", tags: ["Meta Ads", "TikTok Ads"], availability: "Booking H-3" },
      { name: "Email Marketing", description: "Campaign email, newsletter, dan automation", tags: ["Mailchimp", "Automation"], availability: "Booking H-3" },
    ],
  },
  {
    slug: "sales",
    name: "Sales",
    icon: TrendingUp,
    color: "hsl(150 55% 45%)",
    description: "Tenaga penjualan temporary & permanent untuk B2B, B2C, retail, dan direct selling.",
    subServices: [
      { name: "Sales Temporary", description: "SPG/SPB untuk event, pameran, dan launching produk", tags: ["Event", "Pameran", "Promo"], availability: "Booking H-2" },
      { name: "Sales Permanent", description: "Tenaga sales full-time untuk tim penjualan Anda", tags: ["B2B", "B2C", "Full-time"], availability: "Booking H-7" },
      { name: "Telemarketing", description: "Tim telemarketing terlatih untuk cold calling dan follow-up", tags: ["Outbound", "Inbound"], availability: "Booking H-3" },
      { name: "Sales Canvassing", description: "Tim canvasser untuk door-to-door dan direct selling", tags: ["D2D", "Direct Selling"], availability: "Booking H-3" },
    ],
  },
  {
    slug: "legal",
    name: "Legal & Lawyer",
    icon: Scale,
    color: "hsl(200 50% 45%)",
    description: "Konsultan hukum, pengacara, dan legal advisor untuk kebutuhan bisnis dan pribadi.",
    subServices: [
      { name: "Konsultasi Hukum", description: "Konsultasi dengan pengacara berpengalaman via online/offline", tags: ["Online", "Offline"], availability: "Booking H-1" },
      { name: "Drafting Kontrak", description: "Pembuatan dan review kontrak, NDA, MoU, dan perjanjian", tags: ["Kontrak", "NDA", "MoU"], availability: "Booking H-3" },
      { name: "Perizinan Bisnis", description: "Pengurusan PT, CV, izin usaha, dan legalitas perusahaan", tags: ["PT", "CV", "NIB"], availability: "Booking H-5" },
      { name: "Litigasi & Sengketa", description: "Pendampingan hukum untuk sengketa dan proses peradilan", tags: ["Pengadilan", "Mediasi"], availability: "Konsultasi Dulu" },
    ],
  },
  {
    slug: "finance-tax",
    name: "Finance & Tax",
    icon: Calculator,
    color: "hsl(45 70% 50%)",
    description: "Akuntan, konsultan pajak, dan perencana keuangan untuk individu maupun perusahaan.",
    subServices: [
      { name: "Pembukuan & Akuntansi", description: "Jasa pembukuan, laporan keuangan, dan rekonsiliasi", tags: ["Pembukuan", "Laporan", "PSAK"], availability: "Kontrak Bulanan" },
      { name: "Konsultasi Pajak", description: "Perencanaan pajak, pelaporan SPT, dan compliance", tags: ["SPT", "PPh", "PPN"], availability: "Booking H-2" },
      { name: "Audit Keuangan", description: "Audit internal dan review laporan keuangan", tags: ["Audit", "Review", "Internal"], availability: "Booking H-7" },
      { name: "Financial Planning", description: "Perencanaan keuangan bisnis dan proyeksi cashflow", tags: ["Cashflow", "Budgeting"], availability: "Booking H-3" },
    ],
  },
  {
    slug: "secretary",
    name: "Secretary",
    icon: UserCheck,
    color: "hsl(350 55% 50%)",
    description: "Sekretaris dan asisten profesional: penjadwalan, korespondensi, dan administrasi.",
    subServices: [
      { name: "Virtual Assistant", description: "Asisten virtual untuk scheduling, email, dan data entry", tags: ["Remote", "Flexible"], availability: "Tersedia Besok" },
      { name: "Executive Secretary", description: "Sekretaris eksekutif untuk direksi dan C-level", tags: ["On-site", "Full-time"], availability: "Booking H-5" },
      { name: "Admin & Data Entry", description: "Input data, filing, dan administrasi umum", tags: ["Data Entry", "Filing"], availability: "Tersedia Besok" },
      { name: "Receptionist", description: "Resepsionis profesional untuk kantor dan event", tags: ["Kantor", "Event"], availability: "Booking H-2" },
    ],
  },
];

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = categoryParam === "all" ? null : categories.find(c => c.slug === categoryParam);

  const filteredCategories = searchQuery.trim()
    ? categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subServices.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold text-foreground mb-2">
              Layanan <span className="text-gradient-accent">On-Demand</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl">
              Pesan tenaga profesional terverifikasi untuk semua kebutuhan bisnis dan pribadi Anda.
            </p>
          </motion.div>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari layanan... (cth: Cleaning, Legal)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-nowrap overflow-x-auto sm:flex-wrap gap-2 mb-8 hide-scrollbar">
            <Button
              variant={categoryParam === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => setSearchParams({ category: "all" })}
            >
              Semua
            </Button>
            {categories.map(cat => {
              const isActive = categoryParam === cat.slug;
              return (
                <Button
                  key={cat.slug}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="rounded-full shrink-0 gap-1.5"
                  onClick={() => setSearchParams({ category: cat.slug })}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.name}
                </Button>
              );
            })}
          </div>

          {/* Detail view for a specific category */}
          {activeCategory ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${activeCategory.color}15` }}>
                  <activeCategory.icon className="w-7 h-7" style={{ color: activeCategory.color }} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{activeCategory.name}</h2>
                  <p className="text-sm text-muted-foreground">{activeCategory.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeCategory.subServices.map((sub, i) => (
                  <motion.div
                    key={sub.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to="/request-quote">
                      <div className="group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all h-full cursor-pointer">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{sub.name}</h3>
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                            <Clock className="w-3 h-3" />
                            {sub.availability}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{sub.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {sub.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{tag}</span>
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Pesan Sekarang <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Grid view: all categories */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat, i) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div
                    className="group p-5 sm:p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all h-full cursor-pointer"
                    onClick={() => setSearchParams({ category: cat.slug })}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${cat.color}15` }}>
                      <cat.icon className="w-6 h-6" style={{ color: cat.color }} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{cat.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {cat.subServices.slice(0, 3).map(s => (
                        <span key={s.name} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {s.name}
                        </span>
                      ))}
                      {cat.subServices.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{cat.subServices.length - 3}</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* CTA card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: filteredCategories.length * 0.04 }}>
                <Link to="/request-quote">
                  <div className="p-5 sm:p-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all h-full cursor-pointer flex flex-col justify-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">Layanan Lainnya?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Tidak menemukan yang Anda cari? Hubungi kami untuk custom request apapun kebutuhan tenaga kerja Anda.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Request Custom <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>

              {filteredCategories.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Tidak ada layanan yang cocok dengan pencarian "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 sm:p-8 rounded-2xl border border-border bg-card">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-foreground mb-1">Butuh bantuan memilih layanan?</h3>
                <p className="text-sm text-muted-foreground">Tim kami siap membantu Anda menemukan solusi terbaik.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/request-quote">
                  <Button className="gap-2">
                    <Phone className="w-4 h-4" />
                    Hubungi Kami
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
