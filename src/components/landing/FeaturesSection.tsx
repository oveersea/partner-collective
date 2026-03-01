import { motion } from "framer-motion";
import { Briefcase, FolderKanban, Users, Building2, Shield, Globe, MapPin, Star } from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "Hiring Request",
    description: "Temukan partner untuk bekerja full-time, part-time, atau freelance. Pilih on-site atau remote sesuai kebutuhan.",
    tags: ["Full-time", "Part-time", "Remote", "On-site"],
    color: "from-emerald/20 to-emerald/5",
  },
  {
    icon: FolderKanban,
    title: "Project Request",
    description: "Posting project Anda dan biarkan sistem matchmaking menemukan partner atau tim terbaik untuk mengerjakannya.",
    tags: ["Matchmaking", "Quality First", "Milestone"],
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: Users,
    title: "Bentuk Tim",
    description: "Partner bisa membentuk tim yang saling sinergi. Hire individu atau seluruh tim sekaligus untuk efisiensi maksimal.",
    tags: ["Team Formation", "Sinergi", "Kolaborasi"],
    color: "from-violet-500/20 to-violet-500/5",
  },
  {
    icon: Building2,
    title: "Vendor Account",
    description: "Daftarkan perusahaan Anda sebagai vendor dengan verifikasi KYC bisnis dan legalitas lengkap.",
    tags: ["KYC Business", "Legalitas", "Terverifikasi"],
    color: "from-amber-500/20 to-amber-500/5",
  },
];

const highlights = [
  { icon: Shield, text: "KYC Terverifikasi" },
  { icon: Globe, text: "Remote & On-site" },
  { icon: MapPin, text: "Seluruh Indonesia" },
  { icon: Star, text: "Quality Assured" },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Fitur Utama</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-5 text-foreground">
            Satu Platform, <span className="text-gradient-accent">Semua Solusi</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dari mencari partner individu hingga merekrut tim lengkap — kami memastikan kualitas di setiap langkah.
          </p>
        </motion.div>

        {/* Highlights bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 mb-16"
        >
          {highlights.map((h) => (
            <div key={h.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
              <h.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{h.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 shadow-card hover:shadow-card-hover"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-card-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-5">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
