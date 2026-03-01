import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Products", href: "#fitur" },
  { label: "Platform", href: "#cara-kerja" },
  { label: "Solutions", href: "#partner" },
  { label: "Resources", href: "#vendor" },
  { label: "Pricing", href: "#pricing" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "hsla(0 0% 4% / 0.95)", backdropFilter: "blur(16px)", borderColor: "hsl(0 0% 18%)" }}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(0 79% 47%)" }}>
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-display text-lg font-bold text-white">Oveersea</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ color: "hsl(0 0% 60%)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(0, 0%, 60%)")}
            >
              {link.label}
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </a>
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
              <Link to="/auth">
                <button className="px-5 py-2 text-sm font-semibold rounded-lg border transition-colors" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>
                  See a demo
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

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
            <div className="px-6 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium py-2"
                  style={{ color: "hsl(0 0% 60%)" }}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid hsl(0 0% 18%)" }}>
                <Link to="/auth" className="flex-1">
                  <button className="w-full py-2 text-sm font-medium rounded-lg" style={{ color: "hsl(0 0% 60%)" }}>Login</button>
                </Link>
                <Link to="/auth" className="flex-1">
                  <button className="w-full py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: "hsl(0 0% 30%)", color: "white" }}>See a demo</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
