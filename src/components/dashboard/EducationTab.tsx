import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { GraduationCap, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  status: string;
}

const EducationTab = () => {
  const { user } = useAuth();
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      supabase
        .from("user_education")
        .select("id, institution, degree, field_of_study, start_date, end_date, description, status")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false })
        .then(({ data }) => {
          setEducations((data as Education[]) || []);
          setLoading(false);
        });
    }
  }, [user]);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    try { return format(new Date(date), "yyyy", { locale: idLocale }); } catch { return date; }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      {educations.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-card-foreground mb-1">Belum ada data pendidikan</h3>
          <p className="text-sm text-muted-foreground">Riwayat pendidikan Anda akan tampil di sini.</p>
        </motion.div>
      ) : (
        educations.map((edu, i) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground">{edu.institution}</h3>
                {(edu.degree || edu.field_of_study) && (
                  <p className="text-sm text-muted-foreground">
                    {[edu.degree, edu.field_of_study].filter(Boolean).join(" — ")}
                  </p>
                )}
                {edu.start_date && (
                  <span className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(edu.start_date)} — {edu.end_date ? formatDate(edu.end_date) : "Sekarang"}
                  </span>
                )}
                {edu.description && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{edu.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default EducationTab;
