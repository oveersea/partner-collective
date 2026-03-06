import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import OrderBarcode from "@/components/OrderBarcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Clock, Users, MapPin, Calendar, Ticket, Globe,
  ChevronDown, User, Building2, ExternalLink, CheckCircle2, Tag,
} from "lucide-react";

interface Speaker {
  name: string;
  title?: string;
  avatar_url?: string;
  bio?: string;
}
interface AgendaItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;
}
interface FAQItem { question: string; answer: string; }

interface EventDetail {
  id: string; title: string; slug: string; oveercode: string | null;
  description: string | null; category: string; event_type: string;
  status: string;
  start_date: string | null; end_date: string | null;
  registration_deadline: string | null;
  location: string | null; venue_name: string | null; address: string | null;
  city: string | null; country: string | null;
  latitude: number | null; longitude: number | null; online_url: string | null;
  price_cents: number; currency: string;
  early_bird_price_cents: number | null; early_bird_deadline: string | null;
  capacity: number | null; registered_count: number | null;
  thumbnail_url: string | null;
  organizer_name: string | null; organizer_logo_url: string | null;
  speakers: Speaker[] | null; agenda: AgendaItem[] | null;
  highlights: string[] | null; faq: FAQItem[] | null;
  tags: string[] | null; badge: string | null; level: string | null;
  created_at: string;
}

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const formatDate = (d: string | null, withTime = false) => {
  if (!d) return "";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  if (withTime) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
  return new Date(d).toLocaleDateString("id-ID", opts);
};

const NAV_ITEMS = [
  { id: "event", label: "Event" },
  { id: "agenda", label: "Agenda" },
  { id: "speakers", label: "Speakers" },
  { id: "location", label: "Lokasi" },
  { id: "faq", label: "FAQ" },
];

