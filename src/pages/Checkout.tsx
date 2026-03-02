import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CreditCard, Wallet, ArrowLeft, Loader2, CheckCircle2,
  Clock, AlertCircle, ExternalLink, Package, Receipt, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardNav from "@/components/dashboard/DashboardNav";

type CheckoutType = "credit_order" | "wallet_deposit" | "program_order";

interface CheckoutItem {
  type: CheckoutType;
  record_id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  xendit_checkout_url: string | null;
  xendit_invoice_id: string | null;
  meta?: Record<string, any>;
}

const typeLabels: Record<CheckoutType, { label: string; icon: typeof CreditCard }> = {
  credit_order: { label: "Credit Purchase", icon: CreditCard },
  wallet_deposit: { label: "Wallet Deposit", icon: Wallet },
  program_order: { label: "Program Order", icon: Package },
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const checkoutType = searchParams.get("type") as CheckoutType | null;
  const recordId = searchParams.get("id");

  const [item, setItem] = useState<CheckoutItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"review" | "processing" | "redirect" | "success" | "error">("review");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && checkoutType && recordId) fetchItem();
  }, [user, checkoutType, recordId]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      if (checkoutType === "credit_order") {
        const { data } = await supabase
          .from("credit_orders")
          .select("id, order_number, credits, amount_cents, currency, status, xendit_checkout_url, xendit_invoice_id, description")
          .eq("id", recordId!)
          .eq("user_id", user!.id)
          .single();
        if (data) {
          setItem({
            type: "credit_order",
            record_id: data.id,
            title: `${data.credits} Credits`,
            description: data.description || `Order ${data.order_number}`,
            amount: data.amount_cents,
            currency: data.currency || "IDR",
            status: data.status,
            xendit_checkout_url: data.xendit_checkout_url,
            xendit_invoice_id: data.xendit_invoice_id,
            meta: { order_number: data.order_number, credits: data.credits },
          });
        }
      } else if (checkoutType === "wallet_deposit") {
        const { data } = await supabase
          .from("wallet_deposits")
          .select("id, deposit_number, amount, currency, status, xendit_checkout_url, xendit_invoice_id")
          .eq("id", recordId!)
          .eq("user_id", user!.id)
          .single();
        if (data) {
          setItem({
            type: "wallet_deposit",
            record_id: data.id,
            title: "Wallet Deposit",
            description: `Deposit ${data.deposit_number}`,
            amount: Number(data.amount),
            currency: data.currency || "IDR",
            status: data.status ?? "pending",
            xendit_checkout_url: data.xendit_checkout_url,
            xendit_invoice_id: data.xendit_invoice_id,
            meta: { deposit_number: data.deposit_number },
          });
        }
      } else if (checkoutType === "program_order") {
        const { data } = await supabase
          .from("program_orders")
          .select("id, order_number, amount, currency, status, xendit_invoice_url, xendit_invoice_id, program_title")
          .eq("id", recordId!)
          .eq("user_id", user!.id)
          .single();
        if (data) {
          setItem({
            type: "program_order",
            record_id: data.id,
            title: data.program_title || "Program Enrollment",
            description: `Order ${data.order_number}`,
            amount: Number(data.amount),
            currency: data.currency || "IDR",
            status: data.status,
            xendit_checkout_url: data.xendit_invoice_url,
            xendit_invoice_id: data.xendit_invoice_id,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const isPaid = item && ["paid", "confirmed", "completed", "settled"].includes(item.status);
  const hasInvoice = item?.xendit_checkout_url;

  const handlePay = async () => {
    if (!item) return;

    // If already has checkout URL, redirect
    if (hasInvoice) {
      window.open(item.xendit_checkout_url!, "_blank");
      return;
    }

    setProcessing(true);
    setStep("processing");

    try {
      const successUrl = `${window.location.origin}/checkout?type=${item.type}&id=${item.record_id}&status=success`;
      const failureUrl = `${window.location.origin}/checkout?type=${item.type}&id=${item.record_id}&status=failed`;

      const { data, error } = await supabase.functions.invoke("create-xendit-invoice", {
        body: {
          checkout_type: item.type,
          record_id: item.record_id,
          amount: item.amount,
          description: item.description,
          success_redirect_url: successUrl,
          failure_redirect_url: failureUrl,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStep("redirect");

      // Brief delay for UX then redirect
      setTimeout(() => {
        window.location.href = data.invoice_url;
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create payment: " + (err.message || "Unknown error"));
      setStep("error");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "IDR") return `Rp ${amount.toLocaleString("id-ID")}`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Check for return status
  const returnStatus = searchParams.get("status");
  useEffect(() => {
    if (returnStatus === "success" && item) {
      setStep("success");
      // Re-fetch to get updated status
      const timer = setTimeout(() => fetchItem(), 2000);
      return () => clearTimeout(timer);
    }
  }, [returnStatus, item?.record_id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!checkoutType || !recordId || !item) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="max-w-lg mx-auto pt-32 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Checkout Not Found</h1>
          <p className="text-muted-foreground mb-6">The checkout session is invalid or has expired.</p>
          <Button onClick={() => navigate("/credit-balance")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = typeLabels[item.type]?.icon || CreditCard;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-2xl mx-auto px-6 pt-24 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/credit-balance")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">{typeLabels[item.type]?.label}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Success State */}
          {(step === "success" || isPaid) && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-8">
                Your {typeLabels[item.type]?.label.toLowerCase()} has been processed successfully.
              </p>
              <div className="bg-card border border-border rounded-2xl p-6 text-left mb-8 max-w-sm mx-auto">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">{formatCurrency(item.amount, item.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                    </span>
                  </div>
                  {item.meta?.order_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order</span>
                      <span className="font-mono text-xs text-foreground">{item.meta.order_number}</span>
                    </div>
                  )}
                  {item.meta?.deposit_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit</span>
                      <span className="font-mono text-xs text-foreground">{item.meta.deposit_number}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={() => navigate("/credit-balance")}>
                Back to Balance
              </Button>
            </motion.div>
          )}

          {/* Processing / Redirect State */}
          {(step === "processing" || step === "redirect") && !isPaid && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {step === "redirect" ? "Redirecting to Payment..." : "Creating Payment..."}
              </h2>
              <p className="text-muted-foreground">
                {step === "redirect"
                  ? "You will be redirected to Xendit payment page shortly."
                  : "Setting up your secure payment session..."}
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {step === "error" && !isPaid && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Payment Failed</h2>
              <p className="text-muted-foreground mb-6">Something went wrong while creating your payment.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/credit-balance")}>
                  Cancel
                </Button>
                <Button onClick={() => { setStep("review"); handlePay(); }}>
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}

          {/* Review State */}
          {step === "review" && !isPaid && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Order Summary Card */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Item Details */}
                  <div className="space-y-3">
                    {item.meta?.credits && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Credits
                        </span>
                        <span className="font-semibold text-foreground">{item.meta.credits} credits</span>
                      </div>
                    )}
                    {item.meta?.order_number && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Receipt className="w-4 h-4" /> Order Number
                        </span>
                        <span className="font-mono text-xs text-foreground">{item.meta.order_number}</span>
                      </div>
                    )}
                    {item.meta?.deposit_number && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Receipt className="w-4 h-4" /> Deposit Number
                        </span>
                        <span className="font-mono text-xs text-foreground">{item.meta.deposit_number}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Status
                      </span>
                      <span className="text-amber-600 font-medium capitalize">{item.status}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">
                      {formatCurrency(item.amount, item.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods Info */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Payment Methods
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {["Virtual Account", "E-Wallet (OVO, DANA, GoPay)", "Credit/Debit Card", "QRIS"].map(
                    (method) => (
                      <div key={method} className="flex items-center gap-2 py-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{method}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Secure Payment by Xendit</p>
                  <p className="text-muted-foreground text-xs">
                    Your payment is processed securely through Xendit payment gateway. We don't store your payment details.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/credit-balance")}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handlePay}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : hasInvoice ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {hasInvoice ? "Continue to Payment" : "Pay Now"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Checkout;
