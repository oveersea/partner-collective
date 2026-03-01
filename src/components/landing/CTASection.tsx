import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ctaGlobe from "@/assets/cta-globe.png";

const CTASection = () => {
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl bg-muted border border-border overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:p-8">
            {/* Globe image */}
            <div className="shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden">
              <img src={ctaGlobe} alt="Global network" className="w-full h-full object-cover" />
            </div>

            {/* Text content */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                Kelola seluruh workforce Anda secara global
              </h3>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                Onboard, kelola, dan bayar partner serta kontraktor di seluruh dunia dalam satu platform, tanpa kerumitan manual.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                className="font-semibold px-6 py-5 rounded-lg text-sm"
                style={{ background: "hsl(38 90% 55%)", color: "hsl(0 0% 0%)" }}
              >
                Minta Demo
              </Button>
              <Button
                variant="outline"
                className="font-semibold px-6 py-5 rounded-lg text-sm border-2 border-foreground text-foreground hover:bg-foreground hover:text-background"
              >
                Pelajari Lanjut
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
