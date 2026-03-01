import { motion } from "framer-motion";
import {
  Code2, Palette, Megaphone, BarChart3, ClipboardCheck, Package, TrendingUp, Sparkles,
} from "lucide-react";

const categories = [
  {
    icon: Code2,
    title: "Developers",
    description: "Software engineer, programmer, dan arsitek berpengalaman di ratusan teknologi modern.",
  },
  {
    icon: Palette,
    title: "Designers",
    description: "Expert UI, UX, Visual, dan Interaction designer serta illustrator, animator, dan lainnya.",
  },
  {
    icon: Megaphone,
    title: "Marketing Experts",
    description: "Ahli digital marketing, growth marketing, content creation, market research, brand strategy, social media marketing.",
  },
  {
    icon: BarChart3,
    title: "Management Consultants",
    description: "Finance experts, business strategists, M&A consultants, financial modelers, market research hingga FP&A.",
  },
  {
    icon: ClipboardCheck,
    title: "Project Managers",
    description: "Digital dan technical project managers, scrum masters dengan keahlian di berbagai PM tools dan framework.",
  },
  {
    icon: Package,
    title: "Product Managers",
    description: "Digital product managers, scrum product owners dengan keahlian di banking, healthcare, ecommerce, dan lainnya.",
  },
  {
    icon: TrendingUp,
    title: "Sales Experts",
    description: "Lead generation experts, SDRs, sales reps, BDRs, customer success managers, sales consultants.",
  },
  {
    icon: Sparkles,
    title: "Plus Ribuan Skill Lainnya",
    description: "Apapun skill atau spesialisasi yang bisnis Anda butuhkan, kami memiliki talenta terbaik untuk memenuhinya.",
    wide: true,
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Grid */}
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          {/* Row 1: 3 cols */}
          <div className="grid md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-border">
            {categories.slice(0, 3).map((cat, i) => (
              <CategoryCard key={cat.title} cat={cat} index={i} />
            ))}
          </div>

          <div className="border-t border-border" />

          {/* Row 2: 3 cols */}
          <div className="grid md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-border">
            {categories.slice(3, 6).map((cat, i) => (
              <CategoryCard key={cat.title} cat={cat} index={i + 3} />
            ))}
          </div>

          <div className="border-t border-border" />

          {/* Row 3: 2 cols (1 normal + 1 wide) */}
          <div className="grid md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-border" style={{ background: "hsl(var(--muted) / 0.3)" }}>
            <CategoryCard cat={categories[6]} index={6} />
            <div className="md:col-span-2 p-8 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
              >
                <h3 className="text-xl font-bold text-card-foreground mb-2">{categories[7].title}</h3>
                <p className="text-muted-foreground leading-relaxed">{categories[7].description}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface CategoryCardProps {
  cat: { icon: React.ElementType; title: string; description: string };
  index: number;
}

const CategoryCard = ({ cat, index }: CategoryCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: index * 0.05 }}
    className="p-8 group"
  >
    <div className="w-14 h-14 rounded-xl border border-border bg-background flex items-center justify-center mb-5 group-hover:border-primary/30 transition-colors">
      <cat.icon className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
    </div>
    <h3 className="text-lg font-bold text-card-foreground mb-2">{cat.title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
  </motion.div>
);

export default FeaturesSection;
