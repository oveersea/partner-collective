import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface InsightService {
  id: string;
  title: string;
  tagline: string | null;
  icon_name: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
}

interface Survey {
  id: string;
  title: string;
  category: string | null;
  status: string;
  total_responses: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

interface CaseStudy {
  id: string;
  title: string;
  company_name: string;
  industry: string | null;
  description: string | null;
  cta_label: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const AdminInsights = () => {
  const [services, setServices] = useState<InsightService[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"services" | "surveys" | "cases">("services");
  const [search, setSearch] = useState("");
  const [svcPage, setSvcPage] = useState(1);
  const [surveyPage, setSurveyPage] = useState(1);
  const [casePage, setCasePage] = useState(1);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setSvcPage(1); setSurveyPage(1); setCasePage(1); }, [search]);

  const fetchData = async () => {
    const [svcRes, survRes, caseRes] = await Promise.all([
      (supabase as any).from("insight_services").select("id, title, tagline, icon_name, sort_order, is_active, created_at").order("sort_order", { ascending: true }),
      (supabase as any).from("surveys").select("id, title, category, status, total_responses, starts_at, ends_at, created_at").order("created_at", { ascending: false }),
      (supabase as any).from("case_studies").select("id, title, company_name, industry, description, cta_label, sort_order, is_active, is_featured, created_at").order("sort_order", { ascending: true }),
    ]);

    if (svcRes.data) setServices(svcRes.data as unknown as InsightService[]);
    if (survRes.data) setSurveys(survRes.data as unknown as Survey[]);
    if (caseRes.data) setCaseStudies(caseRes.data as unknown as CaseStudy[]);
    setLoading(false);
  };

  const toggleServiceActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase.from("insight_services").update({ is_active: !current } as any).eq("id", id);
    if (error) toast.error("Failed to update status");
    else { toast.success("Status updated"); fetchData(); }
  };

  const toggleSurveyStatus = async (id: string, current: string) => {
    const next = current === "active" ? "closed" : "active";
    const { error } = await supabase.from("surveys").update({ status: next } as any).eq("id", id);
    if (error) toast.error("Failed to update status");
    else { toast.success("Status updated"); fetchData(); }
  };

  const toggleCaseActive = async (id: string, current: boolean | null) => {
    const { error } = await (supabase as any).from("case_studies").update({ is_active: !current }).eq("id", id);
    if (error) toast.error("Failed to update status");
    else { toast.success("Status updated"); fetchData(); }
  };

  const toggleCaseFeatured = async (id: string, current: boolean | null) => {
    const { error } = await (supabase as any).from("case_studies").update({ is_featured: !current }).eq("id", id);
    if (error) toast.error("Failed to update featured");
    else { toast.success("Featured updated"); fetchData(); }
  };

  const filteredSvc = services.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  const filteredSurveys = surveys.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  const filteredCases = caseStudies.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const svcTotalPages = Math.max(1, Math.ceil(filteredSvc.length / PAGE_SIZE));
  const surveyTotalPages = Math.max(1, Math.ceil(filteredSurveys.length / PAGE_SIZE));
  const caseTotalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const pagedSvc = filteredSvc.slice((svcPage - 1) * PAGE_SIZE, svcPage * PAGE_SIZE);
  const pagedSurveys = filteredSurveys.slice((surveyPage - 1) * PAGE_SIZE, surveyPage * PAGE_SIZE);
  const pagedCases = filteredCases.slice((casePage - 1) * PAGE_SIZE, casePage * PAGE_SIZE);

  const statusBadge = (s: string) => {
    if (s === "active") return "bg-primary/10 text-primary";
    if (s === "draft") return "bg-muted text-muted-foreground";
    if (s === "closed") return "bg-destructive/10 text-destructive";
    return "bg-amber-500/10 text-amber-600";
  };

  const PaginationBar = ({ page, totalPages, total, onPrev, onNext }: { page: number; totalPages: number; total: number; onPrev: () => void; onNext: () => void }) => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
        <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Insights & Surveys</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={tab === "services" ? "default" : "outline"} onClick={() => setTab("services")}>
          Insight Services ({services.length})
        </Button>
        <Button size="sm" variant={tab === "surveys" ? "default" : "outline"} onClick={() => setTab("surveys")}>
          Surveys ({surveys.length})
        </Button>
        <Button size="sm" variant={tab === "cases" ? "default" : "outline"} onClick={() => setTab("cases")}>
          Case Studies ({caseStudies.length})
        </Button>
      </div>

      {/* ========== INSIGHT SERVICES ========== */}
      {tab === "services" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tagline</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Icon</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedSvc.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No data found</td></tr>
                ) : (
                  pagedSvc.map((s) => (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{s.title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{s.tagline || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{s.icon_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{s.sort_order ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleServiceActive(s.id, s.is_active)}>
                          {s.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredSvc.length > PAGE_SIZE && (
            <PaginationBar page={svcPage} totalPages={svcTotalPages} total={filteredSvc.length} onPrev={() => setSvcPage(p => p - 1)} onNext={() => setSvcPage(p => p + 1)} />
          )}
        </div>
      )}

      {/* ========== SURVEYS ========== */}
      {tab === "surveys" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Responses</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">End</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedSurveys.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No data found</td></tr>
                ) : (
                  pagedSurveys.map((s) => (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{s.title}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{s.category || "—"}</Badge></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge(s.status)}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{s.total_responses ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{s.starts_at ? new Date(s.starts_at).toLocaleDateString("en-US") : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{s.ends_at ? new Date(s.ends_at).toLocaleDateString("en-US") : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleSurveyStatus(s.id, s.status)}>
                          {s.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredSurveys.length > PAGE_SIZE && (
            <PaginationBar page={surveyPage} totalPages={surveyTotalPages} total={filteredSurveys.length} onPrev={() => setSurveyPage(p => p - 1)} onNext={() => setSurveyPage(p => p + 1)} />
          )}
        </div>
      )}

      {/* ========== CASE STUDIES ========== */}
      {tab === "cases" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Industry</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Featured</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : pagedCases.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No data found</td></tr>
                ) : (
                  pagedCases.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">{c.title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.company_name}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{c.industry || "—"}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.sort_order ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleCaseFeatured(c.id, c.is_featured)}>
                          <Star className={`w-4 h-4 ${c.is_featured ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString("en-US")}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => toggleCaseActive(c.id, c.is_active)}>
                          {c.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredCases.length > PAGE_SIZE && (
            <PaginationBar page={casePage} totalPages={caseTotalPages} total={filteredCases.length} onPrev={() => setCasePage(p => p - 1)} onNext={() => setCasePage(p => p + 1)} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminInsights;
