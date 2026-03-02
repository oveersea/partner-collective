import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, Lock, Unlock } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  required_skills: string[];
  min_match_pct: number;
  category_id: string;
}

interface UserService {
  service_id: string;
  match_score: number;
  is_active: boolean;
}

const ServicesTab = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [userServices, setUserServices] = useState<Map<string, UserService>>(new Map());
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [catRes, svcRes, userSvcRes, profileRes] = await Promise.all([
      supabase.from("service_categories").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("user_services").select("service_id, match_score, is_active").eq("user_id", user!.id),
      supabase.from("profiles").select("skills").eq("user_id", user!.id).single(),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (svcRes.data) setServices(svcRes.data as Service[]);
    if (userSvcRes.data) {
      const map = new Map<string, UserService>();
      userSvcRes.data.forEach((us: any) => map.set(us.service_id, us));
      setUserServices(map);
    }
    if (profileRes.data?.skills) setUserSkills(profileRes.data.skills);
    if (catRes.data && catRes.data.length > 0) setExpandedCat(catRes.data[0].id);
    setLoading(false);
  };

  const calculateMatch = (requiredSkills: string[]): number => {
    if (!requiredSkills.length) return 100;
    const matched = requiredSkills.filter(rs =>
      userSkills.some(us => us.toLowerCase() === rs.toLowerCase())
    ).length;
    return Math.round((matched / requiredSkills.length) * 100);
  };

  const toggleService = async (service: Service) => {
    if (!user) return;
    const matchScore = calculateMatch(service.required_skills);
    if (matchScore < service.min_match_pct) {
      toast.error(`Your skill match is ${matchScore}%, minimum ${service.min_match_pct}% required`);
      return;
    }

    setToggling(service.id);
    const existing = userServices.get(service.id);

    if (existing) {
      // Toggle active
      const { error } = await supabase
        .from("user_services")
        .update({ is_active: !existing.is_active, match_score: matchScore })
        .eq("user_id", user.id)
        .eq("service_id", service.id);

      if (error) {
        toast.error("Failed to update service status");
      } else {
        toast.success(existing.is_active ? "Service deactivated" : "Service activated");
        setUserServices(prev => {
          const next = new Map(prev);
          next.set(service.id, { ...existing, is_active: !existing.is_active, match_score: matchScore });
          return next;
        });
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("user_services")
        .insert({ user_id: user.id, service_id: service.id, match_score: matchScore, is_active: true });

      if (error) {
        toast.error("Failed to add service");
      } else {
        toast.success("Service added successfully!");
        setUserServices(prev => {
          const next = new Map(prev);
          next.set(service.id, { service_id: service.id, match_score: matchScore, is_active: true });
          return next;
        });
      }
    }
    setToggling(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = Array.from(userServices.values()).filter(us => us.is_active).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="rounded-xl bg-card border border-border p-3 md:p-4">
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Services</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{userSkills.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Your Skills</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{services.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Services</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Categories</p>
        </div>
      </div>

      {userSkills.length === 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">
            ⚠️ You haven't added any skills to your profile yet. Add skills first to activate services.
          </p>
        </div>
      )}

      {/* Service categories accordion */}
      <div className="space-y-3">
        {categories.map(cat => {
          const catServices = services.filter(s => s.category_id === cat.id);
          const isExpanded = expandedCat === cat.id;
          const activatedInCat = catServices.filter(s => userServices.get(s.id)?.is_active).length;

          return (
            <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {catServices.length} services
                  </span>
                  {activatedInCat > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {activatedInCat} active
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border">
                  {catServices.map(service => {
                    const matchScore = calculateMatch(service.required_skills);
                    const meetsMin = matchScore >= service.min_match_pct;
                    const userSvc = userServices.get(service.id);
                    const isActive = userSvc?.is_active ?? false;
                    const isToggling = toggling === service.id;

                    return (
                      <div
                        key={service.id}
                        className={`flex items-start gap-4 p-4 border-b border-border last:border-b-0 transition-colors ${
                          isActive ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground">{service.name}</h4>
                            {isActive && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                          
                          {/* Required skills */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {service.required_skills.map(skill => {
                              const hasSkill = userSkills.some(us => us.toLowerCase() === skill.toLowerCase());
                              return (
                                <span
                                  key={skill}
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${
                                    hasSkill
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {hasSkill ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3 opacity-40" />}
                                  {skill}
                                </span>
                              );
                            })}
                          </div>

                          {/* Match bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[200px]">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${matchScore}%`,
                                  background: meetsMin ? "hsl(var(--primary))" : "hsl(var(--destructive))",
                                }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${meetsMin ? "text-primary" : "text-destructive"}`}>
                              {matchScore}% match
                            </span>
                            {!meetsMin && (
                              <span className="text-xs text-muted-foreground">(min {service.min_match_pct}%)</span>
                            )}
                          </div>
                        </div>

                        {/* Toggle button */}
                        <button
                          onClick={() => toggleService(service)}
                          disabled={isToggling || (!meetsMin && !isActive)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground hover:opacity-90"
                              : meetsMin
                                ? "border border-primary/30 text-primary hover:bg-primary/10"
                                : "border border-border text-muted-foreground cursor-not-allowed opacity-50"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isActive ? (
                            <Unlock className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          {isActive ? "Deactivate" : meetsMin ? "Activate" : "Insufficient Skills"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesTab;
