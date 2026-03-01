import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Mail, Lock, User } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Check KYC status to redirect appropriately
        const { data: profile } = await supabase
          .from("profiles")
          .select("kyc_status")
          .eq("user_id", authData.user.id)
          .single();

        toast.success("Login berhasil!");
        
        if (profile?.kyc_status === "verified") {
          navigate("/dashboard");
        } else {
          navigate("/kyc");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, account_type: accountType },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Registrasi berhasil! Silakan cek email untuk verifikasi.");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm mb-6 hover:text-emerald transition-colors" style={{ color: "hsl(220 20% 65%)" }}>
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>

        <div className="bg-card rounded-2xl p-8 shadow-card-hover border border-border">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-display text-lg font-bold text-card-foreground">PartnerHub</span>
          </div>

          <h1 className="text-2xl font-bold text-card-foreground mb-1">
            {isLogin ? "Masuk ke Akun" : "Buat Akun Baru"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isLogin ? "Masuk untuk mengakses dashboard Anda" : "Daftar untuk mulai menggunakan platform"}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName" className="text-card-foreground">Nama Lengkap</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Nama lengkap Anda"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-card-foreground">Tipe Akun</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setAccountType("personal")}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        accountType === "personal"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <User className="w-5 h-5 mx-auto mb-1" />
                      Partner
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType("business")}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        accountType === "business"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Shield className="w-5 h-5 mx-auto mb-1" />
                      Client
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-card-foreground">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-card-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
