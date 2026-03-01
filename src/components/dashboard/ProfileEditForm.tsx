import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Info, Sparkles, User, MapPin, Briefcase, GraduationCap, Globe, Heart } from "lucide-react";

interface ProfileEditFormProps {
  editData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 pt-4 pb-1">
    <Icon className="w-4 h-4 text-primary" />
    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
  </div>
);

const ProfileEditForm = ({ editData, onChange, onSave, onCancel }: ProfileEditFormProps) => {
  const set = (key: string, value: any) => onChange({ ...editData, [key]: value });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-5">
      <h2 className="text-lg font-semibold text-card-foreground">Edit Informasi Profil</h2>

      {/* Approval notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-700">Perubahan profil memerlukan persetujuan admin</p>
          <p className="text-amber-600/80 mt-0.5">Setiap perubahan yang Anda simpan akan dikirim ke admin untuk di-review terlebih dahulu.</p>
        </div>
      </div>

      {/* ───── Informasi Dasar ───── */}
      <SectionHeader icon={User} title="Informasi Dasar" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-card-foreground">Nama Lengkap</Label>
          <Input className="mt-1.5" value={editData.full_name || ""} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Headline</Label>
          <Input className="mt-1.5" placeholder="Full Stack Developer" value={editData.headline || ""} onChange={(e) => set("headline", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Tanggal Lahir</Label>
          <Input className="mt-1.5" type="date" value={editData.date_of_birth || ""} onChange={(e) => set("date_of_birth", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Jenis Kelamin</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.gender || ""} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Pilih</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
        <div>
          <Label className="text-card-foreground">Kewarganegaraan</Label>
          <Input className="mt-1.5" placeholder="Indonesia" value={editData.nationality || ""} onChange={(e) => set("nationality", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Status Pernikahan</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.marital_status || ""} onChange={(e) => set("marital_status", e.target.value)}>
            <option value="">Pilih</option>
            <option value="single">Belum Menikah</option>
            <option value="married">Menikah</option>
            <option value="divorced">Cerai</option>
            <option value="widowed">Janda/Duda</option>
          </select>
        </div>
        <div>
          <Label className="text-card-foreground">No. Telepon</Label>
          <Input className="mt-1.5" placeholder="+62812..." value={editData.phone_number || ""} onChange={(e) => set("phone_number", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Bahasa</Label>
          <Input className="mt-1.5" placeholder="Indonesia, English" value={editData.languages || ""} onChange={(e) => set("languages", e.target.value)} />
        </div>
      </div>

      {/* ───── Alamat ───── */}
      <SectionHeader icon={MapPin} title="Alamat" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-card-foreground">Alamat Lengkap</Label>
          <Input className="mt-1.5" placeholder="Jl. Sudirman No. 10" value={editData.address || ""} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Kelurahan / Desa</Label>
          <Input className="mt-1.5" value={editData.subdistrict || ""} onChange={(e) => set("subdistrict", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Kecamatan</Label>
          <Input className="mt-1.5" value={editData.district || ""} onChange={(e) => set("district", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Kota</Label>
          <Input className="mt-1.5" value={editData.city || ""} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Provinsi</Label>
          <Input className="mt-1.5" value={editData.province || ""} onChange={(e) => set("province", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Negara</Label>
          <Input className="mt-1.5" value={editData.country || ""} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Kode Pos</Label>
          <Input className="mt-1.5" value={editData.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} />
        </div>
      </div>

      {/* ───── Profesional ───── */}
      <SectionHeader icon={Briefcase} title="Informasi Profesional" />
      <div>
        <Label className="text-card-foreground">Ringkasan Profesional</Label>
        <Textarea className="mt-1.5" rows={4} placeholder="Ceritakan tentang pengalaman dan keahlian Anda..." value={editData.professional_summary || ""} onChange={(e) => set("professional_summary", e.target.value)} />
      </div>
      <div>
        <Label className="text-card-foreground">Bio Singkat</Label>
        <Textarea className="mt-1.5" rows={2} placeholder="Bio singkat yang tampil di profil Anda" value={editData.bio || ""} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-card-foreground">Ketersediaan</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.opportunity_availability || ""} onChange={(e) => set("opportunity_availability", e.target.value)}>
            <option value="">Pilih</option>
            <option value="available">Available</option>
            <option value="open">Open to Opportunities</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Not Available</option>
          </select>
        </div>
        <div>
          <Label className="text-card-foreground">Pendidikan Terakhir</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.highest_education || ""} onChange={(e) => set("highest_education", e.target.value)}>
            <option value="">Pilih</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA/SMK">SMA/SMK</option>
            <option value="D1">D1</option>
            <option value="D2">D2</option>
            <option value="D3">D3</option>
            <option value="D4/S1">D4/S1</option>
            <option value="S2">S2</option>
            <option value="S3">S3</option>
          </select>
        </div>
      </div>

      {/* ───── Kompensasi ───── */}
      <SectionHeader icon={Heart} title="Ekspektasi Kompensasi" />
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-card-foreground">Daily Rate (IDR)</Label>
          <Input className="mt-1.5" type="number" placeholder="500000" value={editData.daily_rate || ""} onChange={(e) => set("daily_rate", Number(e.target.value) || null)} />
        </div>
        <div>
          <Label className="text-card-foreground">Gaji Bulanan (IDR)</Label>
          <Input className="mt-1.5" type="number" placeholder="10000000" value={editData.monthly_salary_rate || ""} onChange={(e) => set("monthly_salary_rate", Number(e.target.value) || null)} />
        </div>
        <div>
          <Label className="text-card-foreground">Mata Uang</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.expected_salary_currency || "IDR"} onChange={(e) => set("expected_salary_currency", e.target.value)}>
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
            <option value="MYR">MYR</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Skills info - read-only */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-primary">Skill diisi otomatis oleh sistem</p>
          <p className="text-muted-foreground mt-0.5">
            Skill Anda akan terisi secara otomatis ketika Anda menyelesaikan program learning atau lulus assessment.
          </p>
          {editData.skills && editData.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {editData.skills.map((s: string) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ───── Sosial & Link ───── */}
      <SectionHeader icon={Globe} title="Link & Sosial Media" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-card-foreground">LinkedIn URL</Label>
          <Input className="mt-1.5" placeholder="https://linkedin.com/in/..." value={editData.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Website / Portfolio URL</Label>
          <Input className="mt-1.5" placeholder="https://..." value={editData.website_url || ""} onChange={(e) => set("website_url", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="ghost" onClick={onCancel}>Batal</Button>
        <Button onClick={onSave}><Save className="w-4 h-4" />Kirim untuk Persetujuan</Button>
      </div>
    </motion.div>
  );
};

export default ProfileEditForm;
