import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, CheckCircle2, Eye, EyeOff, Check, X } from "lucide-react";
import logoDark from "@/assets/logo-dark.png";
import authHero from "@/assets/auth-hero.jpg";
import ReCAPTCHA from "react-google-recaptcha";

const passwordRules = [
  { label: "Minimum 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One special character (!@#$%...)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const getStrength = (password: string) => {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: "Weak", color: "bg-destructive", pct: 20 };
  if (passed <= 2) return { level: "Weak", color: "bg-destructive", pct: 40 };
  if (passed <= 3) return { level: "Fair", color: "hsl(40 90% 50%)", pct: 60 };
  if (passed <= 4) return { level: "Good", color: "bg-primary/70", pct: 80 };
  return { level: "Strong", color: "bg-primary", pct: 100 };
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const accountType = "personal";

  useEffect(() => {
    const fetchRecaptchaSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["recaptcha_enabled", "recaptcha_site_key"]);
      if (data) {
        const enabled = data.find((d) => d.key === "recaptcha_enabled")?.value === "true";
        const siteKey = data.find((d) => d.key === "recaptcha_site_key")?.value || "";
        setRecaptchaEnabled(enabled && !!siteKey);
        setRecaptchaSiteKey(siteKey);
      }
    };
    fetchRecaptchaSettings();
  }, []);

  const strength = getStrength(password);
  const allRulesPassed = passwordRules.every((r) => r.test(password));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && !allRulesPassed) {
      toast.error("Password does not meet all requirements");
      return;
    }

    if (recaptchaEnabled && !captchaToken) {
      toast.error("Please complete the reCAPTCHA verification");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile } = await supabase
          .from("profiles")
          .select("kyc_status")
          .eq("user_id", authData.user.id)
          .single();

        toast.success("Login successful!");

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
        toast.success("Registration successful! Please check your email for verification.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      // Reset captcha on error
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    "Access verified talent across 50+ categories",
    "AI-powered matching for your projects",
    "Trusted by businesses worldwide",
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left - Hero Image Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img src={authHero} alt="Professional workspace" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/50 to-secondary/30" />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-primary-foreground leading-tight">Success starts here</h1>
              <p className="text-primary-foreground/60 mt-2 text-lg">Join the leading talent marketplace</p>
            </div>
            <div className="space-y-4">
              {highlights.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-primary-foreground/80 text-base">{text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-primary-foreground/40 text-xs">© {new Date().getFullYear()} Oveersea. All rights reserved.</p>
        </div>
      </div>

      {/* Right - Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
          {/* Mobile back */}
          <div className="lg:hidden mb-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          <div className="mb-8">
            <img src={logoDark} alt="Oveersea" className="h-7 mb-8" />
            <h2 className="text-2xl font-semibold text-foreground">
              {isLogin ? "Welcome back" : "Create a new account"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              {isLogin ? "Enter your credentials to continue" : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => setIsLogin(true)} className="text-primary hover:underline font-medium">Sign in</button>
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-foreground text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="fullName" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="pl-10 h-11 bg-background border-border" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 h-11 bg-background border-border" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 bg-background border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength - only show on register */}
              {!isLogin && password.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-2">
                  {/* Strength bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Password strength</span>
                      <span className={`text-xs font-medium ${
                        strength.level === "Strong" ? "text-primary" :
                        strength.level === "Good" ? "text-primary/70" :
                        strength.level === "Fair" ? "text-yellow-600" :
                        "text-destructive"
                      }`}>
                        {strength.level}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${strength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${strength.pct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Rules checklist */}
                  <div className="grid grid-cols-1 gap-1">
                    {passwordRules.map((rule, i) => {
                      const passed = rule.test(password);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          {passed ? (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          )}
                          <span className={`text-xs ${passed ? "text-foreground" : "text-muted-foreground"}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* reCAPTCHA */}
            {recaptchaEnabled && recaptchaSiteKey && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={recaptchaSiteKey}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading || (!isLogin && !allRulesPassed) || (recaptchaEnabled && !captchaToken)}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Join Oveersea"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Toggle */}
          <div className="text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isLogin ? (
                <>Don't have an account? <span className="text-primary font-medium hover:underline">Join now</span></>
              ) : (
                <>Already a member? <span className="text-primary font-medium hover:underline">Sign in</span></>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            By joining, you agree to the Oveersea{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
