import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight,
  Send, Loader2, CheckCircle2, User, Mail, Phone, MapPin,
  Calendar, MessageSquare, ShieldCheck, Sparkles, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { getCart, removeFromCart, updateQuantity, clearCart, type CartItem } from "@/lib/cart";
import { z } from "zod";

const orderSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 digit").max(20),
  location: z.string().max(200).optional(),
  schedule: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

const Order = () => {
  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [mode, setMode] = useState<"cart" | "discuss" | "direct">("cart");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    schedule: "",
    notes: "",
  });

  useEffect(() => {
    const handler = () => setCart(getCart());
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async () => {
    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const cartSummary = cart.map((c) => `${c.serviceName} (${c.categoryName}) x${c.quantity}`).join(", ");
      const description = `${mode === "discuss" ? "[DISKUSI] " : "[ORDER] "}${cartSummary}${form.notes ? "\n\nCatatan: " + form.notes : ""}${form.location ? "\nLokasi: " + form.location : ""}${form.schedule ? "\nJadwal: " + form.schedule : ""}`;

      const { data, error } = await supabase.functions.invoke("request-quote", {
        body: {
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          title: cart.map((c) => c.serviceName).join(", ").slice(0, 200) || "Order Layanan",
          description,
          category: cart[0]?.categoryName || "General",
          skills_required: cart.map((c) => c.serviceName),
          demand_type: "partner",
          is_remote: false,
          location: parsed.data.location || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResultMsg(data.message);
      setIsNewUser(data.is_new_user);
      setSubmitted(true);
      clearCart();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim pesanan");
    } finally {
      setSubmitting(false);
    }
  };

  // Empty cart → redirect
  if (cart.length === 0 && !submitted) {
    return <Navigate to="/services" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 sm:px-6">
          <Link to="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Layanan
          </Link>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-3">
                  {mode === "discuss" ? "Permintaan Diskusi Terkirim!" : "Pesanan Terkirim!"}
                </h1>
                <p className="text-muted-foreground mb-6">{resultMsg}</p>
                {isNewUser && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-left mb-6">
                    <p className="font-medium text-foreground mb-1">🎉 Akun Dibuat</p>
                    <p className="text-muted-foreground">
                      Kami telah membuat akun untuk <span className="font-medium text-foreground">{form.email}</span>.
                      Cek email Anda untuk link reset password.
                    </p>
                  </div>
                )}
                <div className="flex gap-3 justify-center">
                  <Link to="/"><Button variant="outline">Beranda</Button></Link>
                  <Link to="/auth"><Button>Login ke Dashboard</Button></Link>
                </div>
              </motion.div>
            ) : mode === "cart" ? (
              <motion.div key="cart" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                  <ShoppingCart className="inline w-7 h-7 mr-2 -mt-1" />
                  Keranjang Layanan
                </h1>
                <p className="text-sm text-muted-foreground mb-8">Review layanan yang Anda pilih sebelum melanjutkan.</p>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Cart items */}
                  <div className="lg:col-span-2 space-y-3">
                    {cart.map((item, i) => (
                      <div key={`${item.categorySlug}-${item.serviceName}-${i}`} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{item.serviceName}</p>
                          <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.tags.map((tag) => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(i, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center text-foreground">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(i, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeFromCart(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <Link to="/services" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2">
                      <Plus className="w-4 h-4" /> Tambah layanan lain
                    </Link>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl border border-border bg-card">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Ringkasan</h3>
                      <div className="space-y-2 text-sm">
                        {cart.map((item, i) => (
                          <div key={i} className="flex justify-between text-muted-foreground">
                            <span className="truncate mr-2">{item.serviceName}</span>
                            <span className="shrink-0">x{item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-2 mt-2 flex justify-between font-medium text-foreground">
                          <span>Total Item</span>
                          <span>{cart.reduce((s, c) => s + c.quantity, 0)}</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full gap-2" size="lg" onClick={() => setMode("direct")}>
                      <Zap className="w-4 h-4" /> Pesan Langsung
                    </Button>
                    <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => setMode("discuss")}>
                      <MessageSquare className="w-4 h-4" /> Diskusi Dulu
                    </Button>

                    <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Tanpa login. Data Anda aman dan terenkripsi.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Form: discuss or direct */
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground" onClick={() => setMode("cart")}>
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Keranjang
                </Button>

                <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  <div className="lg:col-span-2">
                    <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        {mode === "discuss" ? (
                          <MessageSquare className="w-6 h-6 text-primary" />
                        ) : (
                          <Zap className="w-6 h-6 text-primary" />
                        )}
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">
                            {mode === "discuss" ? "Diskusi Dulu" : "Pesan Langsung"}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {mode === "discuss"
                              ? "Tim kami akan menghubungi Anda untuk mendiskusikan kebutuhan."
                              : "Isi data Anda dan pesanan akan langsung diproses."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-card-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Nama Lengkap *</Label>
                          <Input className="mt-1.5" placeholder="John Doe" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
                          {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-card-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Email *</Label>
                            <Input className="mt-1.5" type="email" placeholder="john@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                          </div>
                          <div>
                            <Label className="text-card-foreground flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> No. Telepon *</Label>
                            <PhoneInput className="mt-1.5" value={form.phone} onChange={(v) => set("phone", v)} />
                            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-card-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Lokasi</Label>
                            <Input className="mt-1.5" placeholder="Jakarta, Surabaya, dll." value={form.location} onChange={(e) => set("location", e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-card-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Jadwal Preferensi</Label>
                            <Input className="mt-1.5" type="date" value={form.schedule} onChange={(e) => set("schedule", e.target.value)} />
                          </div>
                        </div>

                        <div>
                          <Label className="text-card-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Catatan Tambahan</Label>
                          <Textarea className="mt-1.5" rows={3} placeholder="Detail kebutuhan, pertanyaan, atau catatan khusus..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                        </div>

                        <Button className="w-full gap-2" size="lg" onClick={handleSubmit} disabled={submitting}>
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {submitting ? "Mengirim..." : mode === "discuss" ? "Kirim Permintaan Diskusi" : "Kirim Pesanan"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar summary */}
                  <div>
                    <div className="p-5 rounded-xl border border-border bg-card sticky top-24">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Layanan Dipilih
                      </h3>
                      <div className="space-y-2 text-sm">
                        {cart.map((item, i) => (
                          <div key={i} className="flex justify-between text-muted-foreground">
                            <span className="truncate mr-2">{item.serviceName}</span>
                            <span className="shrink-0">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Order;
