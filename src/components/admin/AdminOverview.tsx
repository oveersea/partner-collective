import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Shield, Briefcase, CreditCard, FileText, TrendingUp, Building2, GraduationCap, Mail, UserCheck, Wallet, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  users: number;
  activeJobs: number;
  fastHiring: number;
  pendingOrders: number;
  programs: number;
  tests: number;
}

interface ExtraStats {
  pendingKyc: number;
  companies: number;
  enrollments: number;
  emailsSent: number;
  verifiedUsers: number;
  walletDeposits: number;
  serviceOrders: number;
  hiringRequests: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [extra, setExtra] = useState<ExtraStats>({
    pendingKyc: 0, companies: 0, enrollments: 0, emailsSent: 0,
    verifiedUsers: 0, walletDeposits: 0, serviceOrders: 0, hiringRequests: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [rpcRes, kycRes, compRes, enrollRes, emailRes, verifiedRes, walletRes, orderRes, hiringRes] = await Promise.all([
      supabase.rpc("get_admin_dashboard_stats"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("kyc_status", "pending"),
      supabase.from("business_profiles").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
      supabase.from("email_sends").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("kyc_status", "verified"),
      supabase.from("wallet_deposits").select("*", { count: "exact", head: true }).eq("status", "paid"),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("hiring_requests").select("*", { count: "exact", head: true }),
    ]);

    if (rpcRes.data) setStats(rpcRes.data as unknown as Stats);
    setExtra({
      pendingKyc: kycRes.count || 0,
      companies: compRes.count || 0,
      enrollments: enrollRes.count || 0,
      emailsSent: emailRes.count || 0,
      verifiedUsers: verifiedRes.count || 0,
      walletDeposits: walletRes.count || 0,
      serviceOrders: orderRes.count || 0,
      hiringRequests: hiringRes.count || 0,
    });
  };

  const cards = stats
    ? [
        { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
        { label: "Verified Users", value: extra.verifiedUsers, icon: UserCheck, color: "text-green-500" },
        { label: "KYC Pending", value: extra.pendingKyc, icon: Shield, color: "text-amber-500" },
        { label: "Companies", value: extra.companies, icon: Building2, color: "text-indigo-500" },
        { label: "Active Jobs", value: stats.activeJobs, icon: Briefcase, color: "text-blue-500" },
        { label: "Hiring Requests", value: extra.hiringRequests, icon: ClipboardList, color: "text-rose-500" },
        { label: "Fast Hiring", value: stats.fastHiring, icon: TrendingUp, color: "text-emerald-500" },
        { label: "Pending Orders", value: stats.pendingOrders, icon: CreditCard, color: "text-orange-500" },
        { label: "Service Orders", value: extra.serviceOrders, icon: Wallet, color: "text-cyan-500" },
        { label: "Active Programs", value: stats.programs, icon: FileText, color: "text-purple-500" },
        { label: "Enrollments", value: extra.enrollments, icon: GraduationCap, color: "text-teal-500" },
        { label: "Emails Sent", value: extra.emailsSent, icon: Mail, color: "text-pink-500" },
      ]
    : [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">Dashboard Overview</h2>
      {!stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
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
