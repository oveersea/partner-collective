import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Choose a Service",
    description: "Select the service category you need — from cleaning to legal, everything is available.",
  },
  {
    number: 2,
    title: "We Match You",
    description: "Within minutes, we match you with verified professionals who are ready to work.",
  },
  {
    number: 3,
    title: "Job Done",
    description: "Pay only when satisfied. Work guarantee & insurance for every assignment.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-12 sm:py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-20"
        >
          <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest">How It Works</span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold mt-2 sm:mt-3 mb-3 sm:mb-5 text-foreground">
            As Easy as <span className="text-gradient-accent">1-2-3</span>
          </h2>
          <p className="text-sm sm:text-lg max-w-2xl mx-auto text-muted-foreground">
            A transparent and structured process to ensure quality at every stage.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden md:block absolute top-[40px] left-0 right-0 z-0 px-4">
            <div className="h-px w-full" style={{ background: "hsl(var(--border))" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background mb-8">
                  <span className="text-2xl font-display font-semibold text-primary">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">{step.title}</h3>
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
