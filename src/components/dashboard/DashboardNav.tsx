import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-40">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">PartnerHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
