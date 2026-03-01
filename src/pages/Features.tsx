import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Code2, Palette, Megaphone, BarChart3, ClipboardCheck, Package, TrendingUp, Sparkles } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

const allCategories = [
  { icon: Code2, title: "Developers", slug: "developers", description: "Software engineer, programmer, dan arsitek berpengalaman di ratusan teknologi modern.", skills: ["React", "Node.js", "Python", "Go", "Java", "TypeScript", "AWS", "DevOps", "Mobile Dev", "AI/ML"] },
  { icon: Palette, title: "Designers", slug: "designers", description: "Expert UI, UX, Visual, dan Interaction designer serta illustrator, animator, dan lainnya.", skills: ["UI Design", "UX Research", "Visual Design", "Interaction Design", "Illustration", "Motion Design", "Brand Design", "Design Systems"] },
  { icon: Megaphone, title: "Marketing Experts", slug: "marketing-experts", description: "Ahli digital marketing, growth marketing, content creation, market research, brand strategy, social media marketing.", skills: ["SEO", "SEM", "Content Marketing", "Social Media", "Growth Hacking", "Email Marketing", "Brand Strategy", "Analytics"] },
  { icon: BarChart3, title: "Management Consultants", slug: "management-consultants", description: "Finance experts, business strategists, M&A consultants, financial modelers, market research hingga FP&A.", skills: ["Financial Modeling", "Business Strategy", "M&A", "FP&A", "Market Research", "Due Diligence", "Valuation", "Risk Management"] },
  { icon: ClipboardCheck, title: "Project Managers", slug: "project-managers", description: "Digital dan technical project managers, scrum masters dengan keahlian di berbagai PM tools dan framework.", skills: ["Agile", "Scrum", "Jira", "Waterfall", "Risk Management", "Stakeholder Management", "Resource Planning", "PMBOK"] },
  { icon: Package, title: "Product Managers", slug: "product-managers", description: "Digital product managers, scrum product owners dengan keahlian di banking, healthcare, ecommerce, dan lainnya.", skills: ["Product Strategy", "User Research", "Roadmapping", "A/B Testing", "Data Analysis", "Backlog Management", "Go-to-Market", "OKRs"] },
  { icon: TrendingUp, title: "Sales Experts", slug: "sales-experts", description: "Lead generation experts, SDRs, sales reps, BDRs, customer success managers, sales consultants.", skills: ["Lead Generation", "CRM", "Sales Strategy", "Account Management", "Customer Success", "Pipeline Management", "B2B Sales", "Negotiation"] },
];

const Features = () => {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  const filtered = activeCategory === "all" ? allCategories : allCategories.filter(c => c.slug === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4">
              Temukan Talenta <span className="text-gradient-accent">Terbaik</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Jelajahi berbagai kategori talenta profesional yang siap membantu bisnis Anda berkembang.
            </p>
          </motion.div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            <Link to="/features?category=all">
              <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm" className="rounded-full">Semua</Button>
            </Link>
            {allCategories.map(cat => (
              <Link key={cat.slug} to={`/features?category=${cat.slug}`}>
                <Button variant={activeCategory === cat.slug ? "default" : "outline"} size="sm" className="rounded-full">{cat.title}</Button>
              </Link>
            ))}
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-2xl border border-border bg-card hover:shadow-card-hover transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl border border-border bg-background flex items-center justify-center mb-5">
                  <cat.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-card-foreground mb-3">{cat.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">{cat.description}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map(skill => (
                    <span key={skill} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{skill}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Features;
