import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationPicker from "@/components/ui/location-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Crown, X, Loader2, Plus } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education", "E-Commerce",
  "Manufacturing", "Real Estate", "Media & Entertainment", "Government", "Logistics",
  "F&B", "Professional Services", "Construction", "Trading", "Retail",
  "Hospitality", "Agriculture", "Energy", "Telecommunications", "Automotive",
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - i);

const AdminVendorCreate = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  // Basic info
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [description, setDescription] = useState("");

  // Contact
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Location
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Indonesia");
  const [address, setAddress] = useState("");

  // Legal
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [aktaNumber, setAktaNumber] = useState("");

  // Social
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");

  // Owner
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [searchingOwner, setSearchingOwner] = useState(false);

  const searchOwnerFn = async (q: string) => {
    setOwnerSearch(q);
    if (q.length < 2) { setOwnerResults([]); return; }
    setSearchingOwner(true);
    const { data } = await supabase.from("profiles").select("user_id, full_name").ilike("full_name", `%${q}%`).limit(10);
    setOwnerResults(data || []);
    setSearchingOwner(false);
  };

  const createVendor = async () => {
    if (!name.trim()) { toast.error("Nama vendor wajib diisi"); return; }
    if (!selectedOwnerId) { toast.error("Pilih owner untuk vendor"); return; }
    setCreating(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let oveercode = "VND-";
    for (let i = 0; i < 6; i++) oveercode += chars.charAt(Math.floor(Math.random() * chars.length));

    const { data: bp, error: bpErr } = await supabase
      .from("business_profiles")
      .insert({
        name: name.trim(), slug, oveercode, business_type: "vendor",
        industry: industry || null,
        company_size: companySize || null,
        founded_year: foundedYear ? parseInt(foundedYear) : null,
        description: description.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        city: city || null,
        country: country || null,
        address: address.trim() || null,
        npwp: npwp.trim() || null,
        nib: nib.trim() || null,
        akta_number: aktaNumber.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        created_by: selectedOwnerId,
        kyc_status: "unverified",
      })
      .select("id").single();

    if (bpErr || !bp) { toast.error("Gagal membuat vendor: " + (bpErr?.message || "")); setCreating(false); return; }

    await supabase.from("business_members").insert({ business_id: bp.id, user_id: selectedOwnerId, role: "owner", status: "active" });
    toast.success("Vendor berhasil dibuat");
    setCreating(false);
    navigate("/admin", { state: { tab: "vendors" } });
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Tambah Vendor Baru</h1>
        <p className="text-sm text-muted-foreground mb-8">Isi data di bawah untuk membuat vendor baru.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Kolom Kiri 60% ── */}
          <div className="lg:col-span-3 space-y-8">
            {/* Informasi Dasar */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Informasi Dasar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Vendor *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="PT Vendor Indonesia" />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue placeholder="Pilih industri" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ukuran Perusahaan</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger><SelectValue placeholder="Pilih ukuran" /></SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map(s => <SelectItem key={s} value={s}>{s} karyawan</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tahun Berdiri</Label>
                  <Select value={foundedYear} onValueChange={setFoundedYear}>
                    <SelectTrigger><SelectValue placeholder="Pilih tahun" /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.vendor.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Deskripsi</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat tentang vendor..." rows={3} />
                </div>
              </div>
            </section>

            {/* Lokasi */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Lokasi</h2>
              <LocationPicker
                city={city}
                country={country}
                address={address}
                onCityChange={setCity}
                onCountryChange={setCountry}
                onAddressChange={setAddress}
              />
            </section>

            {/* Dokumen Legal */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Dokumen Legal</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NPWP</Label>
                  <Input value={npwp} onChange={(e) => setNpwp(e.target.value)} placeholder="00.000.000.0-000.000" />
                </div>
                <div className="space-y-2">
                  <Label>NIB</Label>
                  <Input value={nib} onChange={(e) => setNib(e.target.value)} placeholder="Nomor Induk Berusaha" />
                </div>
                <div className="space-y-2">
                  <Label>No. Akta</Label>
                  <Input value={aktaNumber} onChange={(e) => setAktaNumber(e.target.value)} placeholder="Nomor akta pendirian" />
                </div>
              </div>
            </section>
          </div>

          {/* ── Kolom Kanan 40% ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Kontak */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Kontak</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@vendor.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 21 1234567" />
                </div>
              </div>
            </section>

            {/* Social Media */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Social Media</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/..." />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Twitter / X</Label>
                  <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/..." />
                </div>
              </div>
            </section>

            {/* Owner */}
            <section className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Owner</h2>
              <div className="space-y-2">
                <Label>Owner / PIC *</Label>
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
            </section>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6 mt-8 border-t border-border">
          <Button variant="outline" onClick={() => navigate(-1)}>Batal</Button>
          <Button onClick={createVendor} disabled={creating || !name.trim() || !selectedOwnerId}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Buat Vendor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminVendorCreate;
