import { motion } from "framer-motion";
import { Play } from "lucide-react";
import case1 from "@/assets/case-1.jpg";
import case2 from "@/assets/case-2.jpg";
import case3 from "@/assets/case-3.jpg";
import case4 from "@/assets/case-4.jpg";
import case5 from "@/assets/case-5.jpg";
import case6 from "@/assets/case-6.jpg";

const caseStudies = [
  { image: case1, company: "PT Nusantara Digital", industry: "Fintech" },
  { image: case2, company: "Logistik Indonesia", industry: "Logistics" },
  { image: case3, company: "TechVenture ID", industry: "Tech Startup" },
  { image: case4, company: "MedikaCare", industry: "Healthcare" },
  { image: case5, company: "Konsultan Prima", industry: "Consulting" },
  { image: case6, company: "Universitas Maju", industry: "Education" },
];

const CaseStudiesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Studi Kasus</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-5 text-foreground">
            Dipercaya oleh <span className="text-gradient-accent">Berbagai Industri</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            Lihat bagaimana klien kami berhasil menemukan talenta terbaik dan menyelesaikan proyek mereka.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {caseStudies.map((item, i) => (
            <motion.div
              key={item.company}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3]"
            >
              <img
                src={item.image}
                alt={item.company}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

              {/* Company name */}
              <div className="absolute top-5 left-5">
                <h3 className="text-lg font-bold text-white drop-shadow-lg">{item.company}</h3>
                <p className="text-xs text-white/70 font-medium">{item.industry}</p>
              </div>

              {/* Watch button */}
              <div className="absolute bottom-5 left-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-sm font-medium text-white">Lihat cerita mereka</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
