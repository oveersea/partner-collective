import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { ExternalLink, Search, Image as ImageIcon, User, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  created_at: string;
  owner_name: string;
  owner_avatar: string | null;
  owner_headline: string | null;
}

const Portfolios = () => {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolios = async () => {
      const { data: items } = await supabase
        .from("user_portfolios")
        .select("id, user_id, title, description, image_url, project_url, created_at")
        .order("created_at", { ascending: false });

      if (!items || items.length === 0) {
        setPortfolios([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(items.map((i) => i.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, headline")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const merged: PortfolioItem[] = items.map((item) => {
        const prof = profileMap.get(item.user_id);
        return {
          ...item,
          owner_name: prof?.full_name || "Talent",
          owner_avatar: prof?.avatar_url || null,
          owner_headline: prof?.headline || null,
        };
      });

      setPortfolios(merged);
      setLoading(false);
    };

    fetchPortfolios();
  }, []);

  const filtered = useMemo(() => {
    let result = portfolios;
    if (selectedUserId) {
      result = result.filter((p) => p.user_id === selectedUserId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.owner_name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [portfolios, search, selectedUserId]);

  // Unique creators for filter chips
  const creators = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string | null; count: number }>();
    portfolios.forEach((p) => {
      const existing = map.get(p.user_id);
      if (existing) {
        existing.count++;
      } else {
        map.set(p.user_id, { name: p.owner_name, avatar: p.owner_avatar, count: 1 });
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20);
  }, [portfolios]);

  // Masonry column distribution
  const columns = useMemo(() => {
    const cols: PortfolioItem[][] = [[], [], []];
    filtered.forEach((item, i) => {
      cols[i % 3].push(item);
    });
    return cols;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      {/* Hero header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Portfolio Showcase
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Jelajahi karya terbaik dari para talent dan profesional di ekosistem kami.
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari portfolio, talent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Creator filter chips */}
        {creators.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {selectedUserId && (
              <button
                onClick={() => setSelectedUserId(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
              >
                <X className="w-3 h-3" />
                Reset Filter
              </button>
            )}
            {creators.map(([userId, info]) => (
              <button
                key={userId}
                onClick={() => setSelectedUserId(selectedUserId === userId ? null : userId)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  selectedUserId === userId
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {info.avatar ? (
                  <img src={info.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <User className="w-3 h-3" />
                )}
                {info.name}
                <span className="opacity-60">({info.count})</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {search || selectedUserId ? "Tidak ditemukan" : "Belum ada portfolio"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {search || selectedUserId
                ? "Coba ubah kata kunci pencarian atau reset filter."
                : "Portfolio dari para talent akan muncul di sini."}
            </p>
          </div>
        ) : (
          /* Masonry grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-4">
                {col.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (colIdx * col.length + i) * 0.03, duration: 0.4 }}
                    className="group relative bg-card border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
                    style={{ borderRadius: "8px" }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Image */}
                    {item.image_url ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          loading="lazy"
                          style={{ minHeight: "180px", maxHeight: "400px" }}
                        />
                        {/* Overlay on hover */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300 ${
                            hoveredId === item.id ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-white/70 text-xs line-clamp-2 mb-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.owner_avatar ? (
                                <img
                                  src={item.owner_avatar}
                                  alt={item.owner_name}
                                  className="w-5 h-5 rounded-full object-cover border border-white/30"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white">
                                  {item.owner_name.charAt(0)}
                                </div>
                              )}
                              <span className="text-white/80 text-xs">{item.owner_name}</span>
                            </div>
                            {item.project_url && (
                              <a
                                href={item.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted flex items-center justify-center" style={{ height: "200px" }}>
                        <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}

                    {/* Text below for non-image or always-visible info */}
                    {!item.image_url && (
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          {item.owner_avatar ? (
                            <img
                              src={item.owner_avatar}
                              alt={item.owner_name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                              {item.owner_name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">{item.owner_name}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolios;
