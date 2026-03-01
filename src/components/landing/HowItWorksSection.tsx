import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Konsultasi dengan Ahli Kami",
    description: "Tim ahli kami akan memahami kebutuhan, goals, dan dinamika tim Anda secara mendalam.",
  },
  {
    number: 2,
    title: "Bekerja dengan Talenta Terpilih",
    description: "Dalam hitungan hari, kami perkenalkan talenta terbaik untuk proyek Anda. Rata-rata waktu matching di bawah 24 jam.",
  },
  {
    number: 3,
    title: "Hasil Tepat, Dijamin",
    description: "Bekerja dengan anggota tim baru secara trial (bayar hanya jika puas), memastikan Anda mendapat orang yang tepat.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Cara Kerja</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-5 text-foreground">
            Dari Request ke <span className="text-gradient-accent">Hasil Nyata</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            Proses yang transparan dan terstruktur untuk memastikan kualitas di setiap tahap.
          </p>
        </motion.div>

        {/* Timeline connector */}
        <div className="relative max-w-5xl mx-auto">
          {/* Horizontal line with arrows */}
          <div className="hidden md:flex items-center justify-between absolute top-[40px] left-0 right-0 z-0 px-4">
            <svg className="w-full h-6" viewBox="0 0 1000 24" fill="none" preserveAspectRatio="none">
              {/* Line from left edge to circle 1 */}
              <line x1="0" y1="12" x2="140" y2="12" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <polygon points="135,8 145,12 135,16" fill="hsl(var(--border))" />
              {/* Line from circle 1 to circle 2 */}
              <line x1="210" y1="12" x2="450" y2="12" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <polygon points="445,8 455,12 445,16" fill="hsl(var(--border))" />
              {/* Line from circle 2 to circle 3 */}
              <line x1="540" y1="12" x2="780" y2="12" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <polygon points="775,8 785,12 775,16" fill="hsl(var(--border))" />
              {/* Line from circle 3 to right edge */}
              <line x1="860" y1="12" x2="1000" y2="12" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <polygon points="995,8 1005,12 995,16" fill="hsl(var(--border))" />
            </svg>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                {/* Numbered circle */}
                <div className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background mb-8">
                  <span className="text-2xl font-display font-bold text-primary">{step.number}</span>
                </div>

                <h3 className="text-lg font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
