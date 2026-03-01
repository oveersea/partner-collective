import { motion } from "framer-motion";
import { UserCheck, Search, Handshake, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserCheck,
    step: "01",
    title: "Verifikasi KYC",
    description: "Setiap partner dan vendor wajib melewati proses verifikasi identitas dan kualitas sebelum dapat menerima pekerjaan.",
  },
  {
    icon: Search,
    step: "02",
    title: "Matchmaking Cerdas",
    description: "Sistem kami mencocokkan kebutuhan Anda dengan partner atau tim terbaik berdasarkan skill, pengalaman, dan rating.",
  },
  {
    icon: Handshake,
    step: "03",
    title: "Review & Setuju",
    description: "Lihat profil, portofolio, dan track record kandidat. Pilih yang paling sesuai dengan kebutuhan proyek Anda.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Mulai Bekerja",
    description: "Partner atau tim mulai bekerja dengan milestone yang jelas, monitoring progress, dan pembayaran yang aman.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)",
        backgroundSize: "80px 80px"
      }} />

      <div className="relative container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-emerald uppercase tracking-widest">Cara Kerja</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-5" style={{ color: "hsl(0 0% 95%)" }}>
            Dari Request ke <span className="text-gradient-accent">Hasil Nyata</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(220 20% 65%)" }}>
            Proses yang transparan dan terstruktur untuk memastikan kualitas di setiap tahap.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-emerald/30 to-transparent" />
              )}
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald/10 border border-emerald/20 mb-5">
                <step.icon className="w-7 h-7 text-emerald" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald text-xs font-bold flex items-center justify-center" style={{ color: "hsl(222 47% 11%)" }}>
                  {step.step.replace("0", "")}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "hsl(0 0% 93%)" }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(220 20% 60%)" }}>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
