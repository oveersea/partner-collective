import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Building2, Plus, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CompanyItem {
  id: string;
  role: string;
  status: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    kyc_status: string;
  };
}

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("business_members")
      .select("id, role, status, business_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .then(async ({ data: members }) => {
        if (!members || members.length === 0) {
          setCompanies([]);
          setLoading(false);
          return;
        }
        const ids = members.map((m) => m.business_id);
        const { data: businesses } = await supabase
          .from("business_profiles")
          .select("id, name, slug, logo_url, industry, city, kyc_status")
          .in("id", ids);

        const merged = members.map((m) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          business: businesses?.find((b) => b.id === m.business_id) || {
            id: m.business_id,
            name: "Unknown",
            slug: "",
            logo_url: null,
            industry: null,
            city: null,
            kyc_status: "pending",
          },
        }));
        setCompanies(merged);
        setLoading(false);
      });
  }, [user]);

  const roleBadge = (role: string) => {
    if (role === "owner") return "bg-amber-100 text-amber-700 border-amber-200";
    if (role === "admin") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-3xl pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Companies</h1>
            <p className="text-sm text-muted-foreground mt-1">Companies you're a member of</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">You're not a member of any company yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                to={`/company/${c.business.slug}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.business.logo_url ? (
                    <img src={c.business.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{c.business.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[c.business.industry, c.business.city].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${roleBadge(c.role)}`}>
                  {c.role}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
