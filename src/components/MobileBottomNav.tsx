import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Layers, Briefcase, GraduationCap, User, LayoutGrid, UserSearch, FolderKanban, Building2, Zap, CreditCard, Shield, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const defaultNav = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Services", icon: Layers, href: "/services" },
  { label: "Job", icon: Briefcase, href: "/matchmaking", center: true },
  { label: "Learning", icon: GraduationCap, href: "/learning" },
  { label: "Profile", icon: User, href: "/dashboard" },
];

const dashboardMenuItems = [
  { label: "Experience", icon: Briefcase, href: "/dashboard?tab=experience" },
  { label: "Education", icon: GraduationCap, href: "/dashboard?tab=education" },
  { label: "Portfolio", icon: FolderKanban, href: "/dashboard?tab=portfolio" },
  { label: "Teams", icon: Users, href: "/dashboard?tab=teams" },
  { label: "Services", icon: Layers, href: "/dashboard?tab=services" },
  { label: "Hiring Request", icon: UserSearch, href: "/hiring-request" },
  { label: "Project Request", icon: FolderKanban, href: "/project-request" },
  { label: "Vendor", icon: Building2, href: "/vendor-registration" },
  { label: "Matchmaking", icon: Zap, href: "/matchmaking" },
  { label: "Credits", icon: CreditCard, href: "/credit-balance" },
  { label: "KYC", icon: Shield, href: "/kyc" },
];

const dashboardRoutes = ["/dashboard", "/hiring-request", "/project-request", "/vendor-registration", "/credit-balance", "/kyc"];

const MobileBottomNav = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboard = dashboardRoutes.some(r => location.pathname.startsWith(r));

  const navItems = isDashboard
    ? [
        { label: "Home", icon: Home, href: "/" },
        { label: "Menu", icon: LayoutGrid, href: "__menu__" },
        { label: "Match", icon: Briefcase, href: "/matchmaking", center: true },
        { label: "Learning", icon: GraduationCap, href: "/learning" },
        { label: "Profile", icon: User, href: "/dashboard" },
      ]
    : defaultNav;

  const handleNavClick = (href: string) => {
    if (href === "__menu__") {
      setMenuOpen(prev => !prev);
      return;
    }
    setMenuOpen(false);
  };

  return (
    <>
      {/* Menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-20 left-4 right-4 bg-card rounded-2xl border border-border shadow-lg p-4 safe-area-bottom"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Quick Menu</h3>
                <button onClick={() => setMenuOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {dashboardMenuItems.map(item => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight">{item.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-end justify-around px-2 pt-1 pb-2">
          {navItems.map((item) => {
            const isMenu = item.href === "__menu__";
            const isActive = isMenu
              ? menuOpen
              : item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);

            if (item.center) {
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center -mt-5"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/90 text-primary-foreground"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1 font-medium",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            const Wrapper = isMenu ? "button" : Link;
            const wrapperProps = isMenu
              ? { onClick: () => handleNavClick("__menu__") }
              : { to: item.href, onClick: () => setMenuOpen(false) };

            return (
              <Wrapper
                key={item.label}
                {...(wrapperProps as any)}
                className="flex flex-col items-center gap-0.5 py-1 min-w-[48px]"
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Wrapper>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
