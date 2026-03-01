import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, Wallet, ChevronLeft, ChevronRight, Check, Coins, ArrowUpRight, ArrowDownRight, Clock,
} from "lucide-react";

interface CreditBalance {
  balance: number;
  total_purchased: number;
  total_used: number;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  description: string | null;
}

interface CreditOrder {
  id: string;
  order_number: string;
  credits: number;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

interface WalletBalance {
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface WalletDeposit {
  id: string;
  deposit_number: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 10;

const CreditBalancePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"credits" | "wallet">("credits");

  // Credit state
  const [creditBal, setCreditBal] = useState<CreditBalance | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [creditOrders, setCreditOrders] = useState<CreditOrder[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Wallet state
  const [walletBal, setWalletBal] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [credRes, pkgRes, ordRes, walRes, txRes, depRes] = await Promise.all([
      supabase.from("credit_balances").select("balance, total_purchased, total_used").eq("user_id", user!.id).maybeSingle(),
      supabase.from("credit_packages").select("id, name, credits, price_cents, currency, description").eq("is_active", true).order("sort_order"),
      supabase.from("credit_orders").select("id, order_number, credits, amount_cents, currency, status, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("wallet_balances").select("balance, total_deposited, total_withdrawn").eq("user_id", user!.id).is("business_id", null).maybeSingle(),
      supabase.from("wallet_transactions").select("id, type, amount, balance_after, description, created_at").eq("user_id", user!.id).is("business_id", null).order("created_at", { ascending: false }).limit(50),
      supabase.from("wallet_deposits").select("id, deposit_number, amount, currency, method, status, created_at").eq("user_id", user!.id).is("business_id", null).order("created_at", { ascending: false }),
    ]);

    if (credRes.data) setCreditBal(credRes.data as CreditBalance);
    if (pkgRes.data) setPackages(pkgRes.data as unknown as CreditPackage[]);
    if (ordRes.data) setCreditOrders(ordRes.data as unknown as CreditOrder[]);
    if (walRes.data) setWalletBal(walRes.data as WalletBalance);
    if (txRes.data) setTransactions(txRes.data as unknown as WalletTransaction[]);
    if (depRes.data) setDeposits(depRes.data as unknown as WalletDeposit[]);
    setLoading(false);
  };

  const purchaseCredit = async (pkg: CreditPackage) => {
    setSubmitting(true);
    const { error } = await supabase.from("credit_orders").insert({
      user_id: user!.id,
      package_id: pkg.id,
      credits: pkg.credits,
      amount_cents: pkg.price_cents,
      currency: pkg.currency,
      status: "pending",
      description: `Purchase package ${pkg.name}`,
    } as any);

    if (error) {
      toast.error("Failed to create order: " + error.message);
    } else {
      toast.success("Credit order created! Awaiting payment confirmation.");
      fetchAll();
    }
    setSubmitting(false);
  };

  const submitDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount < 10000) {
      toast.error("Minimum deposit Rp 10,000");
      return;
    }
    setDepositSubmitting(true);
    const { error } = await supabase.from("wallet_deposits").insert({
      user_id: user!.id,
      amount,
      currency: "IDR",
      method: "manual_transfer",
      status: "pending",
    } as any);

    if (error) {
      toast.error("Failed to create deposit: " + error.message);
    } else {
      toast.success("Deposit created! Awaiting admin confirmation.");
      setDepositAmount("");
      fetchAll();
    }
    setDepositSubmitting(false);
  };

