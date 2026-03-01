import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto rounded-3xl bg-hero p-12 md:p-16 text-center overflow-hidden"
        >
          {/* Decorative */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald/20 bg-emerald/5 mb-6">
              <Sparkles className="w-4 h-4 text-emerald" />
              <span className="text-sm font-medium text-emerald">Mulai Gratis</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-5" style={{ color: "hsl(0 0% 95%)" }}>
              Siap Menemukan Partner <br />
              <span className="text-gradient-accent">Terbaik untuk Anda?</span>
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "hsl(220 20% 65%)" }}>
              Bergabung dengan ribuan perusahaan dan partner profesional yang sudah mempercayai platform kami.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" className="text-base px-8 py-6 rounded-xl">
                Mulai Sekarang
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-8 py-6 rounded-xl">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
