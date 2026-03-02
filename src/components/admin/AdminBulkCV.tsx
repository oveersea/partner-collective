import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, FileText, RefreshCw, CheckCircle2, XCircle, Loader2, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

type CvUpload = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  parsing_status: string;
  parsing_error: string | null;
  candidate_id: string | null;
  created_at: string;
  updated_at: string;
};

const MAX_FILES = 20;
const MAX_CONCURRENT = 5;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const AdminBulkCV = () => {
  const [uploads, setUploads] = useState<CvUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CvUpload | null>(null);
  const [parsingAll, setParsingAll] = useState(false);
  const [invitingAll, setInvitingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = useCallback(async () => {
    const { data, error } = await supabase
      .from("cv_uploads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) setUploads(data as CvUpload[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  // Poll for status updates when there are processing items
  useEffect(() => {
    const hasProcessing = uploads.some(u => u.parsing_status === "processing" || u.parsing_status === "pending");
    if (!hasProcessing) return;

    const interval = setInterval(fetchUploads, 3000);
    return () => clearInterval(interval);
  }, [uploads, fetchUploads]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => ACCEPTED_TYPES.includes(f.type));
    const invalid = files.length - valid.length;

    if (invalid > 0) toast.warning(`${invalid} file dilewati (hanya PDF/DOCX)`);
    if (valid.length > MAX_FILES) {
      toast.error(`Maksimal ${MAX_FILES} file per batch`);
      setSelectedFiles(valid.slice(0, MAX_FILES));
    } else {
      setSelectedFiles(valid);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async (file: File, userId: string) => {
    const fileId = `${file.name}-${Date.now()}`;
    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: "uploading" }));

      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

      // Upload to storage
      const { error: storageError } = await supabase.storage
        .from("cv-uploads")
        .upload(storagePath, file);

      if (storageError) throw new Error("Upload gagal: " + storageError.message);

      setUploadProgress(prev => ({ ...prev, [fileId]: "saving" }));

      // Insert cv_uploads record
      const { data: record, error: insertError } = await supabase
        .from("cv_uploads")
        .insert({
          file_name: file.name,
          file_url: storagePath,
          file_type: ext,
          file_size_bytes: file.size,
          parsing_status: "pending",
          uploaded_by: userId,
        })
        .select()
        .single();

      if (insertError || !record) throw new Error("Gagal menyimpan record: " + (insertError?.message || ""));

      setUploadProgress(prev => ({ ...prev, [fileId]: "parsing" }));

      // Call parse-cv edge function
      const { error: fnError } = await supabase.functions.invoke("parse-cv", {
        body: { cv_upload_id: record.id },
      });

      if (fnError) {
        console.error("Parse error:", fnError);
        setUploadProgress(prev => ({ ...prev, [fileId]: "error" }));
      } else {
        setUploadProgress(prev => ({ ...prev, [fileId]: "done" }));
      }
    } catch (err: any) {
      console.error("Process file error:", err);
      setUploadProgress(prev => ({ ...prev, [fileId]: "error" }));
      toast.error(`Gagal: ${file.name} - ${err.message}`);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress({});

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sesi kadaluarsa, silakan login ulang");
      setUploading(false);
      return;
    }

    // Process in batches of MAX_CONCURRENT
    const files = [...selectedFiles];
    for (let i = 0; i < files.length; i += MAX_CONCURRENT) {
      const batch = files.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(batch.map(f => processFile(f, user.id)));
    }

    setUploading(false);
    setSelectedFiles([]);
    setDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchUploads();
    toast.success("Batch upload selesai");
  };

  const handleReparse = async (upload: CvUpload) => {
    toast.info(`Re-parsing ${upload.file_name}...`);
    await supabase
      .from("cv_uploads")
      .update({ parsing_status: "pending", parsing_error: null, updated_at: new Date().toISOString() })
      .eq("id", upload.id);

    const { error } = await supabase.functions.invoke("parse-cv", {
      body: { cv_upload_id: upload.id },
    });

    if (error) {
      toast.error("Re-parse gagal: " + error.message);
    } else {
      toast.success("Re-parse dimulai");
    }
    fetchUploads();
  };

  const handleDelete = async (upload: CvUpload) => {
    try {
      // Delete file from storage (ignore error if file already gone)
      await supabase.storage.from("cv-uploads").remove([upload.file_url]);

      // Delete cv_uploads record (candidates_archive data is preserved independently)
      const { error } = await supabase
        .from("cv_uploads")
        .delete()
        .eq("id", upload.id);

      if (error) throw error;

      setUploads(prev => prev.filter(u => u.id !== upload.id));
      setDeleteTarget(null);
      toast.success(`"${upload.file_name}" berhasil dihapus`);
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  const handleParseAllPending = async () => {
    const pendingUploads = uploads.filter(u => u.parsing_status === "pending");
    if (pendingUploads.length === 0) return;
    setParsingAll(true);
    toast.info(`Memulai parsing ${pendingUploads.length} CV...`);

    for (let i = 0; i < pendingUploads.length; i += MAX_CONCURRENT) {
      const batch = pendingUploads.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(
        batch.map(async (u) => {
          await supabase
            .from("cv_uploads")
            .update({ parsing_status: "processing", updated_at: new Date().toISOString() })
            .eq("id", u.id);
          const { error } = await supabase.functions.invoke("parse-cv", {
            body: { cv_upload_id: u.id },
          });
          if (error) console.error(`Parse error for ${u.file_name}:`, error);
        })
      );
    }

    setParsingAll(false);
    fetchUploads();
    toast.success("Batch parsing selesai");
  };

  const handleInviteAllCandidates = async () => {
    setInvitingAll(true);
    toast.info("Mengambil data kandidat yang belum diinvite...");

    try {
      // Get completed uploads with candidate_id
      const completedUploads = uploads.filter(u => u.parsing_status === "completed" && u.candidate_id);
      const candidateIds = completedUploads.map(u => u.candidate_id!);

      if (candidateIds.length === 0) {
        toast.warning("Tidak ada kandidat yang perlu diinvite");
        setInvitingAll(false);
        return;
      }

      // Fetch candidates with emails
      const { data: candidates, error: fetchError } = await supabase
        .from("candidates_archive")
        .select("id, full_name, email, phone")
        .in("id", candidateIds)
        .not("email", "is", null);

      if (fetchError || !candidates || candidates.length === 0) {
        toast.warning("Tidak ada kandidat dengan email yang bisa diinvite");
        setInvitingAll(false);
        return;
      }

      // Filter out already invited
      const { data: existingInvites } = await supabase
        .from("user_invitations")
        .select("email");

      const invitedEmails = new Set(
        (existingInvites || []).map((i: { email: string }) => i.email?.toLowerCase().trim())
      );

      const toInvite = candidates.filter(
        c => c.email && !invitedEmails.has(c.email.toLowerCase().trim())
      );

      if (toInvite.length === 0) {
        toast.info("Semua kandidat sudah diinvite sebelumnya");
        setInvitingAll(false);
        return;
      }

      toast.info(`Mengirim undangan ke ${toInvite.length} kandidat...`);

      // Batch in groups of 20
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < toInvite.length; i += 20) {
        const batch = toInvite.slice(i, i + 20).map(c => ({
          full_name: c.full_name || "",
          email: c.email!,
          phone_number: c.phone || "",
        }));

        const { data, error } = await supabase.functions.invoke("invite-users", {
          body: { invites: batch },
        });

        if (error) {
          console.error("Invite batch error:", error);
          failCount += batch.length;
        } else if (data?.summary) {
          successCount += data.summary.success || 0;
          failCount += data.summary.failed || 0;
        }
      }

      if (successCount > 0) toast.success(`${successCount} kandidat berhasil diundang`);
      if (failCount > 0) toast.warning(`${failCount} kandidat gagal diundang`);
    } catch (err: any) {
      console.error("Invite all error:", err);
      toast.error("Gagal mengirim undangan: " + err.message);
    }

    setInvitingAll(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Selesai</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Proses</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Gagal</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const completedCount = uploads.filter(u => u.parsing_status === "completed").length;
  const failedCount = uploads.filter(u => u.parsing_status === "failed").length;
  const processingCount = uploads.filter(u => u.parsing_status === "processing" || u.parsing_status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bulk CV Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload dan parsing CV kandidat secara massal (maks {MAX_FILES} per batch)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUploads} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {uploads.filter(u => u.parsing_status === "pending").length > 0 && (
            <Button variant="outline" onClick={handleParseAllPending} disabled={parsingAll}>
              {parsingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Parse All Pending ({uploads.filter(u => u.parsing_status === "pending").length})
            </Button>
          )}
          {uploads.filter(u => u.parsing_status === "completed" && u.candidate_id).length > 0 && (
            <Button variant="outline" onClick={handleInviteAllCandidates} disabled={invitingAll}>
              {invitingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Invite Candidates
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload CVs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-foreground">{uploads.length}</div>
            <div className="text-sm text-muted-foreground">Total Upload</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-muted-foreground">Berhasil Diparse</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
            <div className="text-sm text-muted-foreground">Sedang Diproses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-destructive">{failedCount}</div>
            <div className="text-sm text-muted-foreground">Gagal</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar CV Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada CV yang diupload</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />Upload CV Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kandidat</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{u.file_name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{u.file_type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatSize(u.file_size_bytes)}</TableCell>
                    <TableCell>
                      {statusBadge(u.parsing_status)}
                      {u.parsing_error && (
                        <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={u.parsing_error}>
                          {u.parsing_error}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.candidate_id ? (
                        <span className="text-green-600 font-medium">Tersimpan</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(u.parsing_status === "failed" || u.parsing_status === "pending") && (
                          <Button size="sm" variant="outline" onClick={() => handleReparse(u)}>
                            <RefreshCw className="w-3 h-3 mr-1" />Re-parse
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!uploading) setDialogOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Bulk CV</DialogTitle>
            <DialogDescription>
              Pilih hingga {MAX_FILES} file CV (PDF/DOCX) untuk diupload dan diparse secara otomatis oleh AI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Klik untuk memilih file atau drag & drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX (maks {MAX_FILES} file, 20MB per file)</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-auto">
                {selectedFiles.map((file, i) => {
                  const fileId = `${file.name}-${Date.now()}`;
                  const status = uploadProgress[fileId];
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                      {!uploading && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFile(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengupload dan parsing {selectedFiles.length} file...</span>
                </div>
                <Progress value={
                  (Object.values(uploadProgress).filter(s => s === "done" || s === "error").length / selectedFiles.length) * 100
                } className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Upload {selectedFiles.length} File</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus CV Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              File "{deleteTarget?.file_name}" akan dihapus dari storage dan daftar upload.
              {deleteTarget?.candidate_id
                ? " Data kandidat yang sudah diparse tetap tersimpan di database dan tidak akan terpengaruh."
                : " Belum ada data kandidat yang tersimpan dari file ini."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBulkCV;
