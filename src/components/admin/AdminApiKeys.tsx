import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Key, Copy, Trash2, RefreshCw, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

const AdminApiKeys = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, is_active, scopes, expires_at, last_used_at, created_at")
      .order("created_at", { ascending: false });
    setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "ovr_";
    for (let i = 0; i < 48; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const hashKey = async (key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error("Nama API key wajib diisi"); return; }
    setCreating(true);

    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    let expiresAt: string | null = null;
    if (newKeyExpiry === "30d") expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    else if (newKeyExpiry === "90d") expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    else if (newKeyExpiry === "1y") expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();

    const { error } = await supabase.from("api_keys").insert({
      name: newKeyName.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: ["auth"],
      expires_at: expiresAt,
      created_by: user!.id,
    });

    if (error) {
      toast.error("Gagal membuat API key: " + error.message);
    } else {
      setGeneratedKey(rawKey);
      toast.success("API key berhasil dibuat");
      fetchKeys();
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
    if (error) toast.error("Gagal menonaktifkan key");
    else { toast.success("API key dinonaktifkan"); fetchKeys(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus key");
    else { toast.success("API key dihapus"); fetchKeys(); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard");
  };

  const closeCreateDialog = () => {
    setCreateOpen(false);
    setNewKeyName("");
    setNewKeyExpiry("never");
    setGeneratedKey(null);
    setShowKey(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
          <p className="text-muted-foreground text-sm">Kelola API key untuk integrasi mobile app</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(v) => { if (!v) closeCreateDialog(); else setCreateOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Buat API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{generatedKey ? "API Key Berhasil Dibuat" : "Buat API Key Baru"}</DialogTitle>
              <DialogDescription>
                {generatedKey
                  ? "Simpan key ini sekarang. Key tidak akan ditampilkan lagi."
                  : "API key digunakan untuk mengintegrasikan mobile app dengan platform."}
              </DialogDescription>
            </DialogHeader>

            {!generatedKey ? (
              <div className="space-y-4">
                <div>
                  <Label>Nama Key</Label>
                  <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Mobile App Production" />
                </div>
                <div>
                  <Label>Masa Berlaku</Label>
                  <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Tidak Pernah Expired</SelectItem>
                      <SelectItem value="30d">30 Hari</SelectItem>
                      <SelectItem value="90d">90 Hari</SelectItem>
                      <SelectItem value="1y">1 Tahun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    Generate Key
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">Simpan key ini sekarang! Setelah dialog ditutup, key tidak bisa dilihat lagi.</p>
                </div>
                <div className="relative">
                  <Input
                    readOnly
                    value={showKey ? generatedKey : generatedKey.substring(0, 12) + "•".repeat(40)}
                    className="font-mono text-xs pr-20"
                  />
                  <div className="absolute right-1 top-1 flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(generatedKey)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeCreateDialog}>Tutup</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Panduan Penggunaan</CardTitle>
          <CardDescription>Cara menggunakan API key untuk login mobile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted p-4 font-mono text-xs space-y-2 overflow-x-auto">
            <p className="text-muted-foreground">// 1. Generate login token dari mobile app</p>
            <p>{`POST /functions/v1/generate-login-token`}</p>
            <p>{`{ "api_key": "ovr_xxx...", "email": "user@email.com" }`}</p>
            <br />
            <p className="text-muted-foreground">// 2. Response berisi verification URL</p>
            <p>{`{ "verification_url": "https://oveersea.com/verification?token=...", "token": "...", "expires_in": 900 }`}</p>
            <br />
            <p className="text-muted-foreground">// 3. Buka URL di PWA → session otomatis tercipta</p>
            <p className="text-muted-foreground">// Atau panggil verify-login-token langsung dari app</p>
            <p>{`POST /functions/v1/verify-login-token`}</p>
            <p>{`{ "token": "raw_token_from_step_1" }`}</p>
          </div>
        </CardContent>
      </Card>

      {/* Keys Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expired</TableHead>
                <TableHead>Terakhir Digunakan</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : keys.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada API key</TableCell></TableRow>
              ) : keys.map(k => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{k.key_prefix}•••</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.is_active ? "default" : "secondary"}>
                      {k.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {k.expires_at ? format(new Date(k.expires_at), "dd MMM yyyy") : "Never"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {k.last_used_at ? format(new Date(k.last_used_at), "dd MMM yyyy HH:mm") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(k.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {k.is_active && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-500" onClick={() => handleRevoke(k.id)} title="Revoke">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(k.id)} title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApiKeys;
