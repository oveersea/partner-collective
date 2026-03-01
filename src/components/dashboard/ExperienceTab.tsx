import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Briefcase, Building2, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Experience {
  id: string;
  company: string;
  position: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  status: string;
}

const ExperienceTab = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchExperiences();
  }, [user]);

  const fetchExperiences = async () => {
    const { data } = await supabase
      .from("user_experiences")
      .select("id, company, position, description, start_date, end_date, is_current, location, status")
      .eq("user_id", user!.id)
      .order("start_date", { ascending: false });
    setExperiences((data as Experience[]) || []);
    setLoading(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    try { return format(new Date(date), "MMM yyyy", { locale: idLocale }); } catch { return date; }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      {experiences.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-card-foreground mb-1">Belum ada pengalaman kerja</h3>
          <p className="text-sm text-muted-foreground">Pengalaman kerja Anda akan tampil di sini.</p>
        </motion.div>
      ) : (
        experiences.map((exp, i) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{exp.position}</h3>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                  </div>
                  {exp.is_current && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Saat ini</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {exp.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(exp.start_date)} — {exp.is_current ? "Sekarang" : formatDate(exp.end_date)}
                    </span>
                  )}
                  {exp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {exp.location}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default ExperienceTab;
