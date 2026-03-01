import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

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
      <h2 className="text-lg font-bold text-card-foreground">Edit Informasi Profil</h2>
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
      <div>
        <Label className="text-card-foreground">Skills (pisahkan dengan koma)</Label>
        <Input className="mt-1.5" placeholder="React, TypeScript, Node.js" value={editData.skills?.join(", ") || ""} onChange={(e) => set("skills", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
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
        <Button onClick={onSave}><Save className="w-4 h-4" />Simpan Profil</Button>
      </div>
    </motion.div>
  );
};

export default ProfileEditForm;
