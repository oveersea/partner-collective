import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CheckCircle2, Loader2, AlertCircle, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardNav from "@/components/dashboard/DashboardNav";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const paymentStatus = searchParams.get("payment");
  const paymentType = searchParams.get("type");

  // Legacy support: if old-style checkout params exist, redirect to credit-balance
  const legacyType = searchParams.get("type");
  const legacyId = searchParams.get("id");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // If accessed with old-style params (type=credit_order&id=...), redirect
  useEffect(() => {
    if (legacyId && legacyType && !paymentStatus) {
      navigate("/credit-balance");
    }
  }, [legacyId, legacyType, paymentStatus, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Payment success return
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-6 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-8">
              Your payment has been processed. Your balance will be updated shortly.
            </p>
            <Button onClick={() => navigate("/credit-balance")}>
              Back to Balance
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Payment failed return
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-6 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-lg mx-auto text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Payment Failed</h2>
            <p className="text-muted-foreground mb-6">
              Your payment was not completed. No charges were made and no order was created.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/credit-balance")}>
                Back to Balance
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Default: redirect to credit-balance
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-6 pt-24 pb-20">
        <div className="max-w-lg mx-auto pt-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">No Active Checkout</h1>
          <p className="text-muted-foreground mb-6">
            Payments are processed directly through Xendit. Go to Credits & Balance to make a purchase.
          </p>
          <Button onClick={() => navigate("/credit-balance")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go to Credits & Balance
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
