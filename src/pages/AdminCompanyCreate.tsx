import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
import { CitySelect } from "@/components/ui/city-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Crown, X, Loader2, Plus } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education", "E-Commerce",
  "Manufacturing", "Real Estate", "Media & Entertainment", "Government", "Logistics",
  "F&B", "Professional Services", "Construction", "Trading", "Retail",
  "Hospitality", "Agriculture", "Energy", "Telecommunications", "Automotive",
];

const AdminCompanyCreate = () => {
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("Indonesia");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [creating, setCreating] = useState(false);

  const searchOwnerFn = async (q: string) => {
    setOwnerSearch(q);
    if (q.length < 2) { setOwnerResults([]); return; }
    setSearchingOwner(true);
    const { data } = await supabase.from("profiles").select("user_id, full_name").ilike("full_name", `%${q}%`).limit(10);
    setOwnerResults(data || []);
    setSearchingOwner(false);
  };

  const createCompany = async () => {
    if (!newName.trim()) { toast.error("Nama company wajib diisi"); return; }
    if (!selectedOwnerId) { toast.error("Pilih owner untuk company"); return; }
    setCreating(true);
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let oveercode = "C";
    for (let i = 0; i < 8; i++) oveercode += chars.charAt(Math.floor(Math.random() * chars.length));

    const { data: bp, error: bpErr } = await supabase
      .from("business_profiles")
      .insert({
        name: newName.trim(), slug, oveercode, business_type: "company",
        industry: newIndustry.trim() || null, city: newCity.trim() || null,
        country: newCountry.trim() || null, created_by: selectedOwnerId, kyc_status: "unverified",
      })
      .select("id").single();

    if (bpErr || !bp) { toast.error("Gagal membuat company: " + (bpErr?.message || "")); setCreating(false); return; }

    await supabase.from("business_members").insert({ business_id: bp.id, user_id: selectedOwnerId, role: "owner", status: "active" });
    toast.success("Company berhasil dibuat");
    setCreating(false);
    navigate("/admin", { state: { tab: "companies" } });
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

        <div className="max-w-xl">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Tambah Company Baru</h1>
          <p className="text-sm text-muted-foreground mb-8">Isi data di bawah untuk membuat company baru.</p>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nama Company *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="PT Company Indonesia" />
            </div>

            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={newIndustry} onValueChange={setNewIndustry}>
                <SelectTrigger><SelectValue placeholder="Pilih industri" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kota</Label>
                <CitySelect value={newCity} onChange={setNewCity} />
              </div>
              <div className="space-y-2">
                <Label>Negara</Label>
                <CountrySelect value={newCountry} onChange={setNewCountry} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Owner *</Label>
              <Input value={ownerSearch} onChange={(e) => searchOwnerFn(e.target.value)} placeholder="Cari nama user..." />
              {searchingOwner && <p className="text-xs text-muted-foreground">Mencari...</p>}
              {ownerResults.length > 0 && !selectedOwnerId && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border">
                  {ownerResults.map((u) => (
                    <button key={u.user_id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => { setSelectedOwnerId(u.user_id); setOwnerSearch(u.full_name || ""); setOwnerResults([]); }}>
                      {u.full_name || "—"}
                    </button>
                  ))}
                </div>
              )}
              {selectedOwnerId && (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="flex-1">{ownerSearch}</span>
                  <button onClick={() => { setSelectedOwnerId(""); setOwnerSearch(""); }} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate(-1)}>Batal</Button>
              <Button onClick={createCompany} disabled={creating || !newName.trim() || !selectedOwnerId}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Buat Company
              </Button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default AdminCompanyCreate;
