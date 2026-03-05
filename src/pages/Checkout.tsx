import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ArrowLeft, GraduationCap, Clock, CreditCard, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import DashboardNav from "@/components/dashboard/DashboardNav";

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const paymentStatus = searchParams.get("payment");
  const checkoutType = searchParams.get("type");

  // === SUCCESS STATE ===
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Pembayaran Berhasil!</h2>
          <p className="text-muted-foreground mb-8">
            {checkoutType === "program" || checkoutType === "program_order"
              ? "Pendaftaran program Anda telah diproses. Anda akan mendapat akses setelah verifikasi selesai."
              : "Pembayaran Anda telah diproses. Saldo akan diperbarui dalam beberapa saat."}
          </p>
          <div className="flex gap-3 justify-center">
            {(checkoutType === "program" || checkoutType === "program_order") && (
              <Button onClick={() => navigate("/learning")}>Ke Halaman Learning</Button>
            )}
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Ke Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // === FAILED STATE ===
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-lg mx-auto text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Pembayaran Gagal</h2>
          <p className="text-muted-foreground mb-6">
            Pembayaran Anda tidak berhasil. Tidak ada tagihan atau pesanan yang dibuat.
          </p>
          <Button variant="outline" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
        </motion.div>
      </div>
    );
  }

  // === PROGRAM ORDER CHECKOUT ===
  if (checkoutType === "program_order") {
    const programId = searchParams.get("program_id");
    const title = searchParams.get("title") || "Program";
    const amount = Number(searchParams.get("amount") || 0);
    const currency = searchParams.get("currency") || "IDR";
    const oveercode = searchParams.get("oveercode");
    const duration = searchParams.get("duration");
    const thumbnail = searchParams.get("thumbnail");

    const handlePayment = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setSubmitting(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-xendit-invoice", {
          body: {
            checkout_type: "program_order",
            amount,
            currency,
            description: `Pendaftaran program: ${title}`,
            program_id: programId,
            program_title: title,
            success_redirect_url: `${window.location.origin}/checkout?payment=success&type=program_order`,
            failure_redirect_url: `${window.location.origin}/checkout?payment=failed`,
          },
        });

        const result = data || {};
        if (error || result?.error) {
          toast({ title: "Gagal", description: result?.error || "Tidak dapat membuat invoice.", variant: "destructive" });
          return;
        }
        if (result.invoice_url) {
          window.location.href = result.invoice_url;
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Terjadi kesalahan.", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="max-w-2xl mx-auto px-4 py-10">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground mb-1">Konfirmasi Pendaftaran</h1>
            <p className="text-muted-foreground mb-8">Periksa detail program sebelum melanjutkan pembayaran.</p>

            <Card>
              <CardContent className="p-6 space-y-5">
                {/* Program info */}
                <div className="flex gap-4">
                  {thumbnail ? (
                    <img src={thumbnail} alt={title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground text-lg leading-tight">{title}</h2>
                    {oveercode && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">Kode: {oveercode}</p>
                    )}
                    {duration && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> {duration}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Price breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Program</span>
                    <span className="text-foreground font-medium">{formatRupiah(amount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-foreground">Total Pembayaran</span>
                    <span className="text-primary">{formatRupiah(amount)}</span>
                  </div>
                </div>

                <Separator />

                {/* Payment info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Anda akan diarahkan ke halaman pembayaran Xendit untuk menyelesaikan transaksi.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Pembayaran diproses secara aman. Data Anda terlindungi.</span>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handlePayment} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" /> Bayar {formatRupiah(amount)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // === DEFAULT / NO ACTIVE CHECKOUT ===
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">Tidak Ada Checkout Aktif</h1>
        <p className="text-muted-foreground mb-6">
          Silakan pilih program atau layanan yang ingin Anda beli.
        </p>
        <Button onClick={() => navigate("/learning")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Ke Halaman Learning
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
