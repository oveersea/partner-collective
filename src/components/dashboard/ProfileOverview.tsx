import { motion } from "framer-motion";
import { Phone, Calendar, Briefcase, Award, Globe } from "lucide-react";

interface ProfileOverviewProps {
  profile: {
    professional_summary: string | null;
    bio: string | null;
    phone_number: string | null;
    years_of_experience: number | null;
    daily_rate: number | null;
    highest_education: string | null;
    linkedin_url: string | null;
    website_url: string | null;
    skills: string[] | null;
    opportunity_availability: string | null;
  };
}

const ProfileOverview = ({ profile }: ProfileOverviewProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-8 shadow-card">
        <h2 className="text-lg font-bold text-card-foreground mb-4">Tentang</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {profile.professional_summary || profile.bio || "Belum ada deskripsi."}
        </p>
        <div className="mt-6 space-y-3">
          {profile.phone_number && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-card-foreground">{profile.phone_number}</span>
            </div>
          )}
          {profile.years_of_experience != null && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-card-foreground">{profile.years_of_experience} tahun pengalaman</span>
            </div>
          )}
          {profile.daily_rate != null && (
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-card-foreground">Rp {profile.daily_rate?.toLocaleString("id-ID")}/hari</span>
            </div>
          )}
          {profile.highest_education && (
            <div className="flex items-center gap-3 text-sm">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-card-foreground">{profile.highest_education}</span>
            </div>
          )}
          {profile.linkedin_url && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-primary" />
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a>
            </div>
          )}
          {profile.website_url && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-primary" />
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{profile.website_url}</a>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-8 shadow-card">
        <h2 className="text-lg font-bold text-card-foreground mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <span key={skill} className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">{skill}</span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada skills ditambahkan.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileOverview;
