import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Shield, Edit3, X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  kyc_status: string;
  account_type: string;
  oveercode: string;
  opportunity_availability: string | null;
}

interface ProfileHeaderProps {
  profile: Profile;
  editing: boolean;
  onToggleEdit: () => void;
  onAvatarUpdated?: (url: string) => void;
}

const kycBadgeMap: Record<string, { label: string; color: string }> = {
  verified: { label: "Verified", color: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Pending Verification", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  unverified: { label: "Unverified", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const availabilityMap: Record<string, { emoji: string; label: string; color: string }> = {
  available: { emoji: "🟢", label: "Available", color: "bg-primary/10 text-primary" },
  open: { emoji: "🔵", label: "Open", color: "bg-blue-500/10 text-blue-600" },
  busy: { emoji: "🟡", label: "Busy", color: "bg-amber-500/10 text-amber-600" },
  unavailable: { emoji: "⚫", label: "Not Available", color: "bg-muted text-muted-foreground" },
};

const ProfileHeader = ({ profile, editing, onToggleEdit, onAvatarUpdated }: ProfileHeaderProps) => {
  const kycBadge = kycBadgeMap[profile.kyc_status] || { label: profile.kyc_status, color: "bg-muted text-muted-foreground border-border" };
  const availability = profile.opportunity_availability ? availabilityMap[profile.opportunity_availability] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache-buster
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl } as any)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      onAvatarUpdated?.(avatarUrl);
      toast.success("Foto profil berhasil diperbarui");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengupload foto");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4 md:p-8 shadow-card"
    >
      <div className="flex items-start gap-4 md:gap-6">
        {/* Avatar with upload overlay */}
        <div
          className="relative w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer group"
          onClick={handleAvatarClick}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-14 h-14 md:w-20 md:h-20 rounded-2xl object-cover" />
          ) : (
            <User className="w-7 h-7 md:w-10 md:h-10 text-primary" />
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 md:w-6 md:h-6 text-white" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 md:gap-4">
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-semibold text-card-foreground truncate">
                {profile.full_name || "Name not set"}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground truncate">{profile.headline || "Headline not set"}</p>
            </div>
            <Button variant={editing ? "ghost" : "outline"} size="icon" className="shrink-0 md:hidden" onClick={onToggleEdit}>
              {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </Button>
            <Button variant={editing ? "ghost" : "outline"} size="sm" className="shrink-0 hidden md:flex" onClick={onToggleEdit}>
              {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {editing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${kycBadge.color}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              KYC: {kycBadge.label}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
              {profile.account_type === "business" ? "Client" : "Partner"}
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
              {profile.oveercode}
            </span>
            {availability && (
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${availability.color}`}>
                {availability.emoji} {availability.label}
              </span>
            )}
          </div>

          {profile.city && (
            <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {profile.city}{profile.country ? `, ${profile.country}` : ""}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
