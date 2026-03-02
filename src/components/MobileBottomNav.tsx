import { Link, useLocation } from "react-router-dom";
import { Home, Layers, Briefcase, GraduationCap, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Services", icon: Layers, href: "/services" },
  { label: "Job", icon: Briefcase, href: "/matchmaking", center: true },
  { label: "Learning", icon: GraduationCap, href: "/learning" },
  { label: "Profile", icon: User, href: "/dashboard" },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="flex items-end justify-around px-2 pt-1 pb-2">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.href);

          if (item.center) {
            return (
              <Link
                key={item.label}
                to={item.href}
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

          return (
            <Link
              key={item.label}
              to={item.href}
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
