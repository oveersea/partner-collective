import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BarChart3, BookOpen, Search, Clock, TrendingUp, Eye, ArrowRight, Lightbulb
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  read_time: string | null;
  thumbnail_url: string | null;
  author: string | null;
  is_published: boolean | null;
  stat: string | null;
  stat_label: string | null;
  trend: string | null;
  trend_value: string | null;
}

interface InsightService {
  id: string;
  title: string;
  tagline: string | null;
  icon_name: string | null;
  is_active: boolean | null;
}

const TABS = [
  { key: "all", label: "All Insights", icon: Lightbulb },
  { key: "articles", label: "Articles", icon: BookOpen },
  { key: "salary", label: "Salary Report", icon: TrendingUp },
  { key: "best-practices", label: "Best Practices", icon: BarChart3 },
];

const Insights = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";
  const [articles, setArticles] = useState<Article[]>([]);
  const [services, setServices] = useState<InsightService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [artRes, svcRes] = await Promise.all([
        supabase
          .from("articles")
          .select("id, title, slug, description, category, date, read_time, thumbnail_url, author, is_published, stat, stat_label, trend, trend_value")
          .eq("is_published", true)
          .order("date", { ascending: false }),
        supabase
          .from("insight_services")
          .select("id, title, tagline, icon_name, is_active")
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      if (artRes.data) setArticles(artRes.data as Article[]);
      if (svcRes.data) setServices(svcRes.data as InsightService[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let result = articles;
    if (activeTab !== "all") {
      const catMap: Record<string, string> = {
        articles: "article",
        salary: "salary",
        "best-practices": "best-practice",
      };
      const cat = catMap[activeTab];
      if (cat) result = result.filter((a) => a.category === cat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, activeTab, search]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((a) => {
      map.set(a.category, (map.get(a.category) || 0) + 1);
    });
    return map;
  }, [articles]);

  const setTab = (key: string) => {
    if (key === "all") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", key);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-background">
      {user ? <DashboardNav /> : <Navbar />}

      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Insights</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-2 tracking-tight">
              Industry Insights & Reports
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
              Stay informed with the latest labor market trends, salary benchmarks, and expert analysis.
            </p>

            {/* Search */}
            <div className="mt-6 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search insights..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map((t) => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  activeTab === t.key || (t.key === "all" && !searchParams.get("tab"))
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Insight Services Bar */}
        {services.length > 0 && activeTab === "all" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {services.slice(0, 4).map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 text-center"
              >
                <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">{svc.title}</h3>
                {svc.tagline && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{svc.tagline}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-1">No insights found</h2>
            <p className="text-sm text-muted-foreground">
              {search ? "Try a different search term." : "New insights will appear here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
              >
                <Card className="group hover:shadow-md transition-all h-full cursor-pointer border-border">
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    {article.thumbnail_url && (
                      <div className="relative overflow-hidden rounded-t-xl">
                        <img
                          src={article.thumbnail_url}
                          alt={article.title}
                          className="w-full h-40 object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {/* Category & Date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                          {article.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {article.read_time && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.read_time}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>

                      {/* Stat highlight */}
                      {article.stat && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-lg font-bold text-primary">{article.stat}</span>
                          {article.stat_label && (
                            <span className="text-[10px] text-muted-foreground">{article.stat_label}</span>
                          )}
                          {article.trend_value && (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                article.trend === "up" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {article.trend === "up" ? "↑" : "↓"} {article.trend_value}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Author */}
                      {article.author && (
                        <p className="text-[10px] text-muted-foreground">By {article.author}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {!user && <Footer />}
    </div>
  );
};

export default Insights;
