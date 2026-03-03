import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "error";

const Verification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Memverifikasi token...");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token tidak ditemukan di URL.");
      return;
    }
    verifyToken(token);
  }, [token]);

  const verifyToken = async (rawToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-login-token", {
        body: { token: rawToken },
      });

      if (error || !data?.success) {
        setStatus("error");
        setMessage(data?.error || error?.message || "Token tidak valid atau sudah kadaluarsa.");
        return;
      }

      // Use the hashed_token to verify OTP and create session
      const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: data.hashed_token,
        type: "magiclink",
      });

      if (verifyErr || !verifyData?.session) {
        setStatus("error");
        setMessage("Gagal membuat session. " + (verifyErr?.message || ""));
        return;
      }

      setStatus("success");
      setMessage("Login berhasil! Mengalihkan ke dashboard...");

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Terjadi kesalahan saat verifikasi.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">{message}</h1>
            <p className="text-sm text-muted-foreground">Mohon tunggu sebentar...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">{message}</h1>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Verifikasi Gagal</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Login Manual
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Verification;
