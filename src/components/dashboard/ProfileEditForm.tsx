import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Info, Sparkles } from "lucide-react";

interface ProfileEditFormProps {
  editData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onSave: () => void;
  onCancel: () => void;
}

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
          <p className="text-amber-600/80 mt-0.5">Setiap perubahan yang Anda simpan akan dikirim ke admin untuk di-review terlebih dahulu sebelum ditampilkan di profil Anda.</p>
        </div>
      </div>

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
          <Label className="text-card-foreground">Kota</Label>
          <Input className="mt-1.5" value={editData.city || ""} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Negara</Label>
          <Input className="mt-1.5" value={editData.country || ""} onChange={(e) => set("country", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">No. Telepon</Label>
          <Input className="mt-1.5" value={editData.phone_number || ""} onChange={(e) => set("phone_number", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Daily Rate (IDR)</Label>
          <Input className="mt-1.5" type="number" value={editData.daily_rate || ""} onChange={(e) => set("daily_rate", Number(e.target.value) || null)} />
        </div>
        <div>
          <Label className="text-card-foreground">Pendidikan Terakhir</Label>
          <Input className="mt-1.5" value={editData.highest_education || ""} onChange={(e) => set("highest_education", e.target.value)} />
        </div>
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
      </div>
      <div>
        <Label className="text-card-foreground">Ringkasan Profesional</Label>
        <Textarea className="mt-1.5" rows={3} value={editData.professional_summary || ""} onChange={(e) => set("professional_summary", e.target.value)} />
      </div>

      {/* Skills info - read-only */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-primary">Skill diisi otomatis oleh sistem</p>
          <p className="text-muted-foreground mt-0.5">
            Skill Anda akan terisi secara otomatis ketika Anda menyelesaikan program learning atau lulus assessment. 
            Admin juga dapat menambahkan skill secara manual ke profil Anda.
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

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-card-foreground">LinkedIn URL</Label>
          <Input className="mt-1.5" value={editData.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Website URL</Label>
          <Input className="mt-1.5" value={editData.website_url || ""} onChange={(e) => set("website_url", e.target.value)} />
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
