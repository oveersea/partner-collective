import { motion } from "framer-motion";
import {
  Clock, ShieldCheck, CreditCard, Headphones,
  Users, Star, Award
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Response < 24 Hours",
    description: "Professional workforce ready to deploy within 24 hours of booking.",
  },
  {
    icon: ShieldCheck,
    title: "Verified & Insured",
    description: "All workers have passed KYC, background checks, and are covered by work insurance.",
  },
  {
    icon: CreditCard,
    title: "Pay When Satisfied",
    description: "Secure payment system — pay only when you're satisfied with the results.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is ready to help anytime, from booking to completion.",
  },
  {
    icon: Users,
    title: "Scalable Workforce",
    description: "Need 1 person or 100? Scale your workforce to match your business needs.",
  },
  {
    icon: Award,
    title: "Replacement Guarantee",
    description: "If a worker doesn't meet expectations, we replace them at no extra cost.",
  },
];

const testimonials = [
  { name: "Rina M.", role: "Ops Manager, PT ABC", text: "Within 3 hours, a cleaning crew was already at our office. Incredibly fast!", rating: 5 },
  { name: "Budi S.", role: "Project Manager", text: "The construction workers sent were very professional. Renovation completed on time.", rating: 5 },
  { name: "Ayu L.", role: "Marketing Lead", text: "The content creator from Oveersea was so creative. Our content engagement increased 3x.", rating: 5 },
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
          <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest">Why Oveersea</span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold mt-2 sm:mt-3 mb-3 sm:mb-5 text-foreground">
            Advantages that <span className="text-gradient-accent">Set Us Apart</span>
          </h2>
          <p className="text-sm sm:text-lg max-w-2xl mx-auto text-muted-foreground">
            A trusted on-demand services platform with the highest quality standards.
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
          <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest">Testimonials</span>
          <h2 className="text-2xl sm:text-3xl font-semibold mt-2 mb-3 text-foreground">
            Trusted by Thousands of Clients
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
