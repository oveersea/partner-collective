import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Clock, Briefcase, Zap, Filter,
  ChevronDown, Star, Send, X, DollarSign, Users, Globe,
  Building2, TrendingUp, CheckCircle2, Eye, ShoppingBag, Package,
  HandCoins, UserCircle, Loader2,
} from "lucide-react";
import DashboardBreadcrumb from "@/components/dashboard/DashboardBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DashboardNav from "@/components/dashboard/DashboardNav";

// ─── Types ───────────────────────────────────────────────────────────
interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  category: string;
  skills_required: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  is_remote: boolean | null;
  location: string | null;
  demand_type: string | null;
  project_duration: string | null;
  deadline: string | null;
  company_name: string | null;
  job_type: string | null;
  min_experience_years: number | null;
  created_at: string;
  slug: string;
  user_id: string;
  oveercode: string | null;
}

interface UserProfile {
  skills: string[] | null;
  years_of_experience: number | null;
  full_name: string | null;
  headline: string | null;
}

interface OpenOrder {
  id: string;
  order_number: string;
  expertise_slug: string;
  service_slug: string;
  items: any;
  total_cents: number;
  currency: string;
  sla_type: string;
  sla_deadline: string | null;
  notes: string | null;
  created_at: string;
  source_type: "service_order";
}

interface OpenHiring {
  id: string;
  title: string;
  description: string | null;
  required_skills: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  hiring_type: string | null;
  positions_count: number | null;
  created_at: string;
  source_type: "hiring_request";
}

type OpenItem = OpenOrder | OpenHiring;

interface VendorOption {
  id: string;
  name: string;
  type: "vendor";
}

interface TeamOption {
  id: string;
  name: string;
  type: "team";
}

type RepresentOption = { id: "personal"; name: string; type: "personal" } | VendorOption | TeamOption;