const EventDetail = () => {
  const { oveercode } = useParams<{ oveercode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("event");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [userOrder, setUserOrder] = useState<{ order_number: string; checked_in_at: string | null; status: string } | null>(null);

  const handleBuyTicket = () => {
    if (!user) { navigate("/auth"); return; }
    if (!event) return;

    const now = new Date();
    const isEarlyBird = event.early_bird_price_cents != null
      && event.early_bird_deadline
      && new Date(event.early_bird_deadline) > now;
    const price = isEarlyBird ? event.early_bird_price_cents! : event.price_cents;

    if (price === 0) {
      // Free event — direct register (could be enhanced)
      navigate(`/checkout?type=event_ticket&event_id=${event.id}&title=${encodeURIComponent(event.title)}&amount=0&currency=${event.currency}`);
      return;
    }

    const params = new URLSearchParams({
      type: "event_ticket",
      event_id: event.id,
      title: event.title,
      amount: String(price),
      currency: event.currency || "IDR",
    });
    if (event.oveercode) params.set("oveercode", event.oveercode);
    if (event.slug) params.set("slug", event.slug);
    if (event.category) params.set("category", event.category);
    if (event.thumbnail_url) params.set("thumbnail", event.thumbnail_url);
    if (event.start_date) params.set("duration", formatDate(event.start_date));
    navigate(`/checkout?${params.toString()}`);
  };

  useEffect(() => {
    if (!oveercode) return;
    const fetchEvent = async () => {
      setLoading(true);
      let { data } = await (supabase.from("events") as any).select("*").eq("oveercode", oveercode).eq("status", "published").maybeSingle();
      if (!data) {
        const fallback = await (supabase.from("events") as any).select("*").eq("slug", oveercode).eq("status", "published").maybeSingle();
        data = fallback.data;
      }
      if (data) {
        const evt: EventDetail = {
          ...data,
          speakers: Array.isArray(data.speakers) ? data.speakers : null,
          agenda: Array.isArray(data.agenda) ? data.agenda : null,
          highlights: Array.isArray(data.highlights) ? data.highlights : null,
          faq: Array.isArray(data.faq) ? data.faq : null,
          tags: Array.isArray(data.tags) ? data.tags : null,
        };
        setEvent(evt);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [oveercode]);

  // Fetch user's order for this event
  useEffect(() => {
    if (!user || !event) return;
    const fetchUserOrder = async () => {
      const { data } = await (supabase.from("event_orders") as any)
        .select("order_number, checked_in_at, status")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .in("status", ["paid", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setUserOrder(data || null);
    };
    fetchUserOrder();
  }, [user, event]);

  // Scroll spy
  useEffect(() => {
    const handler = () => {
      for (const item of NAV_ITEMS) {
        const el = sectionRefs.current[item.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) setActiveSection(item.id);
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-6 py-20 text-center">
          <Ticket className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Event tidak ditemukan</h1>
          <Button onClick={() => navigate("/events")} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</Button>
        </div>
      </div>
    );
  }

  const isFull = event.capacity != null && (event.registered_count || 0) >= event.capacity;
  const isFree = event.price_cents === 0;
  const now = new Date();
  const isEarlyBird = event.early_bird_price_cents != null && event.early_bird_deadline && new Date(event.early_bird_deadline) > now;
  const currentPrice = isEarlyBird ? event.early_bird_price_cents! : event.price_cents;
  const isPast = event.end_date ? new Date(event.end_date) < now : (event.start_date ? new Date(event.start_date) < now : false);
  const deadlinePassed = event.registration_deadline ? new Date(event.registration_deadline) < now : false;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      {/* Sticky nav */}
      <div className="sticky top-16 z-30 bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl flex items-center gap-1 overflow-x-auto py-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/events")} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Events
          </Button>
          <Separator orientation="vertical" className="h-5 mx-2" />
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => sectionRefs.current[item.id]?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                activeSection === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Main content */}
          <div className="space-y-8">
            {/* Hero */}
            <section ref={el => (sectionRefs.current.event = el)} className="scroll-mt-28">
              {event.thumbnail_url && (
                <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
                  <img src={event.thumbnail_url} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="capitalize">{event.event_type}</Badge>
                <Badge variant="outline">{event.category}</Badge>
                {event.badge && <Badge className="bg-primary text-primary-foreground">{event.badge}</Badge>}
                {isPast && <Badge variant="destructive">Event Ended</Badge>}
                {isFull && !isPast && <Badge variant="destructive">Sold Out</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">{event.title}</h1>
              {event.organizer_name && (
                <p className="text-muted-foreground flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4" /> Diselenggarakan oleh <span className="font-medium text-foreground">{event.organizer_name}</span>
                </p>
              )}
              {event.description && (
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </div>
              )}
              {event.highlights && event.highlights.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-foreground mb-3">Highlights</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {event.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {event.tags.map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3" />{t}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Agenda */}
            {event.agenda && event.agenda.length > 0 && (
              <section ref={el => (sectionRefs.current.agenda = el)} className="scroll-mt-28">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Agenda</h2>
                    <div className="space-y-4">
                      {event.agenda.map((a, i) => (
                        <div key={i} className="flex gap-4 border-l-2 border-primary/30 pl-4">
                          <div className="shrink-0">
                            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{a.time}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{a.title}</p>
                            {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                            {a.speaker && <p className="text-xs text-primary mt-1">{a.speaker}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <section ref={el => (sectionRefs.current.speakers = el)} className="scroll-mt-28">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Speakers</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {event.speakers.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            {s.title && <p className="text-xs text-muted-foreground">{s.title}</p>}
                            {s.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.bio}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Location */}
            <section ref={el => (sectionRefs.current.location = el)} className="scroll-mt-28">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Lokasi</h2>
                  {event.event_type === "online" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span>Online Event</span>
                      {event.online_url && (
                        <a href={event.online_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 ml-2">
                          <ExternalLink className="w-3 h-3" /> Join Link
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {event.venue_name && <p className="text-sm font-medium text-foreground">{event.venue_name}</p>}
                      {event.address && <p className="text-sm text-muted-foreground flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5" />{event.address}</p>}
                      {(event.city || event.country) && (
                        <p className="text-sm text-muted-foreground">{[event.city, event.country].filter(Boolean).join(", ")}</p>
                      )}
                      {event.latitude && event.longitude && (
                        <div className="rounded-xl overflow-hidden border border-border h-48 mt-3">
                          <iframe
                            title="Event Location"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.01},${event.latitude - 0.01},${event.longitude + 0.01},${event.latitude + 0.01}&layer=mapnik&marker=${event.latitude},${event.longitude}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* FAQ */}
            {event.faq && event.faq.length > 0 && (
              <section ref={el => (sectionRefs.current.faq = el)} className="scroll-mt-28">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">FAQ</h2>
                    <div className="space-y-2">
                      {event.faq.map((f, i) => (
                        <Collapsible key={i}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-sm font-medium text-foreground">{f.question}</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-3 pb-3">
                            <p className="text-sm text-muted-foreground">{f.answer}</p>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-32">
              <CardContent className="p-6 space-y-4">
                {/* Price */}
                <div>
                  {isEarlyBird ? (
                    <div>
                      <p className="text-xs text-primary font-medium mb-1">🎉 Early Bird Price</p>
                      <p className="text-2xl font-bold text-foreground">{formatRupiah(event.early_bird_price_cents!)}</p>
                      <p className="text-sm text-muted-foreground line-through">{formatRupiah(event.price_cents)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Berakhir {formatDate(event.early_bird_deadline)}</p>
                    </div>
                  ) : isFree ? (
                    <p className="text-2xl font-bold text-primary">Free</p>
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{formatRupiah(event.price_cents)}</p>
                  )}
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-3 text-sm">
                  {event.start_date && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">{formatDate(event.start_date, true)}</p>
                        {event.end_date && event.end_date !== event.start_date && (
                          <p className="text-xs">s.d. {formatDate(event.end_date, true)}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {event.event_type !== "online" && (event.venue_name || event.city) && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{event.venue_name || event.city}</span>
                    </div>
                  )}
                  {event.event_type === "online" && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4" /> Online
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{event.registered_count || 0} / {event.capacity} peserta</span>
                    </div>
                  )}
                  {event.registration_deadline && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Registrasi ditutup {formatDate(event.registration_deadline)}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBuyTicket}
                  disabled={isFull || isPast || deadlinePassed}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  {isPast ? "Event Telah Berakhir" : isFull ? "Sold Out" : deadlinePassed ? "Registrasi Ditutup" : isFree ? "Register (Free)" : `Buy Ticket — ${formatRupiah(currentPrice)}`}
                </Button>

                {event.oveercode && (
                  <p className="text-center text-xs text-muted-foreground font-mono">{event.oveercode}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
