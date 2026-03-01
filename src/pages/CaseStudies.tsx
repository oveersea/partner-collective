import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ExternalLink, Search, Image as ImageIcon, User, X, ArrowRight, Building2, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import case1 from "@/assets/case-1.jpg";
import case2 from "@/assets/case-2.jpg";
import case3 from "@/assets/case-3.jpg";
import case4 from "@/assets/case-4.jpg";

const fallbackImages = [case1, case2, case3, case4];

interface CaseStudy {
  id: string;
  type: "case_study";
  title: string;
  description: string | null;
  image_url: string | null;
  company_name: string;
  industry: string | null;
  cta_label: string | null;
  cta_url: string | null;
}

interface PortfolioItem {
  id: string;
  type: "portfolio";
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  owner_name: string;
  owner_avatar: string | null;
  owner_headline: string | null;
  user_id: string;
}

type ShowcaseItem = CaseStudy | PortfolioItem;

const CaseStudies = () => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "case_study" | "portfolio">("all");

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch case studies and portfolios in parallel
      const [csRes, pfRes] = await Promise.all([
        supabase
          .from("case_studies")
          .select("id, title, description, company_name, industry, image_url, cta_label, cta_url")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("user_portfolios")
          .select("id, user_id, title, description, image_url, project_url, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const caseStudies: ShowcaseItem[] = (csRes.data || []).map((cs: any) => ({
        ...cs,
        type: "case_study" as const,
      }));

      // Fetch portfolio owner profiles
      const portfolioItems = pfRes.data || [];
      let portfolios: ShowcaseItem[] = [];

      if (portfolioItems.length > 0) {
        const userIds = [...new Set(portfolioItems.map((i: any) => i.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, headline")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

        portfolios = portfolioItems.map((item: any) => {
          const prof = profileMap.get(item.user_id);
          return {
            id: item.id,
            type: "portfolio" as const,
            title: item.title,
            description: item.description,
            image_url: item.image_url,
            project_url: item.project_url,
            user_id: item.user_id,
            owner_name: prof?.full_name || "Talent",
            owner_avatar: prof?.avatar_url || null,
            owner_headline: prof?.headline || null,
          };
        });
      }

      // Interleave: case studies first, then portfolios
      setItems([...caseStudies, ...portfolios]);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (filterType !== "all") {
      result = result.filter((i) => i.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => {
        const searchable = [i.title, i.description];
        if (i.type === "case_study") searchable.push(i.company_name, i.industry);
        if (i.type === "portfolio") searchable.push(i.owner_name);
        return searchable.some((s) => s?.toLowerCase().includes(q));
      });
    }
    return result;
  }, [items, search, filterType]);

  // Masonry columns
  const columns = useMemo(() => {
    const cols: ShowcaseItem[][] = [[], [], []];
    filtered.forEach((item, i) => cols[i % 3].push(item));
    return cols;
  }, [filtered]);

  const caseCount = items.filter((i) => i.type === "case_study").length;
  const portfolioCount = items.filter((i) => i.type === "portfolio").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-14 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">Case Studies & Portfolio</span>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mt-3 mb-4">
              Karya & Kisah <span className="text-primary">Sukses</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mb-8">
              Jelajahi studi kasus klien dan portfolio karya terbaik dari para talent di ekosistem Oveersea.
            </p>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari case study, portfolio, talent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              <div className="flex gap-2">
                {([
                  { key: "all", label: "Semua", count: items.length },
                  { key: "case_study", label: "Case Studies", count: caseCount, icon: Building2 },
                  { key: "portfolio", label: "Portfolio", count: portfolioCount, icon: FolderOpen },
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterType(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      filterType === f.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {f.label}
                    <span className="opacity-60">({f.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-1">Tidak ditemukan</h2>
            <p className="text-muted-foreground text-sm">Coba ubah kata kunci atau reset filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-5">
                {col.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (colIdx * col.length + i) * 0.03, duration: 0.4 }}
                    className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    {/* Image */}
                    {(item.image_url || item.type === "case_study") ? (
                      <div className="relative overflow-hidden aspect-[4/3]">
                        <img
                          src={item.image_url || (item.type === "case_study" ? fallbackImages[i % fallbackImages.length] : "")}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
                            item.type === "case_study"
                              ? "bg-primary/90 text-primary-foreground"
                              : "bg-background/90 text-foreground border border-border"
                          }`}>
                            {item.type === "case_study" ? "Case Study" : "Portfolio"}
                          </span>
                        </div>
                      </div>
                    ) : item.type === "portfolio" && !item.image_url ? (
                      <div className="bg-muted flex items-center justify-center aspect-[4/3]">
                        <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    ) : null}

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      {item.type === "case_study" && item.industry && (
                        <span className="text-xs font-medium text-primary mb-2">{item.industry}</span>
                      )}
                      <h3 className="text-base font-semibold text-foreground mb-2 leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{item.description}</p>
                      )}

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between">
                        {item.type === "case_study" ? (
                          <>
                            <span className="text-xs text-muted-foreground">{item.company_name}</span>
                            {item.cta_label && (
                              <a
                                href={item.cta_url || "#"}
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                              >
                                {item.cta_label}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              {item.owner_avatar ? (
                                <img src={item.owner_avatar} alt={item.owner_name} className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                                  {item.owner_name.charAt(0)}
                                </div>
                              )}
                              <span className="text-xs text-muted-foreground">{item.owner_name}</span>
                            </div>
                            {item.project_url && (
                              <a
                                href={item.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CaseStudies;