// ─── Component ───────────────────────────────────────────────────────
const Matchmaking = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Tab
  const [activeTab, setActiveTab] = useState<"opportunities" | "open_orders">("opportunities");

  // Opportunities state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Open orders state
  const [openItems, setOpenItems] = useState<OpenItem[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [representOptions, setRepresentOptions] = useState<RepresentOption[]>([]);

  // Common
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [remoteFilter, setRemoteFilter] = useState<"all" | "remote" | "onsite">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Apply modal (opportunities)
  const [applyModal, setApplyModal] = useState<Opportunity | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Claim modal (open orders)
  const [claimModal, setClaimModal] = useState<OpenItem | null>(null);
  const [claimNote, setClaimNote] = useState("");
  const [claimBid, setClaimBid] = useState("");
  const [claimAs, setClaimAs] = useState<string>("personal");
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    const [oppRes, profileRes, appsRes, ordersRes, hiringRes, claimsRes, vendorsRes, teamsRes] = await Promise.all([
      supabase
        .from("opportunities")
        .select("id, title, description, category, skills_required, budget_min, budget_max, is_remote, location, demand_type, project_duration, deadline, company_name, job_type, min_experience_years, created_at, slug, user_id, oveercode")
        .eq("status", "open")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("profiles").select("skills, years_of_experience, full_name, headline").eq("user_id", user.id).single(),
      supabase.from("opportunity_applications").select("opportunity_id").eq("user_id", user.id),
      // Open orders
      supabase
        .from("orders")
        .select("id, order_number, expertise_slug, service_slug, items, total_cents, currency, sla_type, sla_deadline, notes, created_at")
        .eq("status", "pending")
        .is("assigned_to", null)
        .order("created_at", { ascending: false })
        .limit(50),
      // Open hiring
      supabase
        .from("hiring_requests")
        .select("id, title, description, required_skills, experience_min, experience_max, hiring_type, positions_count, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50),
      // User's claims
      supabase.from("order_claims").select("source_id").eq("user_id", user.id),
      // User's vendors
      supabase.from("business_members").select("business_id, role, business_profiles(id, name)").eq("user_id", user.id).eq("status", "active"),
      // User's teams
      supabase.from("partner_team_members").select("team_id, partner_teams(id, name)").eq("user_id", user.id).eq("status", "active"),
    ]);

    if (oppRes.data) setOpportunities(oppRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    if (appsRes.data) setAppliedIds(new Set(appsRes.data.map((a) => a.opportunity_id)));

    // Merge open items
    const orders: OpenItem[] = (ordersRes.data || []).map((o) => ({ ...o, source_type: "service_order" as const }));
    const hirings: OpenItem[] = (hiringRes.data || []).map((h) => ({ ...h, source_type: "hiring_request" as const }));
    setOpenItems([...orders, ...hirings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    if (claimsRes.data) setClaimedIds(new Set(claimsRes.data.map((c) => c.source_id)));

    // Build represent options
    const opts: RepresentOption[] = [{ id: "personal", name: profileRes.data?.full_name || "Pribadi", type: "personal" }];
    if (vendorsRes.data) {
      vendorsRes.data.forEach((v: any) => {
        if (v.business_profiles) opts.push({ id: v.business_profiles.id, name: v.business_profiles.name, type: "vendor" });
      });
    }
    if (teamsRes.data) {
      teamsRes.data.forEach((t: any) => {
        if (t.partner_teams) opts.push({ id: t.partner_teams.id, name: t.partner_teams.name, type: "team" });
      });
    }
    setRepresentOptions(opts);
    setLoading(false);
  }, [user]);

  // ─── Opportunity helpers ──────────────────────────────────────────
  const calcMatchScore = (opp: Opportunity): number => {
    if (!profile?.skills?.length) return 0;
    const requiredSkills = opp.skills_required || [];
    if (!requiredSkills.length) return 50;
    let score = 0;
    const matched = requiredSkills.filter((s) => profile.skills!.some((ps) => ps.toLowerCase() === s.toLowerCase()));
    score += (matched.length / requiredSkills.length) * 60;
    const minExp = opp.min_experience_years || 0;
    const userExp = profile.years_of_experience || 0;
    if (userExp >= minExp) score += 25;
    else if (userExp >= minExp - 1) score += 15;
    score += 15;
    return Math.round(Math.min(score, 100));
  };

  const categories = useMemo(() => {
    const cats = new Set(opportunities.map((o) => o.category));
    return Array.from(cats).sort();
  }, [opportunities]);

  const filtered = useMemo(() => {
    let result = opportunities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => o.title.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q) || o.skills_required?.some((s) => s.toLowerCase().includes(q)));
    }
    if (categoryFilter) result = result.filter((o) => o.category === categoryFilter);
    if (remoteFilter === "remote") result = result.filter((o) => o.is_remote);
    if (remoteFilter === "onsite") result = result.filter((o) => !o.is_remote);
    return result.sort((a, b) => calcMatchScore(b) - calcMatchScore(a));
  }, [opportunities, searchQuery, categoryFilter, remoteFilter, profile]);

  const filteredOpen = useMemo(() => {
    if (!searchQuery.trim()) return openItems;
    const q = searchQuery.toLowerCase();
    return openItems.filter((item) => {
      if (item.source_type === "hiring_request") {
        const h = item as OpenHiring;
        return h.title.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q) || h.required_skills?.some((s) => s.toLowerCase().includes(q));
      }
      const o = item as OpenOrder;
      return o.order_number.toLowerCase().includes(q) || o.expertise_slug.toLowerCase().includes(q) || o.service_slug.toLowerCase().includes(q);
    });
  }, [openItems, searchQuery]);

  const handleApply = async () => {
    if (!applyModal) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: applyModal.id,
        user_id: user!.id,
        cover_letter: coverLetter.trim() || null,
        bid_amount: bidAmount ? Number(bidAmount) : null,
        status: "pending",
      });
      if (error) throw error;
      setAppliedIds((prev) => new Set(prev).add(applyModal.id));
      toast.success("Application submitted successfully!");
      setApplyModal(null);
      setCoverLetter("");
      setBidAmount("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async () => {
    if (!claimModal || !user) return;
    setClaimSubmitting(true);
    try {
      const selectedOpt = representOptions.find((o) => o.id === claimAs);
      const { error } = await supabase.from("order_claims").insert({
        source_type: claimModal.source_type,
        source_id: claimModal.id,
        user_id: user.id,
        claim_as: selectedOpt?.type || "personal",
        business_id: selectedOpt?.type === "vendor" ? selectedOpt.id : null,
        team_id: selectedOpt?.type === "team" ? selectedOpt.id : null,
        cover_note: claimNote.trim() || null,
        bid_amount: claimBid ? Number(claimBid) : null,
      });
      if (error) throw error;
      setClaimedIds((prev) => new Set(prev).add(claimModal.id));
      toast.success("Order claimed successfully! Awaiting admin approval.");
      setClaimModal(null);
      setClaimNote("");
      setClaimBid("");
      setClaimAs("personal");
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast.error("You have already claimed this order");
      } else {
        toast.error(err.message || "Failed to claim order");
      }
    } finally {
      setClaimSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-primary bg-primary/10 border-primary/20";
    if (score >= 50) return "text-amber-600 bg-amber-500/10 border-amber-500/20";
    return "text-muted-foreground bg-muted border-border";
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `Min ${fmt(min)}`;
    return `Max ${fmt(max!)}`;
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: currency || "IDR", maximumFractionDigits: 0 }).format(cents / 100);
  };

  const slaLabel = (sla: string) => {
    if (sla === "urgent") return { text: "Urgent", color: "bg-destructive/10 text-destructive" };
    if (sla === "priority") return { text: "Priority", color: "bg-amber-500/10 text-amber-600" };
    return { text: "Standard", color: "bg-muted text-muted-foreground" };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentItems = activeTab === "opportunities" ? filtered : filteredOpen;
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const paginated = currentItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <DashboardBreadcrumb items={[{ label: "Matchmaking" }]} />
      <div className="w-full px-6 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Matchmaking</h1>
              <p className="text-muted-foreground text-sm">Find opportunities & claim orders that match your skills</p>
            </div>
          </div>

          {profile?.skills && profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Your Skills:</span>
              {profile.skills.slice(0, 8).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
              ))}
              {profile.skills.length > 8 && <span className="text-xs text-muted-foreground">+{profile.skills.length - 8} more</span>}
            </div>
          )}
          {(!profile?.skills || profile.skills.length === 0) && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-600">
              ⚠️ Add skills to your profile for more accurate match recommendations.
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-muted rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab("opportunities"); setCurrentPage(1); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "opportunities" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Briefcase className="w-4 h-4" />
            Opportunities
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{opportunities.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab("open_orders"); setCurrentPage(1); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "open_orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ShoppingBag className="w-4 h-4" />
            Open Orders
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{openItems.length}</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder={activeTab === "opportunities" ? "Search by title, description, or skill..." : "Search orders or hiring..."} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            </div>
            {activeTab === "opportunities" && (
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
                <Filter className="w-4 h-4" /> Filter
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && activeTab === "opportunities" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-3 p-4 bg-card rounded-xl border border-border">
                  <div>
                    <Label className="text-xs text-muted-foreground">Kategori</Label>
                    <select className="mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      <option value="">All Categories</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mode Kerja</Label>
                    <div className="flex gap-1 mt-1">
                      {(["all", "remote", "onsite"] as const).map((f) => (
                        <button key={f} onClick={() => setRemoteFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${remoteFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                          {f === "all" ? "All" : f === "remote" ? "Remote" : "On-site"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {currentItems.length} {activeTab === "opportunities" ? "opportunities" : "orders"} found • Page {currentPage} of {totalPages || 1}
          </p>
        </div>

        {/* ── OPPORTUNITIES TAB ───────────────────── */}
        {activeTab === "opportunities" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(paginated as Opportunity[]).map((opp, idx) => {
              const score = calcMatchScore(opp);
              const applied = appliedIds.has(opp.id);
              const budget = formatBudget(opp.budget_min, opp.budget_max);
              const matchedSkills = opp.skills_required?.filter((s) => profile?.skills?.some((ps) => ps.toLowerCase() === s.toLowerCase())) || [];

              return (
                <motion.div key={opp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-lg transition-shadow flex flex-col cursor-pointer" onClick={() => navigate(`/job/${opp.oveercode || opp.slug}`)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{opp.category}</span>
                        {opp.demand_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground flex items-center gap-1">
                            {opp.demand_type === "team" ? <Users className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                            {opp.demand_type === "team" ? "Team" : "Partner"}
                          </span>
                        )}
                        {opp.is_remote && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1"><Globe className="w-3 h-3" /> Remote</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-card-foreground truncate">{opp.title}</h3>
                      {opp.company_name && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="w-3.5 h-3.5" /> {opp.company_name}</p>}
                      {opp.description && <div className="text-sm text-muted-foreground mt-2 line-clamp-2 [&_p]:m-0 [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: opp.description }} />}
                    </div>
                    <div className={`shrink-0 w-16 h-16 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(score)}`}>
                      <TrendingUp className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-lg font-semibold leading-none">{score}%</span>
                    </div>
                  </div>

                  {opp.skills_required && opp.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {opp.skills_required.map((skill) => {
                        const isMatched = matchedSkills.some((ms) => ms.toLowerCase() === skill.toLowerCase());
                        return (
                          <span key={skill} className={`text-xs px-2 py-0.5 rounded-full ${isMatched ? "bg-primary/15 text-primary font-medium" : "bg-muted text-muted-foreground"}`}>
                            {isMatched && <span className="mr-0.5">✓</span>}{skill}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                    {budget && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {budget}</span>}
                    {opp.location && !opp.is_remote && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {opp.location}</span>}
                    {opp.project_duration && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {opp.project_duration}</span>}
                    {opp.min_experience_years != null && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Min {opp.min_experience_years} yrs</span>}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">{new Date(opp.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <div className="flex items-center gap-2">
                      {applied ? (
                        <span className="flex items-center gap-1.5 text-sm text-primary font-medium"><CheckCircle2 className="w-4 h-4" /> Applied</span>
                      ) : (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); setApplyModal(opp); }}><Send className="w-3.5 h-3.5" /> Apply</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/job/${opp.oveercode || opp.slug}`); }}><Eye className="w-3.5 h-3.5" /> Detail</Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16 col-span-full">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No opportunities found</h3>
                <p className="text-sm text-muted-foreground">Try changing your filters or searching with different keywords</p>
              </div>
            )}
          </div>
        )}

        {/* ── OPEN ORDERS TAB ───────────────────── */}
        {activeTab === "open_orders" && (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <HandCoins className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Orders & Hiring Requests you can claim</p>
                <p className="text-muted-foreground mt-0.5">First come, first served. You can represent yourself, a vendor, or a team.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(paginated as OpenItem[]).map((item, idx) => {
                const claimed = claimedIds.has(item.id);
                const isHiring = item.source_type === "hiring_request";
                const hiring = isHiring ? (item as OpenHiring) : null;
                const order = !isHiring ? (item as OpenOrder) : null;

                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-lg transition-shadow flex flex-col">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${isHiring ? "bg-violet-500/10 text-violet-600" : "bg-primary/10 text-primary"}`}>
                        {isHiring ? <><Users className="w-3 h-3" /> Hiring Request</> : <><Package className="w-3 h-3" /> Service Order</>}
                      </span>
                      {order && (() => {
                        const sla = slaLabel(order.sla_type);
                        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sla.color}`}>{sla.text}</span>;
                      })()}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">
                      {isHiring ? hiring!.title : `${order!.service_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`}
                    </h3>
                    {order && <p className="text-sm text-muted-foreground mb-1">#{order.order_number}</p>}

                    {/* Description */}
                    {isHiring && hiring?.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{hiring.description}</p>}
                    {order?.notes && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{order.notes}</p>}

                    {/* Skills for hiring */}
                    {isHiring && hiring?.required_skills && hiring.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {hiring.required_skills.map((skill) => {
                          const isMatched = profile?.skills?.some((ps) => ps.toLowerCase() === skill.toLowerCase());
                          return (
                            <span key={skill} className={`text-xs px-2 py-0.5 rounded-full ${isMatched ? "bg-primary/15 text-primary font-medium" : "bg-muted text-muted-foreground"}`}>
                              {isMatched && <span className="mr-0.5">✓</span>}{skill}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 text-xs text-muted-foreground">
                      {order && <span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="w-3.5 h-3.5" /> {formatCurrency(order.total_cents, order.currency)}</span>}
                      {isHiring && hiring?.positions_count && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {hiring.positions_count} positions</span>}
                      {isHiring && hiring?.experience_min != null && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {hiring.experience_min}{hiring.experience_max ? `-${hiring.experience_max}` : "+"} yrs</span>}
                      {order?.sla_deadline && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(order.sla_deadline).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>}
                      <span className="flex items-center gap-1">{new Date(item.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>

                    {/* Action */}
                    <div className="mt-4 pt-4 border-t border-border">
                      {claimed ? (
                        <span className="flex items-center gap-1.5 text-sm text-primary font-medium"><CheckCircle2 className="w-4 h-4" /> Claimed</span>
                      ) : (
                        <Button className="w-full gap-2" onClick={() => { setClaimModal(item); setClaimAs("personal"); }}>
                          <HandCoins className="w-4 h-4" /> Claim Order
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {filteredOpen.length === 0 && (
                <div className="text-center py-16 col-span-full">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                   <h3 className="text-lg font-semibold text-foreground mb-1">No orders available yet</h3>
                   <p className="text-sm text-muted-foreground">New orders will appear here when clients need help</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted-foreground mx-1">…</span>}
                  <button onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>{p}</button>
                </span>
              ))}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* ── APPLY MODAL (Opportunities) ───────────────────── */}
      <AnimatePresence>
        {applyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setApplyModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border border-border p-6 shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-card-foreground">Apply for Opportunity</h2>
                <button onClick={() => setApplyModal(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-muted rounded-xl p-3 mb-4">
                <p className="font-semibold text-sm text-card-foreground">{applyModal.title}</p>
                <p className="text-xs text-muted-foreground">{applyModal.category} • {applyModal.company_name || "Company"}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-card-foreground">Pesan / Cover Letter</Label>
                  <Textarea className="mt-1.5" rows={4} placeholder="Jelaskan mengapa Anda cocok untuk peluang ini..." value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
                </div>
                {(applyModal.budget_min || applyModal.budget_max) && (
                  <div>
                    <Label className="text-card-foreground">Bid Amount (IDR)</Label>
                    <p className="text-xs text-muted-foreground mb-1.5">Budget: {formatBudget(applyModal.budget_min, applyModal.budget_max)}</p>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-10" type="number" placeholder="Enter your bid" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                    </div>
                  </div>
                )}
                <Button className="w-full" onClick={handleApply} disabled={submitting}>
                  <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CLAIM MODAL (Open Orders) ───────────────────── */}
      <AnimatePresence>
        {claimModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setClaimModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border border-border p-6 shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-card-foreground">Claim Order</h2>
                <button onClick={() => setClaimModal(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-muted rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${claimModal.source_type === "hiring_request" ? "bg-violet-500/10 text-violet-600" : "bg-primary/10 text-primary"}`}>
                    {claimModal.source_type === "hiring_request" ? "Hiring Request" : "Service Order"}
                  </span>
                </div>
                <p className="font-semibold text-sm text-card-foreground">
                  {claimModal.source_type === "hiring_request"
                    ? (claimModal as OpenHiring).title
                    : (claimModal as OpenOrder).service_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>

              <div className="space-y-4">
                {/* Mewakili siapa */}
                <div>
                  <Label className="text-card-foreground">Representing</Label>
                  <p className="text-xs text-muted-foreground mb-2">Choose whether you're claiming this order as an individual, vendor, or team</p>
                  <div className="grid gap-2">
                    {representOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setClaimAs(opt.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${claimAs === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        {opt.type === "personal" && <UserCircle className={`w-5 h-5 ${claimAs === opt.id ? "text-primary" : "text-muted-foreground"}`} />}
                        {opt.type === "vendor" && <Building2 className={`w-5 h-5 ${claimAs === opt.id ? "text-primary" : "text-muted-foreground"}`} />}
                        {opt.type === "team" && <Users className={`w-5 h-5 ${claimAs === opt.id ? "text-primary" : "text-muted-foreground"}`} />}
                        <div>
                          <p className={`text-sm font-medium ${claimAs === opt.id ? "text-foreground" : "text-muted-foreground"}`}>{opt.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {opt.type === "personal" ? "Representing yourself" : opt.type === "vendor" ? "Representing vendor/company" : "Representing team"}
                          </p>
                        </div>
                        {claimAs === opt.id && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-card-foreground">Catatan (opsional)</Label>
                  <Textarea className="mt-1.5" rows={3} placeholder="Mengapa Anda cocok untuk order ini..." value={claimNote} onChange={(e) => setClaimNote(e.target.value)} />
                </div>

                <div>
                  <Label className="text-card-foreground">Price Offer (optional)</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" type="number" placeholder="Enter your offer" value={claimBid} onChange={(e) => setClaimBid(e.target.value)} />
                  </div>
                </div>

                <Button className="w-full" onClick={handleClaim} disabled={claimSubmitting}>
                  {claimSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandCoins className="w-4 h-4" />}
                  {claimSubmitting ? "Claiming..." : "Claim This Order"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Matchmaking;
