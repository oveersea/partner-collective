import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const INDONESIAN_CITIES = [
  "Jakarta","Surabaya","Bandung","Medan","Semarang","Makassar","Palembang","Tangerang",
  "Depok","Bekasi","Bogor","Batam","Pekanbaru","Malang","Padang","Denpasar","Banjarmasin",
  "Samarinda","Tasikmalaya","Pontianak","Cimahi","Balikpapan","Jambi","Manado","Yogyakarta",
  "Bandar Lampung","Mataram","Palu","Kupang","Jayapura","Ambon","Kendari","Bengkulu",
  "Gorontalo","Pangkal Pinang","Tanjung Pinang","Mamuju","Ternate","Solo","Cirebon",
  "Sukabumi","Purwokerto","Pekalongan","Tegal","Magelang","Kediri","Blitar","Madiun",
  "Probolinggo","Pasuruan","Mojokerto","Batu","Serang","Cilegon","Tangerang Selatan",
  "Sorong","Merauke","Timika","Manokwari","Bontang","Tarakan","Lubuklinggau","Pagar Alam",
  "Binjai","Padang Sidempuan","Sibolga","Tanjung Balai","Pematang Siantar","Tebing Tinggi",
  "Banda Aceh","Langsa","Lhokseumawe","Sabang","Subulussalam",
];

const SORTED_CITIES = [...INDONESIAN_CITIES].sort((a, b) => a.localeCompare(b));

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CitySelect = ({ value, onChange, placeholder = "Pilih kota", className, disabled }: CitySelectProps) => {
  const [search, setSearch] = React.useState("");

  const filtered = search
    ? SORTED_CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : SORTED_CITIES;

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[280px]">
        <div className="flex items-center gap-2 px-2 pb-2 sticky top-0 bg-popover z-10">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Cari kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        {filtered.length === 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">Tidak ditemukan</div>
        )}
        {filtered.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { CitySelect, INDONESIAN_CITIES };
