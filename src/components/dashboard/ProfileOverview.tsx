import { motion } from "framer-motion";
import { Phone, Calendar, Briefcase, Award, Globe, MapPin, User, Heart, Languages, DollarSign, GraduationCap } from "lucide-react";

interface ProfileOverviewProps {
  profile: {
    professional_summary: string | null;
    bio: string | null;
    phone_number: string | null;
    years_of_experience: number | null;
    daily_rate: number | null;
    monthly_salary_rate: number | null;
    expected_salary_currency: string | null;
    highest_education: string | null;
    linkedin_url: string | null;
    website_url: string | null;
    skills: string[] | null;
    opportunity_availability: string | null;
    date_of_birth: string | null;
    gender: string | null;
    nationality: string | null;
    languages: string | null;
    marital_status: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    district: string | null;
    subdistrict: string | null;
    postal_code: string | null;
    country: string | null;
  };
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3 text-sm">
    <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-card-foreground">{value}</p>
    </div>
  </div>
);

const availabilityLabel: Record<string, string> = {
  available: "Available",
  open: "Open to Opportunities",
  busy: "Busy",
  unavailable: "Not Available",
  not_available: "Not Available",
};

const genderLabel: Record<string, string> = {
  male: "Male",
  female: "Female",
};

const maritalLabel: Record<string, string> = {
  single: "Single",
  married: "Married",
  divorced: "Divorced",
  widowed: "Widowed",
};

const ProfileOverview = ({ profile }: ProfileOverviewProps) => {
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  const fullAddress = [profile.address, profile.subdistrict, profile.district, profile.city, profile.province, profile.country, profile.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* About */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-4 md:p-8 shadow-card">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">About</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {profile.professional_summary || profile.bio || "No description added yet."}
        </p>

        <div className="space-y-4">
          {profile.phone_number && <InfoRow icon={Phone} label="Phone" value={profile.phone_number} />}
          {profile.date_of_birth && <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(profile.date_of_birth)} />}
          {profile.gender && <InfoRow icon={User} label="Gender" value={genderLabel[profile.gender] || profile.gender} />}
          {profile.nationality && <InfoRow icon={Globe} label="Nationality" value={profile.nationality} />}
          {profile.marital_status && <InfoRow icon={Heart} label="Marital Status" value={maritalLabel[profile.marital_status] || profile.marital_status} />}
          {profile.languages && <InfoRow icon={Languages} label="Languages" value={profile.languages} />}
          {fullAddress && <InfoRow icon={MapPin} label="Address" value={fullAddress} />}
        </div>
      </motion.div>

      {/* Professional */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl border border-border p-4 md:p-8 shadow-card">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Professional</h2>

        <div className="space-y-4">
          {profile.years_of_experience != null && profile.years_of_experience > 0 && (
            <InfoRow icon={Briefcase} label="Experience" value={`${profile.years_of_experience} years`} />
          )}
          {profile.highest_education && <InfoRow icon={GraduationCap} label="Highest Education" value={profile.highest_education} />}
          {profile.opportunity_availability && (
            <InfoRow icon={Calendar} label="Availability" value={availabilityLabel[profile.opportunity_availability] || profile.opportunity_availability} />
          )}
          {profile.daily_rate != null && profile.daily_rate > 0 && (
            <InfoRow icon={DollarSign} label="Daily Rate" value={`Rp ${profile.daily_rate.toLocaleString("en-US")}/day`} />
          )}
          {profile.monthly_salary_rate != null && profile.monthly_salary_rate > 0 && (
            <InfoRow
              icon={DollarSign}
              label="Monthly Salary"
              value={`${profile.expected_salary_currency || "IDR"} ${profile.monthly_salary_rate.toLocaleString("en-US")}`}
            />
          )}
          {profile.linkedin_url && (
            <div className="flex items-start gap-3 text-sm">
              <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground text-xs">LinkedIn</span>
                <p><a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{profile.linkedin_url}</a></p>
              </div>
            </div>
          )}
          {profile.website_url && (
            <div className="flex items-start gap-3 text-sm">
              <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground text-xs">Website</span>
                <p><a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{profile.website_url}</a></p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Skills */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-4 md:p-8 shadow-card md:col-span-2">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <span key={skill} className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">{skill}</span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileOverview;
