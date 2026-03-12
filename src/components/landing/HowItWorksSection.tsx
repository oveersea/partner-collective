import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Consult with Our Experts",
    description: "Our expert team will deeply understand your needs, goals, and team dynamics.",
  },
  {
    number: 2,
    title: "Work with Selected Talent",
    description: "Within days, we introduce the best talent for your project. Average matching time under 24 hours.",
  },
  {
    number: 3,
    title: "Results Guaranteed",
    description: "Work with new team members on a trial basis (pay only if satisfied), ensuring you get the right person.",
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
            From Request to <span className="text-gradient-accent">Real Results</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            A transparent and structured process to ensure quality at every stage.
          </p>
        </motion.div>

        {/* Timeline connector */}
        <div className="relative max-w-5xl mx-auto">
          {/* Horizontal line with arrows */}
          <div className="hidden md:flex items-center justify-between absolute top-[40px] left-0 right-0 z-0 px-4">
            <svg className="w-full h-6" viewBox="0 0 1000 24" fill="none" preserveAspectRatio="none">
              <line x1="0" y1="12" x2="140" y2="12" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <polygon points="135,8 145,12 135,16" fill="hsl(var(--border))" />
              <line x1="210" y1="12" x2="450" y2="12" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <polygon points="445,8 455,12 445,16" fill="hsl(var(--border))" />
              <line x1="540" y1="12" x2="780" y2="12" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <polygon points="775,8 785,12 775,16" fill="hsl(var(--border))" />
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
