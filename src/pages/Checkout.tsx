import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentStatus = searchParams.get("payment");

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
            Pembayaran Anda telah diproses. Saldo akan diperbarui dalam beberapa saat.
          </p>
          <Button onClick={() => navigate("/credit-balance")}>
            Kembali ke Saldo
          </Button>
        </motion.div>
      </div>
    );
  }

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
          <Button variant="outline" onClick={() => navigate("/credit-balance")}>
            Kembali ke Saldo
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">Tidak Ada Checkout Aktif</h1>
        <p className="text-muted-foreground mb-6">
          Pembayaran diproses langsung melalui Xendit. Silakan ke halaman Credits & Balance.
        </p>
        <Button onClick={() => navigate("/credit-balance")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Ke Credits & Balance
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
