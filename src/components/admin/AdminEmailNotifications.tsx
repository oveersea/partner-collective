import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail, Send, Plus, FileText, Clock, CheckCircle2, XCircle, Loader2, Trash2, Eye, Edit, Search, MoreHorizontal, MailPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [searchTpl, setSearchTpl] = useState("");
  const [searchHistory, setSearchHistory] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

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
  const [searchUser, setSearchUser] = useState("");

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

  // Filtered data
  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (searchTpl) {
      const q = searchTpl.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.template_key.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") {
      result = result.filter(t => t.category === filterCategory);
    }
    return result;
  }, [templates, searchTpl, filterCategory]);

  const filteredSends = useMemo(() => {
    if (!searchHistory) return sends;
    const q = searchHistory.toLowerCase();
    return sends.filter(s =>
      s.recipient_email.toLowerCase().includes(q) ||
      (s.recipient_name || "").toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q)
    );
  }, [sends, searchHistory]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [templates]);

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
    setSearchUser("");
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

  const filteredProfiles = useMemo(() => {
    if (!searchUser) return profiles.filter(p => p.email);
    const q = searchUser.toLowerCase();
    return profiles.filter(p => p.email && (
      p.full_name.toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    ));
  }, [profiles, searchUser]);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Notifications</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Kelola template email dan kirim notifikasi ke pengguna</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewTemplate}>
            <Plus className="w-4 h-4 mr-1.5" />Template
          </Button>
          <Button onClick={() => openSendDialog()}>
            <MailPlus className="w-4 h-4 mr-1.5" />Compose
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Template", value: stats.templates, icon: FileText, color: "text-primary bg-primary/10" },
          { label: "Total Sent", value: stats.total, icon: Mail, color: "text-accent-foreground bg-accent" },
          { label: "Delivered", value: stats.sent, icon: CheckCircle2, color: "text-primary bg-primary/10" },
          { label: "Failed", value: stats.failed, icon: XCircle, color: "text-destructive bg-destructive/10" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />Template ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />Riwayat ({sends.length})
          </TabsTrigger>
        </TabsList>

        {/* === TEMPLATES TAB === */}
        <TabsContent value="templates">
          <Card>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTpl}
                  onChange={e => setSearchTpl(e.target.value)}
                  placeholder="Cari template..."
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[250px]">Template</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-[100px]">Kategori</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[60px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText className="w-8 h-8 opacity-40" />
                          <p className="text-sm">
                            {searchTpl || filterCategory !== "all"
                              ? "Tidak ada template yang cocok dengan filter"
                              : "Belum ada template. Klik 'Template' untuk membuat."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTemplates.map(t => (
                    <TableRow key={t.id} className="group cursor-pointer" onClick={() => openEditTemplate(t)}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.template_key}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">{t.subject}</p>
                        {t.description && (
                          <p className="text-xs text-muted-foreground/70 truncate max-w-[300px] mt-0.5">{t.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{t.category || "general"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? "default" : "secondary"} className="text-xs">
                          {t.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setPreviewHtml(t.html_body); setPreviewDialog(true); }}>
                              <Eye className="w-4 h-4 mr-2" />Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditTemplate(t)}>
                              <Edit className="w-4 h-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSendDialog(t.id)}>
                              <Send className="w-4 h-4 mr-2" />Kirim
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteTemplate(t.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* === HISTORY TAB === */}
        <TabsContent value="history">
          <Card>
            <div className="p-4 border-b border-border">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchHistory}
                  onChange={e => setSearchHistory(e.target.value)}
                  placeholder="Cari email, nama, atau subject..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Penerima</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-[100px]">Tipe</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[160px]">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSends.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Mail className="w-8 h-8 opacity-40" />
                          <p className="text-sm">Belum ada email yang dikirim</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSends.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{s.recipient_name || "-"}</p>
                        <p className="text-xs text-muted-foreground">{s.recipient_email}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{s.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{s.send_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {s.status === "sent" ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Sent
                          </Badge>
                        ) : s.status === "failed" ? (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="w-3 h-3 mr-1" />Failed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.sent_at ? new Date(s.sent_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== DIALOGS ========== */}

      {/* Template Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Buat Template Baru"}</DialogTitle>
            <DialogDescription>Isi detail template email di bawah ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Template</label>
                <Input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Welcome Email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Template Key</label>
                <Input value={tplKey} onChange={e => setTplKey(e.target.value)} placeholder="welcome_email" className="font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subject</label>
                <Input value={tplSubject} onChange={e => setTplSubject(e.target.value)} placeholder="Selamat Datang di Oveersea" />
              </div>
              <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deskripsi <span className="text-muted-foreground font-normal">(opsional)</span></label>
              <Input value={tplDesc} onChange={e => setTplDesc(e.target.value)} placeholder="Deskripsi singkat template ini" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Body HTML</label>
              <Textarea value={tplBody} onChange={e => setTplBody(e.target.value)} rows={12} placeholder="<html>...</html>" className="font-mono text-xs" />
            </div>
            {tplBody && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preview</label>
                <div className="border rounded-lg p-4 bg-background max-h-[200px] overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: tplBody }} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setTemplateDialog(false)}>Batal</Button>
            <Button onClick={saveTemplate} disabled={savingTpl}>
              {savingTpl && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>Kirim email notifikasi ke pengguna terpilih.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Template <span className="text-muted-foreground font-normal">(opsional)</span></label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger><SelectValue placeholder="Pilih template" /></SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.is_active).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Penerima</label>
                <Select value={sendTarget} onValueChange={(v) => setSendTarget(v as "all" | "selected")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua User ({profiles.filter(p => p.email).length})</SelectItem>
                    <SelectItem value="selected">Pilih User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sendTarget === "selected" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                    placeholder="Cari user..."
                    className="pl-9"
                  />
                </div>
                {selectedUserIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">{selectedUserIds.length} user dipilih</p>
                )}
                <div className="border rounded-lg max-h-[180px] overflow-y-auto divide-y divide-border">
                  {filteredProfiles.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada user ditemukan</div>
                  ) : filteredProfiles.map(p => (
                    <label key={p.user_id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={selectedUserIds.includes(p.user_id)}
                        onCheckedChange={() => toggleUserSelection(p.user_id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Input value={sendSubject} onChange={e => setSendSubject(e.target.value)} placeholder="Subject email" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Body HTML</label>
              <Textarea value={sendBody} onChange={e => setSendBody(e.target.value)} rows={10} placeholder="<html>...</html>" className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setSendDialog(false)}>Batal</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Kirim {sendTarget === "all"
                ? `ke ${profiles.filter(p => p.email).length} user`
                : selectedUserIds.length > 0
                  ? `ke ${selectedUserIds.length} user`
                  : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Email</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-background">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailNotifications;
