import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Clock,
  Star,
  Users,
  MapPin,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

interface Program {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  level: string | null;
  duration: string | null;
  delivery_mode: string | null;
  price_cents: number;
  currency: string;
  rating: number | null;
  student_count: number | null;
  badge: string | null;
  thumbnail_url: string | null;
  location: string | null;
  instructor_name: string | null;
}

const ITEMS_PER_PAGE = 20;

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const Learning = () => {
  const [searchParams] = useSearchParams();
  const skillsFilter = searchParams.get("skills");
  const skillsList = skillsFilter ? skillsFilter.split(",").map(s => s.trim().toLowerCase()) : [];

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [deliveryMode, setDeliveryMode] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("programs")
        .select("id, title, slug, description, category, level, duration, delivery_mode, price_cents, currency, rating, student_count, badge, thumbnail_url, location, instructor_name")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (!error && data) setPrograms(data as Program[]);
      setLoading(false);
    };
    fetchPrograms();
  }, []);

  const filtered = useMemo(() => {
    let list = programs;
    // If skills filter from URL, only show programs matching those skills
    if (skillsList.length > 0) {
      list = list.filter((p) =>
        skillsList.some((kw) =>
          p.title.toLowerCase().includes(kw) || (p.description?.toLowerCase().includes(kw))
        )
      );
    }
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (level !== "all") list = list.filter((p) => p.level === level);
    if (deliveryMode !== "all") list = list.filter((p) => p.delivery_mode === deliveryMode);
    return list;
  }, [programs, search, category, level, deliveryMode, skillsList.join(",")]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, category, level, deliveryMode]);

  const categories = [...new Set(programs.map((p) => p.category))];
  const levels = [...new Set(programs.map((p) => p.level).filter(Boolean))];
  const modes = [...new Set(programs.map((p) => p.delivery_mode).filter(Boolean))];

  const activeFilters = [category !== "all", level !== "all", deliveryMode !== "all", skillsList.length > 0].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("all"); setLevel("all"); setDeliveryMode("all"); setSearch("");
    if (skillsFilter) {
      window.history.replaceState({}, "", "/learning");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Learning Programs</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Tingkatkan kompetensi Anda dengan program sertifikasi dan bootcamp berkualitas dari instruktur berpengalaman.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari program..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              {levels.map((l) => <SelectItem key={l!} value={l!}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={deliveryMode} onValueChange={setDeliveryMode}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mode</SelectItem>
              {modes.map((m) => <SelectItem key={m!} value={m!}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>

        {skillsList.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4 text-amber-600" />
              <span className="text-card-foreground font-medium">Menampilkan program untuk skill:</span>
              <span className="text-muted-foreground">{skillsFilter}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><X className="w-3 h-3" /> Hapus filter</Button>
          </div>
        )}

        {activeFilters > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filtered.length} program ditemukan</span>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><X className="w-3 h-3" /> Reset filter</Button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><CardContent className="p-0"><Skeleton className="h-44 rounded-t-lg" /><div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/3" /></div></CardContent></Card>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Tidak ada program ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau kata pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginated.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={`/learning/${p.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-10 h-10 text-muted-foreground/30" /></div>
                      )}
                      {p.badge && <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">{p.badge}</Badge>}
                      <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">{p.category}</Badge>
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                        {p.level && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{p.level}</span>}
                        {p.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.duration}</span>}
                        {p.delivery_mode && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.delivery_mode}</span>}
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">{formatRupiah(p.price_cents)}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {p.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{p.rating}</span>}
                          {p.student_count != null && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{p.student_count}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Learning;
