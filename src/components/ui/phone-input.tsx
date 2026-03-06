import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+62", country: "ID", label: "Indonesia" },
  { code: "+1", country: "US", label: "United States" },
  { code: "+44", country: "GB", label: "United Kingdom" },
  { code: "+61", country: "AU", label: "Australia" },
  { code: "+81", country: "JP", label: "Japan" },
  { code: "+82", country: "KR", label: "South Korea" },
  { code: "+86", country: "CN", label: "China" },
  { code: "+91", country: "IN", label: "India" },
  { code: "+60", country: "MY", label: "Malaysia" },
  { code: "+65", country: "SG", label: "Singapore" },
  { code: "+66", country: "TH", label: "Thailand" },
  { code: "+63", country: "PH", label: "Philippines" },
  { code: "+84", country: "VN", label: "Vietnam" },
  { code: "+971", country: "AE", label: "UAE" },
  { code: "+966", country: "SA", label: "Saudi Arabia" },
  { code: "+49", country: "DE", label: "Germany" },
  { code: "+33", country: "FR", label: "France" },
  { code: "+39", country: "IT", label: "Italy" },
  { code: "+34", country: "ES", label: "Spain" },
  { code: "+31", country: "NL", label: "Netherlands" },
  { code: "+46", country: "SE", label: "Sweden" },
  { code: "+47", country: "NO", label: "Norway" },
  { code: "+45", country: "DK", label: "Denmark" },
  { code: "+41", country: "CH", label: "Switzerland" },
  { code: "+55", country: "BR", label: "Brazil" },
  { code: "+52", country: "MX", label: "Mexico" },
  { code: "+7", country: "RU", label: "Russia" },
  { code: "+90", country: "TR", label: "Turkey" },
  { code: "+27", country: "ZA", label: "South Africa" },
  { code: "+234", country: "NG", label: "Nigeria" },
  { code: "+254", country: "KE", label: "Kenya" },
  { code: "+20", country: "EG", label: "Egypt" },
  { code: "+64", country: "NZ", label: "New Zealand" },
  { code: "+48", country: "PL", label: "Poland" },
  { code: "+380", country: "UA", label: "Ukraine" },
  { code: "+40", country: "RO", label: "Romania" },
  { code: "+36", country: "HU", label: "Hungary" },
  { code: "+420", country: "CZ", label: "Czech Republic" },
  { code: "+351", country: "PT", label: "Portugal" },
  { code: "+30", country: "GR", label: "Greece" },
  { code: "+972", country: "IL", label: "Israel" },
  { code: "+92", country: "PK", label: "Pakistan" },
  { code: "+880", country: "BD", label: "Bangladesh" },
  { code: "+94", country: "LK", label: "Sri Lanka" },
  { code: "+95", country: "MM", label: "Myanmar" },
  { code: "+856", country: "LA", label: "Laos" },
  { code: "+855", country: "KH", label: "Cambodia" },
  { code: "+673", country: "BN", label: "Brunei" },
  { code: "+670", country: "TL", label: "Timor-Leste" },
];

// Sort by label, but keep Indonesia first
const SORTED_CODES = [
  COUNTRY_CODES[0],
  ...COUNTRY_CODES.slice(1).sort((a, b) => a.label.localeCompare(b.label)),
];

/**
 * Parse a full phone string like "+62 812345678" into { dialCode, number }.
 * Falls back to +62 if no code is detected.
 */
function parsePhone(value: string): { dialCode: string; number: string } {
  const trimmed = (value || "").trim();
  if (!trimmed) return { dialCode: "+62", number: "" };

  // Try matching known codes (longest first)
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sorted) {
    if (trimmed.startsWith(cc.code)) {
      return { dialCode: cc.code, number: trimmed.slice(cc.code.length).replace(/^\s+/, "") };
    }
  }

  // If starts with + but unrecognized, split at first space or after code-like prefix
  if (trimmed.startsWith("+")) {
    const match = trimmed.match(/^(\+\d{1,4})\s*(.*)/);
    if (match) return { dialCode: match[1], number: match[2] };
  }

  // No code prefix — treat as local number with default +62
  return { dialCode: "+62", number: trimmed.replace(/^0+/, "") };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PhoneInput = ({ value, onChange, placeholder = "812 3456 7890", className, disabled }: PhoneInputProps) => {
  const parsed = parsePhone(value);

  const handleCodeChange = (code: string) => {
    onChange(parsed.number ? `${code} ${parsed.number}` : code);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s-]/g, "");
    onChange(num ? `${parsed.dialCode} ${num}` : "");
  };

  return (
    <div className={cn("flex gap-0", className)}>
      <Select value={parsed.dialCode} onValueChange={handleCodeChange} disabled={disabled}>
        <SelectTrigger className="w-[100px] shrink-0 rounded-r-none border-r-0 focus:z-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {SORTED_CODES.map((cc) => (
            <SelectItem key={cc.code + cc.country} value={cc.code}>
              <span className="font-mono text-xs">{cc.code}</span>
              <span className="ml-1.5 text-muted-foreground text-xs">{cc.country}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={parsed.number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-l-none focus:z-10"
      />
    </div>
  );
};

export { PhoneInput, COUNTRY_CODES };
