import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Clock, MapPin, Calendar, Users, ChevronLeft, ChevronRight, X, Ticket,
} from "lucide-react";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  slug: string;
  oveercode: string | null;
  description: string | null;
  category: string;
  event_type: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  venue_name: string | null;
  city: string | null;
  price_cents: number;
  currency: string;
  capacity: number | null;
  registered_count: number | null;
  thumbnail_url: string | null;
  organizer_name: string | null;
  badge: string | null;
  tags: string[] | null;
}

const ITEMS_PER_PAGE = 20;

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const formatEventDate = (d: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, title, slug, oveercode, description, category, event_type, start_date, end_date, location, venue_name, city, price_cents, currency, capacity, registered_count, thumbnail_url, organizer_name, badge, tags")
        .eq("status", "published")
        .order("start_date", { ascending: true });
      if (data) setEvents(data as Event[]);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filtered = useMemo(() => {
    let list = events;
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));
    if (category !== "all") list = list.filter(e => e.category === category);
    if (eventType !== "all") list = list.filter(e => e.event_type === eventType);
    return list;
  }, [events, search, category, eventType]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [search, category, eventType]);

  const categories = [...new Set(events.map(e => e.category))];
  const activeFilters = [category !== "all", eventType !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("all");
    setEventType("all");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Events</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Discover upcoming events, conferences, workshops, and meetups. Buy your ticket and join.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {activeFilters > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filtered.length} events found</span>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1"><X className="w-3 h-3" /> Reset</Button>
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
          <div className="text-center py-20">
            <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No events found</h3>
            <p className="text-sm text-muted-foreground">Try changing your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginated.map((evt, i) => {
              const isFull = evt.capacity != null && (evt.registered_count || 0) >= evt.capacity;
              const isFree = evt.price_cents === 0;
              return (
                <motion.div key={evt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link to={`/events/${evt.oveercode || evt.slug}`}>
                    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        {evt.thumbnail_url ? (
                          <img src={evt.thumbnail_url} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <Ticket className="w-10 h-10 text-primary/30" />
                          </div>
                        )}
                        {evt.badge && <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">{evt.badge}</Badge>}
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] capitalize">{evt.event_type}</Badge>
                        {isFull && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <Badge variant="destructive">Sold Out</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 flex flex-col flex-1">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{evt.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                          {evt.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{formatEventDate(evt.start_date)}
                            </span>
                          )}
                          {(evt.city || evt.location) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{evt.city || evt.location}
                            </span>
                          )}
                          {evt.capacity && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />{evt.registered_count || 0}/{evt.capacity}
                            </span>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">
                            {isFree ? "Free" : formatRupiah(evt.price_cents)}
                          </span>
                          {evt.organizer_name && (
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{evt.organizer_name}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;
