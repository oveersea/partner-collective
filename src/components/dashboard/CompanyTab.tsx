import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompanyItem {
  id: string;
  role: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    industry: string | null;
    city: string | null;
    description: string | null;
    kyc_status: string;
  };
}

const CompanyTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchCompanies();
  }, [user]);

  const fetchCompanies = async () => {
    const { data: members } = await supabase
      .from("business_members")
      .select("id, role, status, business_id")
      .eq("user_id", user!.id)
      .eq("status", "active");

    if (!members || members.length === 0) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    const ids = members.map((m) => m.business_id);
    const { data: businesses } = await supabase
      .from("business_profiles")
      .select("id, name, slug, logo_url, industry, city, description, kyc_status")
      .in("id", ids);

    const merged = members.map((m) => ({
      id: m.id,
      role: m.role,
      business: businesses?.find((b) => b.id === m.business_id) || {
        id: m.business_id,
        name: "Unknown",
        slug: "",
        logo_url: null,
        industry: null,
        city: null,
        description: null,
        kyc_status: "pending",
      },
    }));
    setCompanies(merged);
    setLoading(false);
  };

  const roleBadge = (role: string) => {
    if (role === "owner") return "bg-amber-500/10 text-amber-600 border-amber-200";
    if (role === "admin") return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Building2 className="w-4 h-4" /> My Companies
      </h3>

      {companies.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-card-foreground mb-1">No companies yet</h3>
          <p className="text-sm text-muted-foreground">You're not a member of any company yet.</p>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {companies.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
              onClick={() => navigate(`/company/${c.business.slug}`)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.business.logo_url ? (
                    <img src={c.business.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground truncate">{c.business.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {[c.business.industry, c.business.city].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${roleBadge(c.role)}`}>
                  {c.role}
                </Badge>
              </div>
              {c.business.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{c.business.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyTab;
