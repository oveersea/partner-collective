import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserSearch, MapPin, Briefcase, Clock, Zap } from "lucide-react";
import DashboardBreadcrumb from "@/components/dashboard/DashboardBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { z } from "zod";

const hiringSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description must be at most 5000 characters"),
  required_skills: z.array(z.string().trim()).min(1, "At least 1 skill is required"),
  experience_min: z.number().min(0).max(50).nullable(),
  experience_max: z.number().min(0).max(50).nullable(),
  positions_count: z.number().min(1, "At least 1 position required").max(100),
  hiring_type: z.enum(["normal", "fast"]),
  work_mode: z.enum(["remote", "onsite", "hybrid"]),
  location: z.string().max(200).optional(),
  employment_type: z.enum(["fulltime", "parttime", "freelance", "contract"]),
});

const HiringRequest = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    skillsInput: "",
    required_skills: [] as string[],
    experience_min: "",
    experience_max: "",
    positions_count: "1",
    hiring_type: "normal" as "normal" | "fast",
    work_mode: "remote" as "remote" | "onsite" | "hybrid",
    location: "",
    employment_type: "fulltime" as "fulltime" | "parttime" | "freelance" | "contract",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const addSkill = () => {
    const skill = form.skillsInput.trim();
    if (skill && !form.required_skills.includes(skill)) {
      set("required_skills", [...form.required_skills, skill]);
      set("skillsInput", "");
    }
  };

  const removeSkill = (skill: string) => {
    set("required_skills", form.required_skills.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    const parsed = hiringSchema.safeParse({
      title: form.title,
      description: form.description,
      required_skills: form.required_skills,
      experience_min: form.experience_min ? Number(form.experience_min) : null,
      experience_max: form.experience_max ? Number(form.experience_max) : null,
      positions_count: Number(form.positions_count) || 1,
      hiring_type: form.hiring_type,
      work_mode: form.work_mode,
      location: form.location,
      employment_type: form.employment_type,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      toast.error("Please review the form");
      return;
    }

    setSubmitting(true);
    try {
      const { data: existing } = await supabase
        .from("client_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      let clientId = existing?.id;
      if (!clientId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user!.id)
          .single();

        const { data: newClient, error: clientErr } = await supabase
          .from("client_profiles")
          .insert({ user_id: user!.id, company_name: profile?.full_name || "My Company" })
          .select("id")
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      const creditCost = parsed.data.hiring_type === "fast" ? 10 * parsed.data.positions_count : parsed.data.positions_count;

      const { error } = await supabase.from("hiring_requests").insert({
        client_id: clientId,
        title: parsed.data.title,
        description: parsed.data.description,
        required_skills: parsed.data.required_skills,
        experience_min: parsed.data.experience_min,
        experience_max: parsed.data.experience_max,
        positions_count: parsed.data.positions_count,
        hiring_type: parsed.data.hiring_type === "normal" ? "regular" : "fast",
        credit_cost: creditCost,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Hiring request created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create hiring request");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  const creditCost = form.hiring_type === "fast" ? 10 * (Number(form.positions_count) || 1) : Number(form.positions_count) || 1;
  const employmentLabels: Record<string, string> = { fulltime: "Full-time", parttime: "Part-time", freelance: "Freelance", contract: "Contract" };
  const workModeLabels: Record<string, string> = { remote: "🌍 Remote", onsite: "🏢 On-site", hybrid: "🔄 Hybrid" };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <DashboardBreadcrumb items={[{ label: "Hiring Request" }]} />
      <div className="w-full px-6 py-8">

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[70%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">Hiring Request</h1>
              <p className="text-muted-foreground text-sm">Find a partner or team to work with you</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6">
              {/* Title */}
              <div>
                <Label className="text-card-foreground">Position Title *</Label>
                <Input className="mt-1.5" placeholder="e.g. Senior React Developer" value={form.title} onChange={(e) => set("title", e.target.value)} />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <Label className="text-card-foreground">Job Description *</Label>
                <Textarea className="mt-1.5" rows={4} placeholder="Describe responsibilities, qualifications, and position details..." value={form.description} onChange={(e) => set("description", e.target.value)} />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>

              {/* Employment Type */}
              <div>
                <Label className="text-card-foreground">Employment Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                  {[
                    { value: "fulltime", label: "Full-time", icon: Briefcase },
                    { value: "parttime", label: "Part-time", icon: Clock },
                    { value: "freelance", label: "Freelance", icon: UserSearch },
                    { value: "contract", label: "Contract", icon: Briefcase },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("employment_type", opt.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${
                        form.employment_type === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <opt.icon className="w-4 h-4 mx-auto mb-1" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Mode */}
              <div>
                <Label className="text-card-foreground">Work Mode</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {[
                    { value: "remote", label: "Remote", icon: "🌍" },
                    { value: "onsite", label: "On-site", icon: "🏢" },
                    { value: "hybrid", label: "Hybrid", icon: "🔄" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("work_mode", opt.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${
                        form.work_mode === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <p className="mt-0.5">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              {form.work_mode !== "remote" && (
                <div>
                  <Label className="text-card-foreground">Location</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Jakarta, Indonesia" value={form.location} onChange={(e) => set("location", e.target.value)} />
                  </div>
                </div>
              )}

              {/* Skills */}
              <div>
                <Label className="text-card-foreground">Required Skills *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder="Add skill, press Enter"
                    value={form.skillsInput}
                    onChange={(e) => set("skillsInput", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addSkill} size="sm">+</Button>
                </div>
                {form.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.required_skills.map((skill) => (
                      <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-destructive ml-0.5">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.required_skills && <p className="text-xs text-destructive mt-1">{errors.required_skills}</p>}
              </div>

              {/* Experience & Positions */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-card-foreground">Min Experience (years)</Label>
                  <Input className="mt-1.5" type="number" min="0" max="50" placeholder="0" value={form.experience_min} onChange={(e) => set("experience_min", e.target.value)} />
                </div>
                <div>
                  <Label className="text-card-foreground">Max Experience (years)</Label>
                  <Input className="mt-1.5" type="number" min="0" max="50" placeholder="10" value={form.experience_max} onChange={(e) => set("experience_max", e.target.value)} />
                </div>
                <div>
                  <Label className="text-card-foreground">Number of Positions</Label>
                  <Input className="mt-1.5" type="number" min="1" max="100" value={form.positions_count} onChange={(e) => set("positions_count", e.target.value)} />
                </div>
              </div>

              {/* Hiring Type (SLA) */}
              <div>
                <Label className="text-card-foreground">Search Speed</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => set("hiring_type", "normal")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.hiring_type === "normal"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Clock className={`w-5 h-5 mb-2 ${form.hiring_type === "normal" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm text-card-foreground">Normal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">SLA 14 days • 1 credit/position</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => set("hiring_type", "fast")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.hiring_type === "fast"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Zap className={`w-5 h-5 mb-2 ${form.hiring_type === "fast" ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm text-card-foreground">Fast Track</p>
                    <p className="text-xs text-muted-foreground mt-0.5">SLA 3 days • 10 credits/position</p>
                  </button>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Create Hiring Request"}
              </Button>
            </motion.div>
          </div>

          {/* Right: Summary sidebar */}
          <div className="lg:w-[30%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Hiring Summary</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Position Title</p>
                  <p className="text-card-foreground font-medium">{form.title || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Employment Type</p>
                  <p className="text-card-foreground font-medium">{employmentLabels[form.employment_type]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Work Mode</p>
                  <p className="text-card-foreground font-medium">{workModeLabels[form.work_mode]}</p>
                </div>
                {form.required_skills.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {form.required_skills.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(form.experience_min || form.experience_max) && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Experience</p>
                    <p className="text-card-foreground font-medium">
                      {form.experience_min || "0"} - {form.experience_max || "∞"} years
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Number of Positions</p>
                  <p className="text-card-foreground font-medium">{form.positions_count || "1"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Speed</p>
                  <p className="text-card-foreground font-medium">{form.hiring_type === "fast" ? "⚡ Fast Track" : "🕐 Normal"}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated credits:</span>
                    <span className="font-semibold text-card-foreground">{creditCost} credits</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiringRequest;