  const statusBadge = (s: string) => {
    if (s === "paid" || s === "confirmed" || s === "completed") return "bg-primary/10 text-primary";
    if (s === "pending") return "bg-amber-500/10 text-amber-600";
    if (s === "rejected" || s === "cancelled" || s === "failed") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

  const pagedOrders = creditOrders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);
  const orderTotalPages = Math.max(1, Math.ceil(creditOrders.length / PAGE_SIZE));
  const pagedTx = transactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);
  const txTotalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Credits & Balance</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          <button
            onClick={() => setTab("credits")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "credits" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Credits
          </button>
          <button
            onClick={() => setTab("wallet")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "wallet" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="w-4 h-4" /> Wallet
          </button>
        </div>

        {/* ========== CREDITS TAB ========== */}
        {tab === "credits" && (
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6">
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Credit Balance</p>
                    <p className="text-3xl font-semibold text-foreground">{creditBal?.balance ?? 0}</p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total purchased: </span>
                    <span className="font-medium text-foreground">{creditBal?.total_purchased ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total used: </span>
                    <span className="font-medium text-foreground">{creditBal?.total_used ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">Order History</h3>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Credits</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedOrders.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No orders yet</td></tr>
                        ) : (
                          pagedOrders.map((o) => (
                            <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                              <td className="px-4 py-3 font-medium">{o.credits}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{formatCurrency(o.amount_cents)}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(o.status)}`}>{o.status}</span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("en-US")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {creditOrders.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">{orderPage} / {orderTotalPages}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" disabled={orderPage >= orderTotalPages} onClick={() => setOrderPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="bg-card rounded-2xl border border-border p-6 lg:sticky lg:top-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Buy Credits</h3>
                <div className="grid grid-cols-1 gap-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="rounded-xl border border-border p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors">
                      <div>
                        <p className="font-semibold text-foreground">{pkg.name}</p>
                        {pkg.description && <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-semibold text-foreground">{pkg.credits}</span>
                        <span className="text-sm text-muted-foreground">credits</span>
                        <span className="text-sm text-muted-foreground ml-auto">{formatCurrency(pkg.price_cents)}</span>
                      </div>
                      <Button size="sm" className="w-full mt-1" disabled={submitting} onClick={() => purchaseCredit(pkg)}>
                        Buy Now
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== WALLET TAB ========== */}
        {tab === "wallet" && (
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-6">
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="text-3xl font-semibold text-foreground">{formatCurrency(Number(walletBal?.balance ?? 0))}</p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">In: </span>
                    <span className="font-medium text-foreground">{formatCurrency(Number(walletBal?.total_deposited ?? 0))}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-muted-foreground">Out: </span>
                    <span className="font-medium text-foreground">{formatCurrency(Number(walletBal?.total_withdrawn ?? 0))}</span>
                  </div>
                </div>
              </div>

              {/* Deposit History */}
              {deposits.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3">Deposit History</h3>
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deposit #</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deposits.map((d) => (
                            <tr key={d.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs">{d.deposit_number}</td>
                              <td className="px-4 py-3 font-medium">{formatCurrency(Number(d.amount))}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{d.method}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(d.status)}`}>{d.status}</span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString("en-US")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">Transaction History</h3>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Balance After</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTx.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No transactions yet</td></tr>
                        ) : (
                          pagedTx.map((tx) => (
                            <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <Badge variant="secondary" className="text-xs capitalize">{tx.type}</Badge>
                              </td>
                              <td className={`px-4 py-3 font-medium text-xs ${Number(tx.amount) >= 0 ? "text-primary" : "text-destructive"}`}>
                                {Number(tx.amount) >= 0 ? "+" : ""}{formatCurrency(Number(tx.amount))}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{formatCurrency(Number(tx.balance_after))}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{tx.description || "—"}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(tx.created_at).toLocaleDateString("en-US")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {transactions.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">{txPage} / {txTotalPages}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" disabled={txPage >= txTotalPages} onClick={() => setTxPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 lg:sticky lg:top-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Deposit Funds</h3>
                <p className="text-sm text-muted-foreground mb-4">Enter the amount to deposit. Minimum Rp 10,000.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Amount (IDR)</label>
                    <Input
                      type="number"
                      min={10000}
                      step={1000}
                      placeholder="100000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" disabled={depositSubmitting || !depositAmount} onClick={submitDeposit}>
                    {depositSubmitting ? "Processing..." : "Deposit"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[50000, 100000, 250000, 500000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(String(amt))}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditBalancePage;
