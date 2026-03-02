import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, CheckCircle2, User, Mail, Phone, MapPin, Calendar,
  Briefcase, FileText, Sparkles, ShieldCheck, ArrowRight, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { z } from "zod";

const quoteSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(8, "Phone must be at least 8 digits").max(20),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  category: z.string().min(1, "Category is required"),
  skills_required: z.array(z.string().trim()).min(1, "At least 1 skill is required"),
  budget_min: z.number().min(0).nullable(),
  budget_max: z.number().min(0).nullable(),
  deadline: z.string().optional(),
  is_remote: z.boolean(),
  location: z.string().max(200).optional(),
  project_scope: z.string().max(2000).optional(),
  project_duration: z.string().optional(),
  demand_type: z.enum(["partner", "team"]),
});

const categories = [
  "Web Development", "Mobile Development", "UI/UX Design", "Data Science",
  "DevOps", "Cloud", "Cybersecurity", "AI/ML", "Digital Marketing",
  "Content Writing", "Video Production", "Consulting", "Other",
];

const currencies = [
  { value: "IDR", label: "IDR (Rp)", symbol: "Rp" },
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "SGD", label: "SGD (S$)", symbol: "S$" },
];

const durations = [
  { value: "1-2 weeks", label: "1-2 Weeks" },
  { value: "1 month", label: "1 Month" },
  { value: "2-3 months", label: "2-3 Months" },
  { value: "3-6 months", label: "3-6 Months" },
  { value: "6+ months", label: "6+ Months" },
];

const steps = [
  { id: 1, label: "Contact Info", icon: User },
  { id: 2, label: "Project Details", icon: Briefcase },
  { id: 3, label: "Review & Submit", icon: Send },
];

