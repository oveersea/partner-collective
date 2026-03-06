import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, CreditCard, Calendar, CheckCircle2,
  Clock, Hash, Loader2, Trash2, GraduationCap, Ticket, ExternalLink,
  Receipt, Tag, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const statusColor = (s: string) => {
  switch (s) {
    case "paid": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "cancelled": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

const InfoRow = ({ icon: Icon, label, value, href }: { icon: any; label: string; value: string | null | undefined; href?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="text-muted-foreground text-xs">{label}</span>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block truncate">{value}</a>
        ) : (
          <p className="text-card-foreground">{value}</p>
        )}
      </div>
    </div>
  );
};

const AdminEnrollmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") as "program" | "event" || "program";
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrder();
      checkSuperadmin();
    }
  }, [user, id, type]);

  const checkSuperadmin = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .eq("role", "superadmin")
      .maybeSingle();
    setIsSuperadmin(!!data);
  };

  const fetchOrder = async () => {
    setLoading(true);
    if (type === "program") {
      const { data, error } = await supabase
        .from("program_orders")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) { toast.error("Order tidak ditemukan"); navigate("/admin"); return; }
      setOrder(data);
    } else {
      const { data, error } = await (supabase.from("event_orders") as any)
        .select("*, events(title, oveercode, start_date, end_date, location)")
        .eq("id", id!)
        .single();
      if (error) { toast.error("Order tidak ditemukan"); navigate("/admin"); return; }
      setOrder(data);
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    const table = type === "program" ? "program_orders" : "event_orders";
    const { error } = await (supabase.from(table) as any)
      .update({
        checked_in_at: new Date().toISOString(),
        check_in_method: "manual",
        checked_in_by: user?.id,
      })
      .eq("id", id!);

    if (error) {
      toast.error("Gagal check-in");
    } else {
      toast.success("✅ Check-in berhasil!");
      fetchOrder();
    }
    setCheckingIn(false);
  };

  const handleRedoCheckIn = async () => {
    setCheckingIn(true);
    const table = type === "program" ? "program_orders" : "event_orders";
    const { error } = await (supabase.from(table) as any)
      .update({
        checked_in_at: null,
        check_in_method: null,
        checked_in_by: null,
      })
      .eq("id", id!);

    if (error) {
      toast.error("Gagal reset check-in");
    } else {
      toast.success("Check-in berhasil di-reset");
      fetchOrder();
    }
    setCheckingIn(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const table = type === "program" ? "program_orders" : "event_orders";
    const { error } = await (supabase.from(table) as any).delete().eq("id", id!);
    if (error) {
      toast.error("Gagal menghapus order");
      setDeleting(false);
    } else {
      toast.success("Order berhasil dihapus");
      navigate("/admin");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const isProgram = type === "program";
  const title = isProgram ? order.program_title : order.events?.title || "—";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                {isProgram ? <GraduationCap className="w-4 h-4 text-primary" /> : <Ticket className="w-4 h-4 text-primary" />}
                <h1 className="text-lg font-semibold text-foreground">{isProgram ? "Program Order" : "Event Order"}</h1>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{order.order_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.status === "paid" && !order.checked_in_at && (
              <Button size="sm" className="gap-1.5" onClick={handleCheckIn} disabled={checkingIn}>
                {checkingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Check-in
              </Button>
            )}
            {order.checked_in_at && (isSuperadmin) && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleRedoCheckIn} disabled={checkingIn}>
                {checkingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Redo Check-in
              </Button>
            )}
            {isSuperadmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda yakin ingin menghapus order <strong>{order.order_number}</strong>? Data yang dihapus tidak dapat dikembalikan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-card-foreground">Detail Order</h2>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor(order.status)}`}>{order.status}</span>
                </div>
                <Separator />

                <div className="space-y-3">
                  <InfoRow icon={Hash} label="Order Number" value={order.order_number} />
                  <InfoRow icon={isProgram ? GraduationCap : Ticket} label={isProgram ? "Program" : "Event"} value={title} />
                  {isProgram && <InfoRow icon={Tag} label="Paket" value={order.package_label} />}
                  {isProgram && <InfoRow icon={Tag} label="Kategori" value={order.program_category} />}
                  {!isProgram && <InfoRow icon={Ticket} label="Jumlah Tiket" value={String(order.ticket_count)} />}
                  {!isProgram && order.events?.location && <InfoRow icon={Tag} label="Lokasi" value={order.events.location} />}
                  {!isProgram && order.events?.start_date && (
                    <InfoRow icon={Calendar} label="Tanggal Event" value={new Date(order.events.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-semibold text-card-foreground">Pembayaran</h2>
                <Separator />
                <div className="space-y-3">
                  {order.original_amount != null && order.original_amount !== order.amount && (
                    <InfoRow icon={CreditCard} label="Harga Asli" value={formatRupiah(order.original_amount)} />
                  )}
                  {order.discount_amount != null && order.discount_amount > 0 && (
                    <InfoRow icon={Tag} label="Diskon" value={`- ${formatRupiah(order.discount_amount)}`} />
                  )}
                  {order.voucher_discount_amount != null && order.voucher_discount_amount > 0 && (
                    <InfoRow icon={Tag} label="Voucher Discount" value={`- ${formatRupiah(order.voucher_discount_amount)}`} />
                  )}
                  <InfoRow icon={CreditCard} label="Total Bayar" value={order.amount === 0 ? "Free" : formatRupiah(order.amount)} />
                  <InfoRow icon={Receipt} label="Metode Bayar" value={order.xendit_payment_method} />
                  {order.xendit_paid_at && (
                    <InfoRow icon={Calendar} label="Tanggal Bayar" value={new Date(order.xendit_paid_at).toLocaleString("id-ID")} />
                  )}
                  {order.xendit_invoice_url && (
                    <InfoRow icon={ExternalLink} label="Invoice Xendit" value="Lihat Invoice" href={order.xendit_invoice_url} />
                  )}
                  {order.voucher_code && <InfoRow icon={Tag} label="Voucher Code" value={order.voucher_code} />}
                  {order.voucher_codes && order.voucher_codes.length > 0 && (
                    <InfoRow icon={Tag} label="Voucher Codes" value={order.voucher_codes.join(", ")} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Check-in Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-semibold text-card-foreground">Check-in</h2>
                <Separator />
                {order.checked_in_at ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Sudah Check-in</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.checked_in_at).toLocaleString("id-ID")}
                        {order.check_in_method && ` • via ${order.check_in_method}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                    <Clock className="w-8 h-8 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Belum Check-in</p>
                      <p className="text-xs text-muted-foreground">Peserta belum melakukan check-in.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participant Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-semibold text-card-foreground">Peserta</h2>
                <Separator />
                <div className="space-y-3">
                  <InfoRow icon={User} label="Nama" value={order.full_name} />
                  <InfoRow icon={Mail} label="Email" value={order.email} />
                  <InfoRow icon={Phone} label="Telepon" value={order.phone} />
                </div>
                {order.user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5 mt-2"
                    onClick={() => {
                      // Find oveercode for user
                      supabase.from("profiles").select("oveercode").eq("user_id", order.user_id).maybeSingle().then(({ data }) => {
                        if (data?.oveercode) navigate(`/admin/user/${data.oveercode}`);
                        else toast.error("Profil tidak ditemukan");
                      });
                    }}
                  >
                    <User className="w-3.5 h-3.5" /> Lihat Profil
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-semibold text-card-foreground">Waktu</h2>
                <Separator />
                <div className="space-y-3">
                  <InfoRow icon={Calendar} label="Dibuat" value={new Date(order.created_at).toLocaleString("id-ID")} />
                  <InfoRow icon={Calendar} label="Diperbarui" value={new Date(order.updated_at).toLocaleString("id-ID")} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="text-sm font-semibold text-card-foreground">Ringkasan</h2>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{order.amount === 0 ? "Free" : formatRupiah(order.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{order.checked_in_at ? "✓" : "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Check-in</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEnrollmentDetail;
