import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertCircle, ArrowLeft, GraduationCap, Clock,
  CreditCard, Shield, Loader2, Tag, X, Plus, Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import DashboardNav from "@/components/dashboard/DashboardNav";

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

interface AppliedVoucher {
  id: string;
  code: string;
  discount_type: string; // "percentage" | "fixed"
  discount_value: number;
  max_discount: number | null;
  description: string | null;
}

function calcTotalDiscount(vouchers: AppliedVoucher[], subtotal: number): number {
  // Additive stacking: sum all percentage discounts, then apply; sum all fixed discounts separately
  let totalPctPoints = 0;
  let totalFixed = 0;

  for (const v of vouchers) {
    if (v.discount_type === "percentage") {
      totalPctPoints += v.discount_value;
    } else {
      totalFixed += v.discount_value;
    }
  }

  // Calculate percentage discount on subtotal
  let pctDiscount = Math.round(subtotal * totalPctPoints / 100);

  // Apply individual max_discount caps for percentage vouchers
  // We need to cap per-voucher, so recalculate
  let cappedPctDiscount = 0;
  for (const v of vouchers) {
    if (v.discount_type === "percentage") {
      let d = Math.round(subtotal * v.discount_value / 100);
      if (v.max_discount && d > v.max_discount) d = v.max_discount;
      cappedPctDiscount += d;
    }
  }

  const totalDiscount = cappedPctDiscount + totalFixed;
  return Math.min(totalDiscount, subtotal); // Never exceed subtotal
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVouchers, setAppliedVouchers] = useState<AppliedVoucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);

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

  // Extract universal checkout params
  const title = searchParams.get("title") || "Item";
  const amount = Number(searchParams.get("amount") || 0);
  const currency = searchParams.get("currency") || "IDR";
  const oveercode = searchParams.get("oveercode");
  const duration = searchParams.get("duration");
  const thumbnail = searchParams.get("thumbnail");
  const programId = searchParams.get("program_id");

  const totalDiscount = calcTotalDiscount(appliedVouchers, amount);
  const finalAmount = amount - totalDiscount;

  // Voucher apply handler
  const applyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;

    if (appliedVouchers.some((v) => v.code === code)) {
      toast({ title: "Voucher sudah digunakan", description: "Kode voucher ini sudah diterapkan.", variant: "destructive" });
      return;
    }

    setVoucherLoading(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("id, code, discount_type, discount_value, max_discount, description, is_active, usage_limit, used_count, min_amount, valid_from, valid_until")
        .eq("code", code)
        .single();

      if (error || !data) {
        toast({ title: "Voucher tidak ditemukan", description: "Kode voucher tidak valid.", variant: "destructive" });
        return;
      }

      // Validate
      if (!data.is_active) {
        toast({ title: "Voucher tidak aktif", variant: "destructive" });
        return;
      }
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast({ title: "Voucher sudah habis", description: "Kuota voucher telah terpakai.", variant: "destructive" });
        return;
      }
      if (amount < (data.min_amount || 0)) {
        toast({ title: "Minimum belanja tidak tercapai", description: `Minimum belanja ${formatRupiah(data.min_amount)}.`, variant: "destructive" });
        return;
      }
      const now = new Date();
      if (new Date(data.valid_from) > now) {
        toast({ title: "Voucher belum berlaku", variant: "destructive" });
        return;
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        toast({ title: "Voucher sudah kadaluarsa", variant: "destructive" });
        return;
      }

      setAppliedVouchers((prev) => [
        ...prev,
        {
          id: data.id,
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          max_discount: data.max_discount,
          description: data.description,
        },
      ]);
      setVoucherInput("");
      toast({ title: "Voucher diterapkan!", description: data.description || `Diskon ${data.discount_type === "percentage" ? data.discount_value + "%" : formatRupiah(data.discount_value)}.` });
    } catch {
      toast({ title: "Error", description: "Gagal memvalidasi voucher.", variant: "destructive" });
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = (code: string) => {
    setAppliedVouchers((prev) => prev.filter((v) => v.code !== code));
  };

  // Payment handler
  const handlePayment = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (finalAmount <= 0 && amount > 0) {
      // Free after discount — we could handle this differently
      toast({ title: "Gratis!", description: "Total pembayaran Rp 0 setelah diskon." });
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-xendit-invoice", {
        body: {
          checkout_type: checkoutType || "program_order",
          amount: Math.max(finalAmount, 0),
          original_amount: amount,
          currency,
          description: `Pembayaran: ${title}`,
          program_id: programId,
          program_title: title,
          program_slug: searchParams.get("slug") || "",
          program_category: searchParams.get("category") || "online",
          package_type: searchParams.get("package_type") || "trainingOnly",
          package_label: searchParams.get("package_label") || "Training Only",
          package_id: searchParams.get("package_id"),
          credits: searchParams.get("credits"),
          voucher_codes: appliedVouchers.map((v) => v.code),
          discount_amount: totalDiscount,
          success_redirect_url: `${window.location.origin}/checkout?payment=success&type=${checkoutType || "program_order"}`,
          failure_redirect_url: `${window.location.origin}/checkout?payment=failed`,
        },
      });

      const result = data || {};
      if (error || result?.error) {
        toast({ title: "Gagal", description: result?.error || "Tidak dapat membuat invoice.", variant: "destructive" });
        return;
      }
      // Handle free order (100% discount)
      if (result.free_order) {
        navigate(`/checkout?payment=success&type=${checkoutType || "program_order"}`);
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

  // === NO CHECKOUT TYPE ===
  if (!checkoutType || amount <= 0) {
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
  }

  // === UNIVERSAL CHECKOUT VIEW ===
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Konfirmasi Pembayaran</h1>
          <p className="text-muted-foreground mb-8">Periksa detail pesanan sebelum melanjutkan pembayaran.</p>

          <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6">
            {/* Main column */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-5">
                  {/* Item info */}
                  <div className="flex gap-4">
                    {thumbnail ? (
                      <img src={thumbnail} alt={title} className="w-24 h-24 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground text-lg leading-tight">{title}</h2>
                      {oveercode && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">Kode: {oveercode}</p>
                      )}
                      {duration && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                          <Clock className="w-3.5 h-3.5" /> {duration}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Voucher Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" /> Kode Voucher
                    </h3>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Masukkan kode voucher"
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && applyVoucher()}
                        className="flex-1 uppercase font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={applyVoucher}
                        disabled={voucherLoading || !voucherInput.trim()}
                        className="gap-1.5"
                      >
                        {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Terapkan
                      </Button>
                    </div>

                    {/* Applied vouchers list */}
                    {appliedVouchers.length > 0 && (
                      <div className="space-y-2">
                        {appliedVouchers.map((v) => {
                          let discountLabel = "";
                          if (v.discount_type === "percentage") {
                            let d = Math.round(amount * v.discount_value / 100);
                            if (v.max_discount && d > v.max_discount) d = v.max_discount;
                            discountLabel = `${v.discount_value}% (-${formatRupiah(d)})`;
                          } else {
                            discountLabel = `-${formatRupiah(v.discount_value)}`;
                          }

                          return (
                            <div
                              key={v.code}
                              className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Percent className="w-4 h-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-sm font-mono font-medium text-foreground">{v.code}</span>
                                  {v.description && (
                                    <p className="text-xs text-muted-foreground truncate">{v.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary" className="text-xs">{discountLabel}</Badge>
                                <button
                                  onClick={() => removeVoucher(v.code)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-xs text-muted-foreground">
                          💡 Diskon persentase dijumlahkan secara aditif (contoh: 5% + 10% = 15% dari harga asli).
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Price breakdown */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground text-sm">Rincian Biaya</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Harga</span>
                      <span className="text-foreground font-medium">{formatRupiah(amount)}</span>
                    </div>

                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Diskon Voucher</span>
                        <span className="text-primary font-medium">-{formatRupiah(totalDiscount)}</span>
                      </div>
                    )}

                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-foreground">Total Pembayaran</span>
                      <span className="text-primary">{formatRupiah(Math.max(finalAmount, 0))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar column */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-foreground text-sm">Metode Pembayaran</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
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
                        <CreditCard className="w-4 h-4 mr-2" /> Bayar {formatRupiah(Math.max(finalAmount, 0))}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
