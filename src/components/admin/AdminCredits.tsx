import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, CreditCard, Wallet } from "lucide-react";

interface CreditOrder {
  id: string;
  order_number: string;
  credits: number;
  amount_cents: number;
  currency: string;
  status: string;
  buyer_type: string;
  created_at: string;
  user_id: string;
  user_name?: string;
  business_name?: string;
}

interface WalletDeposit {
  id: string;
  deposit_number: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

const AdminCredits = () => {
  const [orders, setOrders] = useState<CreditOrder[]>([]);
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "deposits">("orders");
  const navigate = useNavigate();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch orders
    const { data: ordData } = await supabase
      .from("credit_orders")
      .select("id, order_number, credits, amount_cents, currency, status, buyer_type, user_id, business_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch deposits
    const { data: depData } = await supabase
      .from("wallet_deposits")
      .select("id, deposit_number, amount, method, status, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    // Collect unique user IDs to fetch names
    const userIds = new Set<string>();
    const businessIds = new Set<string>();
    ordData?.forEach((o: any) => { if (o.user_id) userIds.add(o.user_id); if (o.business_id) businessIds.add(o.business_id); });
    depData?.forEach((d: any) => { if (d.user_id) userIds.add(d.user_id); });

    // Fetch profiles and business names
    const [profilesRes, bizRes] = await Promise.all([
      userIds.size > 0
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", Array.from(userIds))
        : Promise.resolve({ data: [] }),
      businessIds.size > 0
        ? supabase.from("business_profiles").select("id, name").in("id", Array.from(businessIds))
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name || ""; });
    const bizMap: Record<string, string> = {};
    (bizRes.data || []).forEach((b: any) => { bizMap[b.id] = b.name || ""; });

    if (ordData) {
      setOrders(ordData.map((o: any) => ({
        ...o,
        user_name: profileMap[o.user_id] || "",
        business_name: bizMap[o.business_id] || "",
      })) as CreditOrder[]);
    }
    if (depData) {
      setDeposits(depData.map((d: any) => ({
        ...d,
        user_name: profileMap[d.user_id] || "",
      })) as WalletDeposit[]);
    }
    setLoading(false);
  };

  const approveOrder = async (id: string) => {
    const { error } = await supabase.from("credit_orders").update({ status: "paid" }).eq("id", id);
    if (error) toast.error("Failed to approve order: " + error.message);
    else { toast.success("Order approved"); fetchData(); }
  };

  const rejectOrder = async (id: string) => {
    const { error } = await supabase.from("credit_orders").update({ status: "rejected" }).eq("id", id);
    if (error) toast.error("Failed to reject order");
    else { toast.success("Order rejected"); fetchData(); }
  };

  const approveDeposit = async (id: string) => {
    const { error } = await supabase.from("wallet_deposits").update({ status: "paid" }).eq("id", id);
    if (error) toast.error("Failed to approve deposit: " + error.message);
    else { toast.success("Deposit approved"); fetchData(); }
  };

  const statusBadge = (s: string) => {
    if (s === "paid" || s === "confirmed") return "bg-primary/10 text-primary";
    if (s === "pending") return "bg-amber-500/10 text-amber-600";
    if (s === "rejected" || s === "cancelled") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">Credits & Wallet</h2>

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")}>
          <CreditCard className="w-4 h-4 mr-1" /> Credit Orders
        </Button>
        <Button size="sm" variant={tab === "deposits" ? "default" : "outline"} onClick={() => setTab("deposits")}>
          <Wallet className="w-4 h-4 mr-1" /> Wallet Deposits
        </Button>
      </div>

      {tab === "orders" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User / Company</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Credits</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                   <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : orders.length === 0 ? (
                   <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No data</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/credit/${o.id}?type=order`)}>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{o.order_number}</td>
                      <td className="px-4 py-3 text-foreground text-xs">
                        {o.business_name || o.user_name || "—"}
                        <Badge variant="secondary" className="ml-2 text-[10px]">{o.buyer_type}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{o.credits}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: o.currency || "IDR", maximumFractionDigits: 0 }).format(o.amount_cents)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("en-US")}</td>
                       <td className="px-4 py-3 text-right">
                         {o.status === "pending" && (
                           <div className="flex gap-1 justify-end">
                             <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); approveOrder(o.id); }}>
                               <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                             </Button>
                             <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); rejectOrder(o.id); }}>
                               <XCircle className="w-3 h-3" />
                             </Button>
                           </div>
                         )}
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "deposits" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deposit #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                   <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                   <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No data</td></tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/credit/${d.id}?type=deposit`)}>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{d.deposit_number}</td>
                      <td className="px-4 py-3 text-foreground text-xs">{d.user_name || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(d.amount)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{d.method}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(d.status)}`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString("en-US")}</td>
                       <td className="px-4 py-3 text-right">
                         {d.status === "pending" && (
                           <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); approveDeposit(d.id); }}>
                             <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                           </Button>
                         )}
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCredits;
