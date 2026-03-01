import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Shield, Briefcase, CreditCard, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  users: number;
  activeJobs: number;
  fastHiring: number;
  pendingOrders: number;
  programs: number;
  tests: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingKyc, setPendingKyc] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.rpc("get_admin_dashboard_stats");
    if (data) setStats(data as unknown as Stats);

    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("kyc_status", "pending");
    setPendingKyc(count || 0);
  };

  const cards = stats
    ? [
        { label: "Total User", value: stats.users, icon: Users, color: "text-primary" },
        { label: "KYC Pending", value: pendingKyc, icon: Shield, color: "text-amber-500" },
        { label: "Lowongan Aktif", value: stats.activeJobs, icon: Briefcase, color: "text-blue-500" },
        { label: "Fast Hiring", value: stats.fastHiring, icon: TrendingUp, color: "text-emerald-500" },
        { label: "Order Pending", value: stats.pendingOrders, icon: CreditCard, color: "text-orange-500" },
        { label: "Program Aktif", value: stats.programs, icon: FileText, color: "text-purple-500" },
      ]
    : [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">Dashboard Overview</h2>
      {!stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
