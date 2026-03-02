import { Link } from "react-router-dom";
import { Shield, Clock, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface KYCBannerProps {
  kycStatus: string;
}

const KYCBanner = ({ kycStatus }: KYCBannerProps) => {
  if (kycStatus === "verified" || kycStatus === "approved") return null;

  const config: Record<string, { icon: typeof Shield; title: string; desc: string; color: string; borderColor: string }> = {
    unverified: {
      icon: Shield,
      title: "Identity Verification Required",
      desc: "Complete KYC verification to access all platform features.",
      color: "bg-destructive/10 text-destructive",
      borderColor: "border-destructive/20",
    },
    pending: {
      icon: Clock,
      title: "Verification In Progress",
      desc: "Your documents are being reviewed. Estimated 1-3 business days.",
      color: "bg-amber-500/10 text-amber-600",
      borderColor: "border-amber-500/20",
    },
    rejected: {
      icon: XCircle,
      title: "Verification Rejected",
      desc: "Your documents were rejected. Please resubmit valid documents.",
      color: "bg-destructive/10 text-destructive",
      borderColor: "border-destructive/20",
    },
  };

  const c = config[kycStatus] || config.unverified;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${c.borderColor} ${c.color.split(" ")[0]} p-3 md:p-5 mb-4 md:mb-6`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground text-sm">{c.title}</h3>
          <p className="text-xs text-muted-foreground">{c.desc}</p>
        </div>
        {kycStatus !== "pending" && (
          <Link to="/kyc">
            <Button size="sm" variant="outline" className="shrink-0">
              {kycStatus === "rejected" ? "Resubmit" : "Verify"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default KYCBanner;
