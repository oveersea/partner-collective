import { motion } from "framer-motion";
import {
  Clock, ShieldCheck, CreditCard, Headphones,
  Users, Star, Award
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Response < 24 Jam",
    description: "Tenaga kerja profesional siap dikirim dalam waktu kurang dari 24 jam setelah pemesanan.",
  },
  {
    icon: ShieldCheck,
    title: "Terverifikasi & Berasuransi",
    description: "Seluruh pekerja sudah melalui KYC, background check, dan dilindungi asuransi kerja.",
  },
  {
    icon: CreditCard,
    title: "Bayar Setelah Puas",
    description: "Sistem pembayaran aman — bayar hanya jika Anda puas dengan hasil pekerjaan.",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description: "Tim support kami siap membantu kapan saja, dari pemesanan hingga selesai.",
  },
  {
    icon: Users,
    title: "Scalable Workforce",
    description: "Butuh 1 orang atau 100 orang? Skalakan tenaga kerja sesuai kebutuhan bisnis.",
  },
  {
    icon: Award,
    title: "Garansi Penggantian",
    description: "Jika pekerja tidak sesuai, kami ganti dengan yang baru tanpa biaya tambahan.",
  },
];

const testimonials = [
  { name: "Rina M.", role: "Ops Manager, PT ABC", text: "Dalam 3 jam sudah ada cleaning crew di kantor. Luar biasa cepat!", rating: 5 },
  { name: "Budi S.", role: "Project Manager", text: "Tukang bangunan yang dikirim sangat profesional. Renovasi selesai tepat waktu.", rating: 5 },
  { name: "Ayu L.", role: "Marketing Lead", text: "Content creator dari Oveersea sangat kreatif. Konten kami naik 3x engagement.", rating: 5 },
];

const ServiceShowcaseSection = () => {
  return (
    <section className="py-12 sm:py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest">Mengapa Oveersea</span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold mt-2 sm:mt-3 mb-3 sm:mb-5 text-foreground">
            Keunggulan yang <span className="text-gradient-accent">Membedakan</span>
          </h2>
          <p className="text-sm sm:text-lg max-w-2xl mx-auto text-muted-foreground">
            Platform on-demand services terpercaya dengan standar kualitas tertinggi.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16 sm:mb-24">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-5 sm:p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest">Testimoni</span>
          <h2 className="text-2xl sm:text-3xl font-semibold mt-2 mb-3 text-foreground">
            Dipercaya Ribuan Klien
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 sm:p-6 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceShowcaseSection;
