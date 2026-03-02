import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Mail, Send, Plus, FileText, Clock, CheckCircle2, XCircle, Loader2, Trash2, Eye, Edit,
} from "lucide-react";
import { toast } from "sonner";

type EmailTemplate = {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  description: string | null;
  html_body: string;
  is_active: boolean;
  category: string | null;
  created_at: string;
};

type EmailSend = {
  id: string;
  subject: string;
  recipient_email: string;
  recipient_name: string | null;
  send_type: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

type Profile = {
  user_id: string;
  full_name: string;
  email?: string;
};

const AdminEmailNotifications = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Template dialog
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [tplName, setTplName] = useState("");
  const [tplKey, setTplKey] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplCategory, setTplCategory] = useState("general");
  const [tplDesc, setTplDesc] = useState("");
  const [savingTpl, setSavingTpl] = useState(false);

  // Send dialog
  const [sendDialog, setSendDialog] = useState(false);
  const [sendTarget, setSendTarget] = useState<"all" | "selected">("selected");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [sending, setSending] = useState(false);

  // Preview
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tplRes, sendsRes, profilesRes] = await Promise.all([
      supabase.from("email_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("email_sends").select("id, subject, recipient_email, recipient_name, send_type, status, error_message, sent_at, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("user_id, full_name").limit(500),
    ]);
    if (tplRes.data) setTemplates(tplRes.data as EmailTemplate[]);
    if (sendsRes.data) setSends(sendsRes.data as EmailSend[]);
    if (profilesRes.data) {
      // Get emails from auth
      const { data: authData } = await supabase.rpc("admin_get_users_auth_info");
      const emailMap = new Map<string, string>();
      if (authData) {
        (authData as { id: string; email: string }[]).forEach(u => emailMap.set(u.id, u.email));
      }
      setProfiles(
        (profilesRes.data as Profile[]).map(p => ({ ...p, email: emailMap.get(p.user_id) || "" }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Template CRUD
  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTplName(""); setTplKey(""); setTplSubject(""); setTplBody(""); setTplCategory("general"); setTplDesc("");
    setTemplateDialog(true);
  };

  const openEditTemplate = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setTplName(t.name); setTplKey(t.template_key); setTplSubject(t.subject);
    setTplBody(t.html_body); setTplCategory(t.category || "general"); setTplDesc(t.description || "");
    setTemplateDialog(true);
  };

  const saveTemplate = async () => {
    if (!tplName || !tplKey || !tplSubject || !tplBody) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setSavingTpl(true);
    const payload = {
      name: tplName,
      template_key: tplKey,
      subject: tplSubject,
      html_body: tplBody,
      category: tplCategory,
      description: tplDesc || null,
    };

    if (editingTemplate) {
      const { error } = await supabase.from("email_templates").update(payload).eq("id", editingTemplate.id);
      if (error) toast.error("Gagal update: " + error.message);
      else toast.success("Template diperbarui");
    } else {
      const { error } = await supabase.from("email_templates").insert(payload);
      if (error) toast.error("Gagal simpan: " + error.message);
      else toast.success("Template dibuat");
    }
    setSavingTpl(false);
    setTemplateDialog(false);
    fetchData();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Hapus template ini?")) return;
    await supabase.from("email_templates").delete().eq("id", id);
    toast.success("Template dihapus");
    fetchData();
  };

  // Send email
  const openSendDialog = (templateId?: string) => {
    if (templateId) {
      const tpl = templates.find(t => t.id === templateId);
      if (tpl) {
        setSendSubject(tpl.subject);
        setSendBody(tpl.html_body);
        setSelectedTemplateId(tpl.id);
      }
    } else {
      setSendSubject(""); setSendBody(""); setSelectedTemplateId("");
    }
    setSendTarget("selected");
    setSelectedUserIds([]);
    setSendDialog(true);
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      setSendSubject(tpl.subject);
      setSendBody(tpl.html_body);
    }
  };

  const handleSend = async () => {
    if (!sendSubject || !sendBody) {
      toast.error("Subject dan body email wajib diisi");
      return;
    }

    let recipients: { email: string; name?: string; user_id?: string }[] = [];

    if (sendTarget === "all") {
      recipients = profiles.filter(p => p.email).map(p => ({
        email: p.email!,
        name: p.full_name,
        user_id: p.user_id,
      }));
    } else {
      recipients = profiles
        .filter(p => selectedUserIds.includes(p.user_id) && p.email)
        .map(p => ({ email: p.email!, name: p.full_name, user_id: p.user_id }));
    }

    if (recipients.length === 0) {
      toast.error("Tidak ada penerima yang valid");
      return;
    }

    if (sendTarget === "all" && !confirm(`Kirim email ke ${recipients.length} user?`)) return;

    setSending(true);
    toast.info(`Mengirim ke ${recipients.length} penerima...`);

    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: {
        to: recipients,
        subject: sendSubject,
        html: sendBody,
        template_id: selectedTemplateId || undefined,
        send_type: sendTarget === "all" ? "broadcast" : "manual",
      },
    });

    if (error) {
      toast.error("Gagal kirim: " + error.message);
    } else if (data?.summary) {
      toast.success(`${data.summary.success} berhasil, ${data.summary.failed} gagal`);
    }

    setSending(false);
    setSendDialog(false);
    fetchData();
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "sent": return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="w-3 h-3 mr-1" />Sent</Badge>;
      case "failed": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const stats = {
    total: sends.length,
    sent: sends.filter(s => s.status === "sent").length,
    failed: sends.filter(s => s.status === "failed").length,
    templates: templates.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Notifications</h2>
          <p className="text-muted-foreground text-sm">Kelola template dan kirim email notifikasi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewTemplate}>
            <Plus className="w-4 h-4 mr-2" />Template Baru
          </Button>
          <Button onClick={() => openSendDialog()}>
            <Send className="w-4 h-4 mr-2" />Kirim Email
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-5 h-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{stats.templates}</p><p className="text-xs text-muted-foreground">Template</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent"><Mail className="w-5 h-5 text-accent-foreground" /></div>
              <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Terkirim</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{stats.sent}</p><p className="text-xs text-muted-foreground">Berhasil</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="w-5 h-5 text-destructive" /></div>
              <div><p className="text-2xl font-bold">{stats.failed}</p><p className="text-xs text-muted-foreground">Gagal</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-1" />Template</TabsTrigger>
          <TabsTrigger value="history"><Clock className="w-4 h-4 mr-1" />Riwayat Kirim</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {templates.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Belum ada template. Buat template pertama Anda.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map(t => (
                <Card key={t.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base leading-tight truncate">{t.name}</CardTitle>
                        <CardDescription className="text-xs mt-1 font-mono truncate">{t.template_key}</CardDescription>
                      </div>
                      <Badge variant={t.is_active ? "default" : "secondary"} className="shrink-0">
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <p className="text-sm text-muted-foreground line-clamp-2"><span className="font-medium text-foreground">Subject:</span> {t.subject}</p>
                      {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                      {t.category && <Badge variant="outline" className="text-xs">{t.category}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" onClick={() => { setPreviewHtml(t.html_body); setPreviewDialog(true); }}>
                        <Eye className="w-3 h-3 mr-1" />Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditTemplate(t)}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openSendDialog(t.id)}>
                        <Send className="w-3 h-3 mr-1" />Kirim
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => deleteTemplate(t.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sends.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada email yang dikirim</TableCell></TableRow>
                  ) : sends.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{s.recipient_name || "-"}</p>
                          <p className="text-xs text-muted-foreground">{s.recipient_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{s.subject}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.send_type}</Badge></TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.sent_at ? new Date(s.sent_at).toLocaleString("id-ID") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Buat Template Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Template</label>
                <Input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Welcome Email" />
              </div>
              <div>
                <label className="text-sm font-medium">Template Key</label>
                <Input value={tplKey} onChange={e => setTplKey(e.target.value)} placeholder="welcome_email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input value={tplSubject} onChange={e => setTplSubject(e.target.value)} placeholder="Selamat Datang di Oveersea" />
              </div>
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <Select value={tplCategory} onValueChange={setTplCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Deskripsi (opsional)</label>
              <Input value={tplDesc} onChange={e => setTplDesc(e.target.value)} placeholder="Deskripsi singkat template ini" />
            </div>
            <div>
              <label className="text-sm font-medium">Body HTML</label>
              <Textarea value={tplBody} onChange={e => setTplBody(e.target.value)} rows={12} placeholder="<html>...</html>" className="font-mono text-xs" />
            </div>
            {tplBody && (
              <div>
                <label className="text-sm font-medium mb-2 block">Preview</label>
                <div className="border rounded-lg p-4 bg-white max-h-[200px] overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: tplBody }} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialog(false)}>Batal</Button>
            <Button onClick={saveTemplate} disabled={savingTpl}>
              {savingTpl ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kirim Email Notifikasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template (opsional)</label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger><SelectValue placeholder="Pilih template atau tulis manual" /></SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.is_active).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Penerima</label>
              <Select value={sendTarget} onValueChange={(v) => setSendTarget(v as "all" | "selected")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua User ({profiles.filter(p => p.email).length})</SelectItem>
                  <SelectItem value="selected">Pilih User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sendTarget === "selected" && (
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {profiles.filter(p => p.email).map(p => (
                  <label key={p.user_id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(p.user_id)}
                      onChange={() => toggleUserSelection(p.user_id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input value={sendSubject} onChange={e => setSendSubject(e.target.value)} placeholder="Subject email" />
            </div>
            <div>
              <label className="text-sm font-medium">Body HTML</label>
              <Textarea value={sendBody} onChange={e => setSendBody(e.target.value)} rows={10} placeholder="<html>...</html>" className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(false)}>Batal</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Kirim {sendTarget === "all" ? `ke ${profiles.filter(p => p.email).length} user` : selectedUserIds.length > 0 ? `ke ${selectedUserIds.length} user` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Preview Email</DialogTitle></DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailNotifications;
