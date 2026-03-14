import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(0 0% 6%), hsl(0 0% 10%))" }}
        >
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[120px] opacity-15" style={{ background: "hsl(var(--primary))" }} />
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:p-12 relative z-10">
            <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)" }}>
              <Zap className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                Butuh tenaga kerja sekarang?
              </h3>
              <p className="text-sm md:text-base max-w-xl" style={{ color: "hsl(0 0% 50%)" }}>
                Posting kebutuhan Anda dan dapatkan tenaga profesional terverifikasi dalam hitungan jam, bukan minggu.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/order">
                <Button
                  className="font-semibold px-6 py-5 rounded-lg text-sm"
                  style={{ background: "hsl(var(--primary))", color: "white" }}
                >
                  Pesan Sekarang
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/services">
                <Button
                  variant="outline"
                  className="font-semibold px-6 py-5 rounded-lg text-sm border-white/20 text-primary hover:bg-white/10"
                >
                  Lihat Layanan
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
