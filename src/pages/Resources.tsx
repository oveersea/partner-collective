import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardNav from "@/components/dashboard/DashboardNav";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3, BookOpen, FolderOpen, ClipboardCheck, FileText,
  TrendingUp, Globe, Shield, ScrollText, PackageCheck, ArrowRight,
  Lightbulb, Users, Star
} from "lucide-react";

const sections = [
  {
    title: "Insights & Analysis",
    description: "Data-driven reports and industry trends to inform your business strategy.",
    icon: BarChart3,
    href: "/insights",
    color: "bg-primary/10 text-primary",
    items: [
      { icon: BarChart3, label: "Industry Insight", description: "Latest labor market trend reports", href: "/insights" },
      { icon: TrendingUp, label: "Salary Report", description: "Salary benchmarks by industry & role", href: "/insights?tab=salary" },
      { icon: BookOpen, label: "Blog & Articles", description: "Educational articles about HR & talent", href: "/insights?tab=articles" },
      { icon: Star, label: "Best Practices", description: "Strategies for talent management", href: "/insights?tab=best-practices" },
    ],
  },
  {
    title: "Case Studies",
    description: "Real success stories from our clients across various industries.",
    icon: FolderOpen,
    href: "/case-studies",
    color: "bg-amber-500/10 text-amber-600",
    items: [
      { icon: FolderOpen, label: "All Case Studies", description: "Browse our complete portfolio", href: "/case-studies" },
      { icon: Users, label: "Enterprise", description: "Large company case studies", href: "/case-studies" },
      { icon: Lightbulb, label: "Startup & SME", description: "Small business success stories", href: "/case-studies" },
      { icon: Globe, label: "Cross-Border", description: "International placement case studies", href: "/case-studies" },
    ],
  },
  {
    title: "Surveys & Research",
    description: "Exclusive surveys and workforce research to stay ahead of trends.",
    icon: ClipboardCheck,
    href: "/insights?tab=surveys",
    color: "bg-blue-500/10 text-blue-600",
    items: [
      { icon: ClipboardCheck, label: "Talent Survey", description: "Talent satisfaction & trend surveys", href: "/insights?tab=surveys" },
      { icon: FileText, label: "Workforce Report", description: "Labor market research reports", href: "/insights?tab=surveys" },
      { icon: BarChart3, label: "Skill Demand Index", description: "Most in-demand skill index", href: "/insights?tab=surveys" },
      { icon: Globe, label: "Global Benchmark", description: "Comparison with international standards", href: "/insights?tab=surveys" },
    ],
  },
  {
    title: "Tools & Templates",
    description: "Ready-to-use assessment tools, document templates, and compliance checklists.",
    icon: ScrollText,
    href: "/insights?tab=tools",
    color: "bg-emerald-500/10 text-emerald-600",
    items: [
      { icon: ClipboardCheck, label: "Assessment Tools", description: "Competency test templates", href: "/insights?tab=tools" },
      { icon: ScrollText, label: "Document Templates", description: "Contract, NDA, & HR templates", href: "/insights?tab=tools" },
      { icon: PackageCheck, label: "Compliance Checklist", description: "Labor compliance checklist", href: "/insights?tab=tools" },
      { icon: Shield, label: "Legal Resources", description: "Labor regulation guides", href: "/insights?tab=tools" },
    ],
  },
];

const Resources = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {user ? <DashboardNav /> : <Navbar />}

      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Resources</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4 tracking-tight">
              Knowledge Hub for Smarter Decisions
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Insights, research, case studies, and tools to help you build and manage the best teams.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section, idx) => {
            const SectionIcon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
                      <SectionIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
                    </div>
                  </div>
                </div>

                {/* Sub-items */}
                <div className="border-t border-border divide-y divide-border">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/50 transition-colors group"
                      >
                        <ItemIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {!user && <Footer />}
    </div>
  );
};

export default Resources;