const RequestQuote = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    title: "",
    description: "",
    category: "",
    skillsInput: "",
    skills_required: [] as string[],
    budget_min: "",
    budget_max: "",
    deadline: "",
    is_remote: true,
    location: "",
    project_scope: "",
    project_duration: "",
    demand_type: "partner" as "partner" | "team",
    currency: "IDR",
  });

  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const addSkill = () => {
    const skill = form.skillsInput.trim();
    if (skill && !form.skills_required.includes(skill)) {
      set("skills_required", [...form.skills_required, skill]);
      set("skillsInput", "");
    }
  };

  const removeSkill = (skill: string) => {
    set("skills_required", form.skills_required.filter((s) => s !== skill));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) errs.full_name = "Full name is required";
    if (!form.email.trim() || !z.string().email().safeParse(form.email).success) errs.email = "Valid email is required";
    if (!form.phone.trim() || form.phone.trim().length < 8) errs.phone = "Valid phone number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim() || form.title.trim().length < 3) errs.title = "Project title is required (min 3 chars)";
    if (!form.description.trim() || form.description.trim().length < 10) errs.description = "Description is required (min 10 chars)";
    if (!form.category) errs.category = "Category is required";
    if (form.skills_required.length === 0) errs.skills_required = "At least 1 skill is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const parsed = quoteSchema.safeParse({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      title: form.title,
      description: form.description,
      category: form.category,
      skills_required: form.skills_required,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      deadline: form.deadline || undefined,
      is_remote: form.is_remote,
      location: form.location,
      project_scope: form.project_scope,
      project_duration: form.project_duration || undefined,
      demand_type: form.demand_type,
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
      const { data, error } = await supabase.functions.invoke("request-quote", {
        body: {
          ...parsed.data,
          currency: form.currency,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResultMsg(data.message);
      setIsNewUser(data.is_new_user);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const curSymbol = currencies.find((c) => c.value === form.currency)?.symbol || "Rp";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg mx-auto text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-3">Request Submitted!</h1>
                <p className="text-muted-foreground mb-6">{resultMsg}</p>

                {isNewUser && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-left mb-6">
                    <p className="font-medium text-foreground mb-1">🎉 Account Created</p>
                    <p className="text-muted-foreground">
                      We've created an account for <span className="font-medium text-foreground">{form.email}</span>.
                      Check your email for a password reset link to set up your login.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Link to="/">
                    <Button variant="outline">Back to Home</Button>
                  </Link>
                  <Link to="/auth">
                    <Button>Login to Dashboard</Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="text-center mb-10">
                  <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">Request a Quote</h1>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Tell us about your project and we'll match you with the best talent. No login required.
                  </p>
                </div>

                {/* Step Indicator */}
                <div className="max-w-2xl mx-auto mb-10">
                  <div className="flex items-center justify-between">
                    {steps.map((s, i) => (
                      <div key={s.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                              step >= s.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                          </div>
                          <span className={`text-xs mt-2 font-medium ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}>
                            {s.label}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-3 mt-[-20px] ${step > s.id ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
                  {/* Form Area */}
                  <div className="lg:col-span-2">
                    <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
                      <AnimatePresence mode="wait">
                        {/* Step 1: Contact Info */}
                        {step === 1 && (
                          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <div>
                              <h2 className="text-lg font-semibold text-foreground mb-1">Contact Information</h2>
                              <p className="text-sm text-muted-foreground">We'll use this to create or match your account</p>
                            </div>

                            <div>
                              <Label className="text-card-foreground flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" /> Full Name *
                              </Label>
                              <Input className="mt-1.5" placeholder="John Doe" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
                              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
                            </div>

                            <div>
                              <Label className="text-card-foreground flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary" /> Email *
                              </Label>
                              <Input className="mt-1.5" type="email" placeholder="john@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                            </div>

                            <div>
                              <Label className="text-card-foreground flex items-center gap-2">
                                <Phone className="w-4 h-4 text-primary" /> Phone Number *
                              </Label>
                              <Input className="mt-1.5" type="tel" placeholder="+62 812 3456 7890" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm">
                              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                              <p className="text-muted-foreground">
                                Your data is secure. If you already have an account, the project will be linked automatically.
                              </p>
                            </div>

                            <div className="flex justify-end">
                              <Button onClick={nextStep} className="gap-2">
                                Next <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 2: Project Details */}
                        {step === 2 && (
                          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <div>
                              <h2 className="text-lg font-semibold text-foreground mb-1">Project Details</h2>
                              <p className="text-sm text-muted-foreground">Tell us about what you need</p>
                            </div>

                            {/* Demand Type */}
                            <div>
                              <Label className="text-card-foreground">Looking for Partner or Team?</Label>
                              <div className="grid grid-cols-2 gap-3 mt-1.5">
                                <button type="button" onClick={() => set("demand_type", "partner")} className={`p-4 rounded-xl border text-center transition-all ${form.demand_type === "partner" ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                                  <span className="text-2xl">👤</span>
                                  <p className="font-semibold text-sm text-card-foreground mt-1">Partner</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">Individual freelancer</p>
                                </button>
                                <button type="button" onClick={() => set("demand_type", "team")} className={`p-4 rounded-xl border text-center transition-all ${form.demand_type === "team" ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                                  <span className="text-2xl">👥</span>
                                  <p className="font-semibold text-sm text-card-foreground mt-1">Team</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">Collaborative team</p>
                                </button>
                              </div>
                            </div>

                            {/* Title */}
                            <div>
                              <Label className="text-card-foreground">Project Title *</Label>
                              <Input className="mt-1.5" placeholder="e.g. E-Commerce Website Redesign" value={form.title} onChange={(e) => set("title", e.target.value)} />
                              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                            </div>

                            {/* Category */}
                            <div>
                              <Label className="text-card-foreground">Category *</Label>
                              <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.category} onChange={(e) => set("category", e.target.value)}>
                                <option value="">Select category</option>
                                {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                              </select>
                              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
                            </div>

                            {/* Description */}
                            <div>
                              <Label className="text-card-foreground">Project Description *</Label>
                              <Textarea className="mt-1.5" rows={4} placeholder="Describe the project scope, deliverables, and expectations..." value={form.description} onChange={(e) => set("description", e.target.value)} />
                              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                            </div>

                            {/* Skills */}
                            <div>
                              <Label className="text-card-foreground">Required Skills *</Label>
                              <div className="flex gap-2 mt-1.5">
                                <Input placeholder="Add skill, press Enter" value={form.skillsInput} onChange={(e) => set("skillsInput", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                                <Button type="button" variant="outline" onClick={addSkill} size="sm">+</Button>
                              </div>
                              {form.skills_required.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {form.skills_required.map((skill) => (
                                    <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                                      {skill}
                                      <button onClick={() => removeSkill(skill)} className="hover:text-destructive ml-0.5">&times;</button>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {errors.skills_required && <p className="text-xs text-destructive mt-1">{errors.skills_required}</p>}
                            </div>

                            {/* Scope */}
                            <div>
                              <Label className="text-card-foreground">Scope of Work (optional)</Label>
                              <Textarea className="mt-1.5" rows={3} placeholder="Detail the scope, milestones, and deliverables..." value={form.project_scope} onChange={(e) => set("project_scope", e.target.value)} />
                            </div>

                            {/* Budget */}
                            <div>
                              <Label className="text-card-foreground">Budget</Label>
                              <div className="flex gap-2 mt-1.5">
                                <select className="h-10 px-2 rounded-md border border-input bg-background text-sm w-[100px] shrink-0" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                                  {currencies.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                                </select>
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{curSymbol}</span>
                                  <Input className="pl-10" type="number" placeholder="Min" value={form.budget_min} onChange={(e) => set("budget_min", e.target.value)} />
                                </div>
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{curSymbol}</span>
                                  <Input className="pl-10" type="number" placeholder="Max" value={form.budget_max} onChange={(e) => set("budget_max", e.target.value)} />
                                </div>
                              </div>
                            </div>

                            {/* Duration & Deadline */}
                            <div className="grid md:grid-cols-2 gap-5">
                              <div>
                                <Label className="text-card-foreground">Estimated Duration</Label>
                                <select className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.project_duration} onChange={(e) => set("project_duration", e.target.value)}>
                                  <option value="">Select duration</option>
                                  {durations.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                                </select>
                              </div>
                              <div>
                                <Label className="text-card-foreground">Deadline</Label>
                                <div className="relative mt-1.5">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-10" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                                </div>
                              </div>
                            </div>

                            {/* Work Mode */}
                            <div>
                              <Label className="text-card-foreground">Work Mode</Label>
                              <div className="grid grid-cols-2 gap-3 mt-1.5">
                                <button type="button" onClick={() => set("is_remote", true)} className={`p-2.5 rounded-xl border text-sm font-medium transition-all text-center ${form.is_remote ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                                  🌍 Remote
                                </button>
                                <button type="button" onClick={() => set("is_remote", false)} className={`p-2.5 rounded-xl border text-sm font-medium transition-all text-center ${!form.is_remote ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                                  🏢 On-site
                                </button>
                              </div>
                            </div>

                            {!form.is_remote && (
                              <div>
                                <Label className="text-card-foreground">Location</Label>
                                <div className="relative mt-1.5">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-10" placeholder="Jakarta, Indonesia" value={form.location} onChange={(e) => set("location", e.target.value)} />
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <Button variant="outline" onClick={prevStep}>Back</Button>
                              <Button onClick={nextStep} className="gap-2">
                                Review <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 3: Review & Submit */}
                        {step === 3 && (
                          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div>
                              <h2 className="text-lg font-semibold text-foreground mb-1">Review & Submit</h2>
                              <p className="text-sm text-muted-foreground">Please review your information before submitting</p>
                            </div>

                            {/* Contact Summary */}
                            <div className="rounded-xl border border-border p-5 space-y-3">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" /> Contact Info
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground text-xs">Name</p>
                                  <p className="text-foreground font-medium">{form.full_name}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Email</p>
                                  <p className="text-foreground font-medium">{form.email}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Phone</p>
                                  <p className="text-foreground font-medium">{form.phone}</p>
                                </div>
                              </div>
                            </div>

                            {/* Project Summary */}
                            <div className="rounded-xl border border-border p-5 space-y-3">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" /> Project Details
                              </h3>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground text-xs">Title</p>
                                  <p className="text-foreground font-medium">{form.title}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Category</p>
                                  <p className="text-foreground font-medium">{form.category}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Description</p>
                                  <p className="text-foreground">{form.description}</p>
                                </div>
                                {form.skills_required.length > 0 && (
                                  <div>
                                    <p className="text-muted-foreground text-xs mb-1">Skills</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {form.skills_required.map((s) => (
                                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Type</p>
                                    <p className="text-foreground font-medium">{form.demand_type === "partner" ? "👤 Partner" : "👥 Team"}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Work Mode</p>
                                    <p className="text-foreground font-medium">{form.is_remote ? "🌍 Remote" : "🏢 On-site"}</p>
                                  </div>
                                </div>
                                {(form.budget_min || form.budget_max) && (
                                  <div>
                                    <p className="text-muted-foreground text-xs">Budget</p>
                                    <p className="text-foreground font-medium">
                                      {form.budget_min ? `${curSymbol} ${Number(form.budget_min).toLocaleString("id-ID")}` : "—"}
                                      {" - "}
                                      {form.budget_max ? `${curSymbol} ${Number(form.budget_max).toLocaleString("id-ID")}` : "—"}
                                    </p>
                                  </div>
                                )}
                                {form.project_duration && (
                                  <div>
                                    <p className="text-muted-foreground text-xs">Duration</p>
                                    <p className="text-foreground font-medium">{form.project_duration}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* What happens next */}
                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm">
                              <p className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" /> What happens next?
                              </p>
                              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                <li>Our team reviews your project within 24 hours</li>
                                <li>We match you with the best talent for your needs</li>
                                <li>You receive a curated proposal with matched candidates</li>
                                <li>After confirmation, collaboration begins</li>
                              </ol>
                            </div>

                            <div className="flex justify-between">
                              <Button variant="outline" onClick={prevStep}>Back</Button>
                              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                                {submitting ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                ) : (
                                  <><Send className="w-4 h-4" /> Submit Request</>
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div>
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24 space-y-5">
                      <h3 className="text-sm font-semibold text-foreground">Why Oveersea?</h3>
                      <div className="space-y-4">
                        {[
                          { icon: Sparkles, title: "AI-Powered Matching", desc: "We match you with talent using AI skill scoring" },
                          { icon: ShieldCheck, title: "Verified Talent", desc: "All talent pass KYC & competency assessment" },
                          { icon: Clock, title: "Fast Turnaround", desc: "Get matched within 24 hours of submission" },
                          { icon: FileText, title: "No Commitment", desc: "Request a quote for free, no obligations" },
                        ].map((item) => (
                          <div key={item.title} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <item.icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {form.title && (
                        <>
                          <div className="border-t border-border pt-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Project Summary</h3>
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Title</p>
                                <p className="text-foreground font-medium">{form.title}</p>
                              </div>
                              {form.category && (
                                <div>
                                  <p className="text-muted-foreground text-xs">Category</p>
                                  <p className="text-foreground font-medium">{form.category}</p>
                                </div>
                              )}
                              {form.skills_required.length > 0 && (
                                <div>
                                  <p className="text-muted-foreground text-xs mb-1">Skills</p>
                                  <div className="flex flex-wrap gap-1">
                                    {form.skills_required.map((s) => (
                                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestQuote;
