import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-4 md:p-8 shadow-card space-y-5">
      <h2 className="text-lg font-semibold text-card-foreground">Edit Profile Information</h2>

      {/* Approval notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-700">Profile changes require admin approval</p>
          <p className="text-amber-600/80 mt-0.5">Any changes you save will be sent to an admin for review first.</p>
        </div>
      </div>

      {/* ───── Basic Info ───── */}
      <SectionHeader icon={User} title="Basic Information" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-card-foreground">Full Name</Label>
          <Input className="mt-1.5" value={editData.full_name || ""} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Headline</Label>
          <Input className="mt-1.5" placeholder="Full Stack Developer" value={editData.headline || ""} onChange={(e) => set("headline", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Date of Birth</Label>
          <Input className="mt-1.5" type="date" value={editData.date_of_birth || ""} onChange={(e) => set("date_of_birth", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Gender</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.gender || ""} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <Label className="text-card-foreground">Nationality</Label>
          <Input className="mt-1.5" placeholder="Indonesian" value={editData.nationality || ""} onChange={(e) => set("nationality", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Marital Status</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.marital_status || ""} onChange={(e) => set("marital_status", e.target.value)}>
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>
        <div>
          <Label className="text-card-foreground">Phone Number</Label>
          <Input className="mt-1.5" placeholder="+62812..." value={editData.phone_number || ""} onChange={(e) => set("phone_number", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Languages</Label>
          <Input className="mt-1.5" placeholder="Indonesian, English" value={editData.languages || ""} onChange={(e) => set("languages", e.target.value)} />
        </div>
      </div>

      {/* ───── Address ───── */}
      <SectionHeader icon={MapPin} title="Address" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-card-foreground">Full Address</Label>
          <Input className="mt-1.5" placeholder="123 Main Street" value={editData.address || ""} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Sub-district</Label>
          <Input className="mt-1.5" value={editData.subdistrict || ""} onChange={(e) => set("subdistrict", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">District</Label>
          <Input className="mt-1.5" value={editData.district || ""} onChange={(e) => set("district", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">City</Label>
          <Input className="mt-1.5" value={editData.city || ""} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Province</Label>
          <Input className="mt-1.5" value={editData.province || ""} onChange={(e) => set("province", e.target.value)} />
        </div>
        <div>
          <Label className="text-card-foreground">Country</Label>
          <CountrySelect className="mt-1.5" value={editData.country || ""} onChange={(v) => set("country", v)} />
        </div>
        <div>
          <Label className="text-card-foreground">Postal Code</Label>
          <Input className="mt-1.5" value={editData.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} />
        </div>
      </div>

      {/* ───── Professional ───── */}
      <SectionHeader icon={Briefcase} title="Professional Information" />
      <div>
        <Label className="text-card-foreground">Professional Summary</Label>
        <Textarea className="mt-1.5" rows={4} placeholder="Tell us about your experience and expertise..." value={editData.professional_summary || ""} onChange={(e) => set("professional_summary", e.target.value)} />
      </div>
      <div>
        <Label className="text-card-foreground">Short Bio</Label>
        <Textarea className="mt-1.5" rows={2} placeholder="A short bio displayed on your profile" value={editData.bio || ""} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-card-foreground">Availability</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.opportunity_availability || ""} onChange={(e) => set("opportunity_availability", e.target.value)}>
            <option value="">Select</option>
            <option value="available">Available</option>
            <option value="open">Open to Opportunities</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Not Available</option>
          </select>
        </div>
        <div>
          <Label className="text-card-foreground">Highest Education</Label>
          <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={editData.highest_education || ""} onChange={(e) => set("highest_education", e.target.value)}>
            <option value="">Select</option>
            <option value="SD">Elementary</option>
            <option value="SMP">Middle School</option>
            <option value="SMA/SMK">High School</option>
            <option value="D1">Diploma 1</option>
            <option value="D2">Diploma 2</option>
            <option value="D3">Diploma 3</option>
            <option value="D4/S1">Bachelor's</option>
            <option value="S2">Master's</option>
            <option value="S3">Doctorate</option>
          </select>
        </div>
      </div>

      {/* ───── Compensation ───── */}
      <SectionHeader icon={Heart} title="Compensation Expectations" />
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-card-foreground">Daily Rate (IDR)</Label>
          <Input className="mt-1.5" type="number" placeholder="500000" value={editData.daily_rate || ""} onChange={(e) => set("daily_rate", Number(e.target.value) || null)} />
        </div>
        <div>
          <Label className="text-card-foreground">Monthly Salary (IDR)</Label>
          <Input className="mt-1.5" type="number" placeholder="10000000" value={editData.monthly_salary_rate || ""} onChange={(e) => set("monthly_salary_rate", Number(e.target.value) || null)} />
        </div>
        <div>
          <Label className="text-card-foreground">Currency</Label>
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
          <p className="font-medium text-primary">Skills are auto-populated by the system</p>
          <p className="text-muted-foreground mt-0.5">
            Your skills will be automatically updated when you complete learning programs or pass assessments.
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

      {/* ───── Social & Links ───── */}
      <SectionHeader icon={Globe} title="Links & Social Media" />
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

      <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-4 md:static bg-card py-3 md:py-0 -mx-4 px-4 md:mx-0 md:px-0 rounded-b-2xl">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} className="flex-1 md:flex-none"><Save className="w-4 h-4" />Submit for Approval</Button>
      </div>
    </motion.div>
  );
};

export default ProfileEditForm;
