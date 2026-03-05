import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu, X, ChevronDown, ChevronRight, Building2, Users, Briefcase, Globe, Monitor, Search,
  GraduationCap, Award, FileText, Shield, Target, Layers, ArrowUpRight, Wallet,
  ClipboardCheck, CreditCard, UserCheck, FolderOpen, BarChart3, BookOpen,
  MapPin, Clock, Star, Handshake, Settings, Bell, CircleDollarSign, BadgeCheck,
  Compass, TrendingUp, Landmark, BriefcaseBusiness, ScrollText, PackageCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

interface SubMenuItem {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}

interface MasterItem {
  label: string;
  description: string;
  icon: React.ElementType;
  subItems: SubMenuItem[];
}

interface MegaMenuData {
  label: string;
  tagline: string;
  cta: { label: string; href: string };
  masters: MasterItem[];
}

const megaMenus: MegaMenuData[] = [
  {
    label: "Services",
    tagline: "End-to-end solutions for your talent & business needs",
    cta: { label: "View all services", href: "/services" },
    masters: [
      {
        label: "Talent Matchmaking",
        description: "Find top talent with AI",
        icon: Search,
        subItems: [
          { icon: Search, title: "Search Talent", description: "Find talent with filters & AI scoring", href: "/matchmaking" },
          { icon: Star, title: "Top Rated Talent", description: "Talent with the best ratings & reviews", href: "/matchmaking" },
          { icon: MapPin, title: "Talent by Location", description: "Filter talent by city & country", href: "/matchmaking" },
          { icon: BadgeCheck, title: "Verified Talent", description: "Talent who passed KYC & assessment", href: "/matchmaking" },
          { icon: BarChart3, title: "Skill Match Score", description: "View automatic skill match scores", href: "/matchmaking" },
          { icon: Users, title: "Talent Pool", description: "Save & manage your favorite talent list", href: "/matchmaking" },
        ],
      },
      {
        label: "Hiring Request",
        description: "Submit recruitment needs",
        icon: Briefcase,
        subItems: [
          { icon: Briefcase, title: "Create Hiring Request", description: "Submit a new recruitment request", href: "/hiring-request" },
          { icon: Clock, title: "Request Status", description: "Track your hiring request progress", href: "/hiring-request" },
          { icon: Users, title: "Selected Candidates", description: "View matched candidates", href: "/hiring-request" },
          { icon: Handshake, title: "SLA & Timeline", description: "Choose an SLA package that fits your needs", href: "/hiring-request" },
        ],
      },
      {
        label: "Project Request",
        description: "Post project requirements",
        icon: FolderOpen,
        subItems: [
          { icon: FileText, title: "Create Project Brief", description: "Post scope & project requirements", href: "/project-request" },
          { icon: PackageCheck, title: "Ongoing Projects", description: "Track projects in progress", href: "/project-request" },
          { icon: Users, title: "Project Team", description: "Manage your project team members", href: "/project-request" },
          { icon: ScrollText, title: "Project History", description: "View all completed projects", href: "/project-request" },
        ],
      },
      {
        label: "Vendor Registration",
        description: "Register as a verified vendor",
        icon: Building2,
        subItems: [
          { icon: Building2, title: "Register Vendor", description: "Register your business as a vendor", href: "/vendor-registration" },
          { icon: Shield, title: "Business Verification", description: "Upload documents & verify legality", href: "/vendor-registration" },
          { icon: Landmark, title: "Company Profile", description: "Manage your business profile & portfolio", href: "/vendor-registration" },
          { icon: BriefcaseBusiness, title: "Manage Offerings", description: "Set up services & packages offered", href: "/vendor-registration" },
        ],
      },
    ],
  },
  {
    label: "Platform",
    tagline: "Complete infrastructure for workforce management",
    cta: { label: "Go to platform", href: "/dashboard" },
    masters: [
      {
        label: "Dashboard",
        description: "Profile & activity control center",
        icon: Layers,
        subItems: [
          { icon: Layers, title: "Overview", description: "Profile summary, stats, & notifications", href: "/dashboard" },
          { icon: UserCheck, title: "Edit Profile", description: "Update personal info, photo, & bio", href: "/dashboard" },
          { icon: GraduationCap, title: "Education", description: "Manage formal education history", href: "/dashboard" },
          { icon: Briefcase, title: "Work Experience", description: "Add & edit career history", href: "/dashboard" },
          { icon: FolderOpen, title: "Portfolio", description: "Upload & showcase your best projects", href: "/dashboard" },
          { icon: Users, title: "Teams & Organizations", description: "View teams & organization affiliations", href: "/dashboard" },
        ],
      },
      {
        label: "KYC Verification",
        description: "Identity & credential verification",
        icon: Shield,
        subItems: [
          { icon: Shield, title: "Start Verification", description: "Upload ID, passport, or official documents", href: "/kyc" },
          { icon: BadgeCheck, title: "Verification Status", description: "Check your verification progress & results", href: "/kyc" },
          { icon: FileText, title: "Saved Documents", description: "Manage uploaded documents", href: "/kyc" },
          { icon: Bell, title: "KYC Notifications", description: "Updates on document review results", href: "/kyc" },
        ],
      },
      {
        label: "Credits & Balance",
        description: "Top up credits & manage wallet",
        icon: Wallet,
        subItems: [
          { icon: Wallet, title: "Wallet Balance", description: "View balance & deposit history", href: "/credit-balance" },
          { icon: CreditCard, title: "Top Up Credits", description: "Buy credit packages for services", href: "/credit-balance" },
          { icon: CircleDollarSign, title: "Transaction History", description: "Details of all incoming & outgoing transactions", href: "/credit-balance" },
          { icon: ScrollText, title: "Orders & Invoices", description: "View orders & payment receipts", href: "/credit-balance" },
        ],
      },
      {
        label: "All Features",
        description: "All Oveersea platform features",
        icon: Settings,
        subItems: [
          { icon: Settings, title: "All Features", description: "Explore the full platform capabilities", href: "/services" },
          { icon: Bell, title: "Notifications", description: "Notification & alert center", href: "/services" },
          { icon: Compass, title: "User Guide", description: "Tutorials & how to use the platform", href: "/services" },
          { icon: TrendingUp, title: "Insights & Analytics", description: "Performance data & activity statistics", href: "/services" },
        ],
      },
    ],
  },
  {
    label: "Learning",
    tagline: "Enhance your skills with structured programs & assessments",
    cta: { label: "Explore programs", href: "/learning" },
    masters: [
      {
        label: "Training Programs",
        description: "Courses & skill development",
        icon: GraduationCap,
        subItems: [
          { icon: GraduationCap, title: "All Programs", description: "Browse the training program catalog", href: "/learning" },
          { icon: BookOpen, title: "Online Courses", description: "Self-paced learning anytime, anywhere", href: "/learning" },
          { icon: Users, title: "Bootcamp", description: "Intensive programs with live mentors", href: "/learning" },
          { icon: Clock, title: "In Progress", description: "Continue programs you're enrolled in", href: "/learning" },
        ],
      },
      {
        label: "Assessment & Certification",
        description: "Test competency & earn credentials",
        icon: ClipboardCheck,
        subItems: [
          { icon: ClipboardCheck, title: "Start Assessment", description: "Take competency tests & skill scoring", href: "/learning?tab=assessments" },
          { icon: Award, title: "My Certificates", description: "View all earned certificates", href: "/learning?tab=certificates" },
          { icon: BarChart3, title: "Skill Score", description: "View your skill scores & analysis", href: "/learning?tab=skill-score" },
          { icon: FileText, title: "Test History", description: "Review previous assessment results", href: "/learning?tab=test-history" },
          { icon: BadgeCheck, title: "Competency Evidence", description: "Upload portfolio as skill proof", href: "/learning?tab=evidence" },
        ],
      },
      {
        label: "Career Path",
        description: "Map your ideal career journey",
        icon: Target,
        subItems: [
          { icon: Target, title: "Choose Career Path", description: "Explore available career paths", href: "/learning" },
          { icon: Compass, title: "Career Recommendations", description: "Career suggestions based on skills & interests", href: "/learning" },
          { icon: TrendingUp, title: "Skill Gap Analysis", description: "Identify skills that need improvement", href: "/learning" },
          { icon: Star, title: "Career Roadmap", description: "Your roadmap to your dream career", href: "/learning" },
        ],
      },
    ],
  },
  {
    label: "Jobs",
    tagline: "Find the best career opportunities through Oveersea",
    cta: { label: "View all jobs", href: "/matchmaking" },
    masters: [
      {
        label: "All Jobs",
        description: "Browse all available positions",
        icon: Briefcase,
        subItems: [
          { icon: Briefcase, title: "Browse Jobs", description: "View all currently open positions", href: "/matchmaking" },
          { icon: Star, title: "Recommended for You", description: "Jobs that match your profile", href: "/matchmaking" },
          { icon: Clock, title: "Recently Added", description: "Latest jobs this week", href: "/matchmaking" },
          { icon: Bell, title: "Job Alert", description: "Get notified about new jobs", href: "/matchmaking" },
        ],
      },
      {
        label: "Overseas Jobs",
        description: "International career opportunities",
        icon: Globe,
        subItems: [
          { icon: Globe, title: "All Countries", description: "Jobs from various countries", href: "/matchmaking" },
          { icon: MapPin, title: "Southeast Asia", description: "Singapore, Malaysia, Thailand, etc.", href: "/matchmaking" },
          { icon: MapPin, title: "Middle East", description: "UAE, Qatar, Saudi Arabia, etc.", href: "/matchmaking" },
          { icon: MapPin, title: "East Asia & Europe", description: "Japan, Korea, Germany, etc.", href: "/matchmaking" },
        ],
      },
      {
        label: "Remote & Freelance",
        description: "Work from anywhere",
        icon: Monitor,
        subItems: [
          { icon: Monitor, title: "Remote Full-time", description: "Full-time positions with remote work", href: "/matchmaking" },
          { icon: Clock, title: "Part-time", description: "Flexible part-time work", href: "/matchmaking" },
          { icon: FileText, title: "Freelance Project", description: "Short-term contract-based projects", href: "/matchmaking" },
          { icon: Handshake, title: "Contract", description: "Medium-term contract positions", href: "/matchmaking" },
        ],
      },
    ],
  },
  {
    label: "Resources",
    tagline: "Insights, research, and tools for better business decisions",
    cta: { label: "View all resources", href: "/services" },
    masters: [
      {
        label: "Insights & Analysis",
        description: "Current industry data & trends",
        icon: BarChart3,
        subItems: [
          { icon: BarChart3, title: "Industry Insight", description: "Latest labor market trend reports", href: "/services" },
          { icon: TrendingUp, title: "Salary Report", description: "Salary benchmark data by industry & role", href: "/services" },
          { icon: BookOpen, title: "Blog & Articles", description: "Educational articles about HR & talent", href: "/services" },
          { icon: Star, title: "Best Practices", description: "Tips & strategies for talent management", href: "/services" },
        ],
      },
      {
        label: "Surveys & Research",
        description: "Exclusive surveys & research",
        icon: ClipboardCheck,
        subItems: [
          { icon: ClipboardCheck, title: "Talent Survey", description: "Talent satisfaction & trend survey", href: "/services" },
          { icon: FileText, title: "Workforce Report", description: "Labor market research reports", href: "/services" },
          { icon: BarChart3, title: "Skill Demand Index", description: "Most popular skill demand index", href: "/services" },
          { icon: Globe, title: "Global Benchmark", description: "Comparison with international standards", href: "/services" },
        ],
      },
      {
        label: "Case Studies",
        description: "Our client success stories",
        icon: FolderOpen,
        subItems: [
          { icon: FolderOpen, title: "All Case Studies", description: "View all case studies & portfolio", href: "/case-studies" },
          { icon: Building2, title: "Enterprise", description: "Large company case studies", href: "/case-studies" },
          { icon: Briefcase, title: "Startup & SME", description: "Startup & SME case studies", href: "/case-studies" },
          { icon: Globe, title: "Cross-Border", description: "International placement case studies", href: "/case-studies" },
        ],
      },
      {
        label: "Assessment & Documents",
        description: "Tools & templates for business",
        icon: ScrollText,
        subItems: [
          { icon: ClipboardCheck, title: "Assessment Tools", description: "Ready-to-use competency test templates", href: "/services" },
          { icon: ScrollText, title: "Document Templates", description: "Contract, NDA, & HR document templates", href: "/services" },
          { icon: PackageCheck, title: "Compliance Checklist", description: "Labor compliance checklist", href: "/services" },
          { icon: Shield, title: "Legal Resources", description: "Labor regulation guides", href: "/services" },
        ],
      },
    ],
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { user } = useAuth();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: "hsla(0 0% 4% / 0.95)", backdropFilter: "blur(16px)", borderColor: "hsl(0 0% 18%)" }}
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img src={logoDark} alt="Oveersea" className="h-7 hidden dark:block" />
          <img src={logoDark} alt="Oveersea" className="h-7 block dark:hidden" />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {megaMenus.map((menu) => (
            <div key={menu.label} className="relative" onMouseEnter={() => setActiveMenu(menu.label)}>
              <button
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ color: activeMenu === menu.label ? "white" : "hsl(0 0% 60%)" }}
              >
                {menu.label}
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${activeMenu === menu.label ? "rotate-180" : ""}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <button className="px-5 py-2 text-sm font-semibold rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <span className="text-sm font-medium cursor-pointer transition-colors" style={{ color: "hsl(0 0% 60%)" }}>Login</span>
              </Link>
              <Link to="/request-quote">
                <button className="px-5 py-2 text-sm font-semibold rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>
                  Request Quote
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button - hidden, using bottom nav instead */}
      </div>

      {/* Mega Menu Dropdown */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="hidden md:block absolute left-0 right-0 border-t"
            style={{ background: "hsl(0 0% 100%)", borderColor: "hsl(0 0% 90%)" }}
            onMouseEnter={() => setActiveMenu(activeMenu)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            {megaMenus.filter(m => m.label === activeMenu).map((menu) => (
              <MegaMenuContent key={menu.label} menu={menu} onClose={() => setActiveMenu(null)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t"
            style={{ background: "hsl(0 0% 4%)", borderColor: "hsl(0 0% 18%)" }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {megaMenus.map((menu) => (
                <MobileMenuGroup key={menu.label} menu={menu} onClose={() => setIsOpen(false)} />
              ))}
              <div className="flex gap-3 pt-3 mt-2" style={{ borderTop: "1px solid hsl(0 0% 18%)" }}>
                <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                  <button className="w-full py-2 text-sm font-medium rounded-lg" style={{ color: "hsl(0 0% 60%)" }}>Login</button>
                </Link>
                <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                  <button className="w-full py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>Request Quote</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const MegaMenuContent = ({ menu, onClose }: { menu: MegaMenuData; onClose: () => void }) => {
  const [activeMaster, setActiveMaster] = useState(0);
  const currentMaster = menu.masters[activeMaster];

  return (
    <div>
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-0">
          {/* Left master menu */}
          <div className="col-span-3 border-r pr-6" style={{ borderColor: "hsl(0 0% 92%)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(0 79% 47%)" }}>
              {menu.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {menu.masters.map((master, index) => (
                <button
                  key={master.label}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150"
                  style={{
                    background: activeMaster === index ? "hsl(0 79% 47% / 0.07)" : "transparent",
                    color: activeMaster === index ? "hsl(0 79% 47%)" : "hsl(0 0% 30%)",
                  }}
                  onMouseEnter={() => setActiveMaster(index)}
                >
                  <master.icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{master.label}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid hsl(0 0% 92%)" }}>
              <Link
                to={menu.cta.href}
                className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: "hsl(0 79% 47%)" }}
                onClick={onClose}
              >
                {menu.cta.label} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right sub-menu */}
          <div className="col-span-9 pl-6">
            <div className="flex items-center gap-2 mb-4">
              <currentMaster.icon className="w-5 h-5" style={{ color: "hsl(0 79% 47%)" }} />
              <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 10%)" }}>
                {currentMaster.label}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(0 79% 47% / 0.08)", color: "hsl(0 79% 47%)" }}>
                {currentMaster.subItems.length} items
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: "hsl(0 0% 50%)" }}>
              {currentMaster.description}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMaster}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 gap-2"
              >
                {currentMaster.subItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="flex items-start gap-3 rounded-xl p-3 transition-all duration-150 hover:scale-[1.01]"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(0 0% 96%)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={onClose}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "hsl(0 79% 47% / 0.08)" }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: "hsl(0 79% 47%)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "hsl(0 0% 10%)" }}>
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(0 0% 50%)" }}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t" style={{ borderColor: "hsl(0 0% 92%)" }}>
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-sm" style={{ color: "hsl(0 0% 50%)" }}>
            {menu.tagline}
          </p>
          <Link
            to={menu.cta.href}
            className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "hsl(0 79% 47%)" }}
            onClick={onClose}
          >
            {menu.cta.label} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const MobileMenuGroup = ({ menu, onClose }: { menu: MegaMenuData; onClose: () => void }) => {
  const [open, setOpen] = useState(false);
  const [activeMaster, setActiveMaster] = useState<number | null>(null);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 text-sm font-medium"
        style={{ color: "hsl(0 0% 70%)" }}
      >
        {menu.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-2 pb-2 flex flex-col gap-0.5">
              {menu.masters.map((master, index) => (
                <div key={master.label}>
                  <button
                    onClick={() => setActiveMaster(activeMaster === index ? null : index)}
                    className="w-full flex items-center justify-between py-2 px-2 text-sm rounded-md"
                    style={{ color: activeMaster === index ? "hsl(0 79% 47%)" : "hsl(0 0% 55%)" }}
                  >
                    <span className="flex items-center gap-2">
                      <master.icon className="w-3.5 h-3.5" />
                      {master.label}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${activeMaster === index ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {activeMaster === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 pb-1 flex flex-col gap-0.5">
                          {master.subItems.map((item) => (
                            <Link
                              key={item.title}
                              to={item.href}
                              className="py-1.5 text-xs"
                              style={{ color: "hsl(0 0% 45%)" }}
                              onClick={onClose}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
