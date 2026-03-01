import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Briefcase, FolderKanban, GraduationCap, Users, UserSearch, Plus, Building2, Zap, CreditCard, Layers } from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import KYCBanner from "@/components/dashboard/KYCBanner";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ProfileEditForm from "@/components/dashboard/ProfileEditForm";
import ProfileOverview from "@/components/dashboard/ProfileOverview";
import ExperienceTab from "@/components/dashboard/ExperienceTab";
import EducationTab from "@/components/dashboard/EducationTab";
import PortfolioTab from "@/components/dashboard/PortfolioTab";
import TeamsTab from "@/components/dashboard/TeamsTab";
import ServicesTab from "@/components/dashboard/ServicesTab";

interface Profile {
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  phone_number: string | null;
  skills: string[] | null;
  kyc_status: string;
  account_type: string;
  oveercode: string;
  years_of_experience: number | null;
  daily_rate: number | null;
  monthly_salary_rate: number | null;
  expected_salary_currency: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  opportunity_availability: string | null;
  professional_summary: string | null;
  highest_education: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  languages: string | null;
  marital_status: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  postal_code: string | null;
}

const tabs = [
  { id: "profile", label: "Profil", icon: User },
  { id: "experience", label: "Pengalaman", icon: Briefcase },
  { id: "education", label: "Pendidikan", icon: GraduationCap },
  { id: "portfolio", label: "Portofolio", icon: FolderKanban },
  { id: "teams", label: "Tim", icon: Users },
  { id: "services", label: "Layanan", icon: Layers },
];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, headline, bio, avatar_url, city, country, phone_number, skills, kyc_status, account_type, oveercode, years_of_experience, daily_rate, monthly_salary_rate, expected_salary_currency, linkedin_url, website_url, opportunity_availability, professional_summary, highest_education, date_of_birth, gender, nationality, languages, marital_status, address, province, district, subdistrict, postal_code")
      .eq("user_id", user!.id)
      .single();

    if (error) {
      toast.error("Gagal memuat profil");
    } else {
      setProfile(data as Profile);
      setEditData(data as Profile);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    // Fields that require approval (excluding skills)
    const approvalFields = [
      "full_name", "headline", "city", "country", "phone_number",
      "daily_rate", "monthly_salary_rate", "expected_salary_currency",
      "highest_education", "opportunity_availability",
      "professional_summary", "bio", "linkedin_url", "website_url",
      "date_of_birth", "gender", "nationality", "languages", "marital_status",
      "address", "province", "district", "subdistrict", "postal_code",
    ];

    const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = [];

    for (const field of approvalFields) {
      const oldVal = String((profile as any)[field] ?? "");
      const newVal = String((editData as any)[field] ?? "");
      if (oldVal !== newVal) {
        changes.push({
          field_name: field,
          old_value: (profile as any)[field] != null ? oldVal : null,
          new_value: (editData as any)[field] != null ? newVal : null,
        });
      }
    }

    if (changes.length === 0) {
      toast.info("Tidak ada perubahan yang terdeteksi");
      setEditing(false);
      return;
    }

    const { error } = await supabase
      .from("profile_change_requests")
      .insert(changes.map((c) => ({ ...c, user_id: user.id })));

    if (error) {
      toast.error("Gagal mengirim perubahan");
    } else {
      toast.success(`${changes.length} perubahan dikirim untuk persetujuan admin`);
      setEditing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <div className="w-full px-6 py-8">
        {/* KYC Banner */}
        <KYCBanner kycStatus={profile.kyc_status} />

        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          editing={editing}
          onToggleEdit={() => {
            if (editing) { setEditing(false); setEditData(profile); }
            else { setEditing(true); setActiveTab("profile"); }
          }}
        />

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/hiring-request">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
              <UserSearch className="w-4 h-4" />
              Hiring Request
            </button>
          </Link>
          <Link to="/project-request">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
              <FolderKanban className="w-4 h-4" />
              Project Request
            </button>
          </Link>
          <Link to="/vendor-registration">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
              <Building2 className="w-4 h-4" />
              Registrasi Vendor
            </button>
          </Link>
          <Link to="/matchmaking">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
              <Zap className="w-4 h-4" />
              Matchmaking
            </button>
          </Link>
          <Link to="/learning">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
              <GraduationCap className="w-4 h-4" />
              Learning
            </button>
          </Link>
          <Link to="/credit-balance">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
              <CreditCard className="w-4 h-4" />
              Kredit & Saldo
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-6 mb-6">
          <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (editing && tab.id !== "profile") setEditing(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          editing ? (
            <ProfileEditForm
              editData={editData}
              onChange={setEditData}
              onSave={handleSave}
              onCancel={() => { setEditing(false); setEditData(profile); }}
            />
          ) : (
            <ProfileOverview profile={profile} />
          )
        )}
        {activeTab === "experience" && <ExperienceTab />}
        {activeTab === "education" && <EducationTab />}
        {activeTab === "portfolio" && <PortfolioTab />}
        {activeTab === "teams" && <TeamsTab />}
        {activeTab === "services" && <ServicesTab />}
      </div>
    </div>
  );
};

export default Dashboard;
