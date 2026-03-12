import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Target, Users, Clock, Shield, Star, Award, Crown, Send, Loader2, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  required_skills: string[];
  min_match_pct: number;
  category_id: string;
  category_name: string | null;
}

const urgencyOptions = [
  { value: "normal", label: "Normal (14 days)", desc: "Standard processing" },
  { value: "priority", label: "Priority (7 days)", desc: "Expedited processing" },
  { value: "urgent", label: "Urgent (3 days)", desc: "Fastest processing" },
];

const budgetOptions = [
  { value: "under_5m", label: "< $5,000" },
  { value: "5m_15m", label: "$5,000 - $15,000" },
  { value: "15m_50m", label: "$15,000 - $50,000" },
  { value: "50m_100m", label: "$50,000 - $100,000" },
  { value: "above_100m", label: "> $100,000" },
  { value: "negotiable", label: "Negotiable" },
];

const teamSizeOptions = [
  { value: "1", label: "1 person" },
  { value: "2-3", label: "2 - 3 people" },
  { value: "4-6", label: "4 - 6 people" },
  { value: "7+", label: "7+ people" },
];

const tiers = [
  { label: "Advisor", min: 90, icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Expert", min: 70, icon: Award, color: "text-primary", bg: "bg-primary/10" },
  { label: "Senior", min: 50, icon: Star, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Junior", min: 20, icon: Shield, color: "text-muted-foreground", bg: "bg-muted" },
];

const ServiceOrder = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [service, setService] = useState<ServiceInfo | null>(null);
  const [providerCount, setProviderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [budget, setBudget] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!slug) return;
    const fetchService = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("services")
        .select("id, name, slug, description, required_skills, min_match_pct, category_id")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!data) { setLoading(false); return; }

      const { data: cat } = await (supabase as any)
        .from("service_categories")
        .select("name")
        .eq("id", (data as any).category_id)
        .single();

      setService({ ...(data as any), required_skills: (data as any).required_skills || [], category_name: (cat as any)?.name || null });

      const { count } = await (supabase as any)
        .from("user_services")
        .select("id", { count: "exact", head: true })
        .eq("service_id", (data as any).id)
        .eq("is_active", true);
      setProviderCount(count || 0);
      setLoading(false);
    };
    fetchService();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !service) return;

    if (!projectTitle.trim()) {
      toast({ title: "Error", description: "Project title is required", variant: "destructive" });
      return;
    }
    if (!budget) {
      toast({ title: "Error", description: "Please select a budget estimate", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: orderNum } = await supabase.rpc("generate_order_number");
      const items = {
        service_id: service.id, service_name: service.name, project_title: projectTitle.trim(),
        project_description: projectDesc.trim(), urgency, budget_range: budget, team_size: teamSize,
      };
      const slaType = urgency === "urgent" ? "urgent" : urgency === "priority" ? "priority" : "normal";
      const { error } = await (supabase as any).from("orders").insert({
        user_id: user.id, order_number: orderNum || "", expertise_slug: service.category_id,
        service_slug: service.slug, items: items as any, total_cents: 0, currency: "IDR",
        status: "pending", sla_type: slaType, notes: notes.trim() || null, created_by: user.id,
      });
      if (error) throw error;
      toast({ title: "Order created successfully!", description: `Order number: ${orderNum}. Our team will contact you shortly.` });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Failed to create order", description: err.message || "An error occurred, please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-24">
          <div className="animate-pulse space-y-6 max-w-3xl">
            <div className="h-4 bg-muted rounded w-40" />
            <div className="h-10 bg-muted rounded w-2/3" />
            <div className="h-5 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-24 text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-4">Service Not Found</h1>
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to={`/services/${service.slug}`} className="hover:text-foreground transition-colors">{service.name}</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Order</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Order Service</h1>
              <p className="text-muted-foreground mb-8">
                Complete your project details for <span className="font-medium text-foreground">{service.name}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="project-title">Project Title <span className="text-destructive">*</span></Label>
                  <Input id="project-title" placeholder="e.g. Company website redesign" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-desc">Project Description</Label>
                  <Textarea id="project-desc" placeholder="Describe in detail what you need, including goals, target audience, and expected outcomes..." rows={5} value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Urgency Level</Label>
                    <Select value={urgency} onValueChange={setUrgency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {urgencyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div><span>{opt.label}</span><span className="text-xs text-muted-foreground ml-2">— {opt.desc}</span></div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Talent Required</Label>
                    <Select value={teamSize} onValueChange={setTeamSize}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {teamSizeOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Budget <span className="text-destructive">*</span></Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger>
                    <SelectContent>
                      {budgetOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea id="notes" placeholder="Additional information, preferences, or questions..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="flex gap-3 p-4 bg-primary/5 border border-primary/10 text-sm text-muted-foreground" style={{ borderRadius: "5px" }}>
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">What happens after ordering?</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Our team will review your requirements within 24 hours.</li>
                      <li>You will receive a proposal with matching talent.</li>
                      <li>After confirmation, collaboration begins.</li>
                    </ol>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50" style={{ borderRadius: "5px" }}>
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Processing...</>) : (<><Send className="w-4 h-4" />Submit Order</>)}
                </button>
              </form>
            </motion.div>

            {/* Sidebar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
              <div className="border border-border bg-card p-6 sticky top-28" style={{ borderRadius: "5px" }}>
                {service.category_name && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-2 block">{service.category_name}</span>
                )}
                <h2 className="text-lg font-semibold text-foreground mb-3">{service.name}</h2>
                <p className="text-sm text-muted-foreground mb-5 line-clamp-3">{service.description}</p>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Thousands of talent ready to help you</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Skills</span>
                    <span className="ml-auto font-semibold text-foreground">{service.required_skills.length}</span>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Required Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {service.required_skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary font-medium" style={{ borderRadius: "5px" }}>
                        <CheckCircle2 className="w-3 h-3" />{skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Talent Tier</span>
                  <div className="space-y-1.5">
                    {tiers.map((tier) => {
                      const isActive = service.min_match_pct >= tier.min;
                      return (
                        <div key={tier.label} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md transition-colors ${isActive ? `${tier.bg} ${tier.color} font-medium` : "text-muted-foreground/40"}`}>
                          <tier.icon className="w-3.5 h-3.5" /><span>{tier.label}</span><span className="ml-auto">≥ {tier.min}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceOrder;
