import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Briefcase, FolderKanban, GraduationCap, Users, UserSearch, Building2, Zap, CreditCard, Layers } from "lucide-react";
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
import CompanyTab from "@/components/dashboard/CompanyTab";

const CTA_ITEMS = [
  {
    icon: Building2,
    title: "Daftarkan Bisnis Anda sebagai Vendor",
    desc: "Bergabung sebagai vendor untuk menerima proyek, mengelola tim, dan mengembangkan bisnis Anda di platform kami.",
    label: "Daftar Vendor",
    href: "/vendor-registration",
  },
  {
    icon: Users,
    title: "Bentuk Tim Profesional Anda",
    desc: "Kumpulkan talenta terbaik dalam satu tim untuk mengerjakan proyek bersama dan tingkatkan peluang Anda.",
    label: "Buat Tim",
    href: "/dashboard?tab=teams",
  },
  {
    icon: Briefcase,
    title: "Buat Profil Perusahaan",
    desc: "Daftarkan perusahaan Anda untuk memposting lowongan kerja, mencari talenta, dan mengelola proses rekrutmen.",
    label: "Buat Perusahaan",
    href: "/dashboard?tab=company",
  },
];

const RotatingCtaBanner = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % CTA_ITEMS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const item = CTA_ITEMS[index];
  const Icon = item.icon;

  return (
    <div className="mt-8 md:mt-12">
      <Link to={item.href}>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-6 hover:bg-primary/10 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left transition-opacity duration-300">
            <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              {item.label}
            </span>
          </div>
        </div>
      </Link>
      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {CTA_ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); setIndex(i); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? "bg-primary w-4" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  );
};

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
  { id: "profile", label: "Profile", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "portfolio", label: "Portfolio", icon: FolderKanban },
  { id: "teams", label: "Teams", icon: Users },
  { id: "company", label: "Company", icon: Building2 },
  { id: "services", label: "Services", icon: Layers },
];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

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
      toast.error("Failed to load profile");
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
      toast.info("No changes detected");
      setEditing(false);
      return;
    }

    const { error } = await supabase
      .from("profile_change_requests")
      .insert(changes.map((c) => ({ ...c, user_id: user.id })));

    if (error) {
      toast.error("Failed to submit changes");
    } else {
      toast.success(`${changes.length} changes submitted for admin approval`);
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

      <div className="w-full px-4 py-4 md:px-6 md:py-8 pb-28 md:pb-8">
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
          onAvatarUpdated={(url) => setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev)}
        />

        {/* Quick Actions */}
        <div className="mt-4 md:mt-6 hidden md:flex overflow-x-auto scrollbar-hide gap-2 md:flex-wrap md:gap-3 -mx-4 px-4 md:mx-0 md:px-0">
          <Link to="/hiring-request" className="shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20 whitespace-nowrap">
              <UserSearch className="w-4 h-4" />
              Hiring
            </button>
          </Link>
          <Link to="/project-request" className="shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20 whitespace-nowrap">
              <FolderKanban className="w-4 h-4" />
              Project
            </button>
          </Link>
          <Link to="/matchmaking" className="shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20 whitespace-nowrap">
              <Zap className="w-4 h-4" />
              Matchmaking
            </button>
          </Link>
          <Link to="/learning" className="shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20 whitespace-nowrap">
              <GraduationCap className="w-4 h-4" />
              Learning
            </button>
          </Link>
          <Link to="/credit-balance" className="shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20 whitespace-nowrap">
              <CreditCard className="w-4 h-4" />
              Credits & Balance
            </button>
          </Link>
          <a href="https://oveersuite.com" className="shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20 whitespace-nowrap">
              <Layers className="w-4 h-4" />
              Oveersuite
            </button>
          </a>
        </div>

        {/* Tabs */}
        <div className="mt-4 md:mt-6 mb-4 md:mb-6">
          <div className="hidden md:flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto scrollbar-hide -mx-4 md:mx-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (editing && tab.id !== "profile") setEditing(false); }}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
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
        {activeTab === "company" && <CompanyTab />}

        {/* Rotating CTA Banner */}
        <RotatingCtaBanner />
      </div>
    </div>
  );
};

export default Dashboard;
