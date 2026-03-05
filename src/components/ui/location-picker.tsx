import React, { useState, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, MapPin, Loader2 } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export interface LocationData {
  city: string;
  country: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

interface LocationPickerProps {
  city: string;
  country: string;
  address: string;
  onCityChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onLatLngChange?: (lat: number, lng: number) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    road?: string;
    house_number?: string;
    suburb?: string;
    postcode?: string;
  };
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  city, country, address,
  onCityChange, onCountryChange, onAddressChange, onLatLngChange,
}) => {
  const [markerPos, setMarkerPos] = useState<[number, number]>([-6.2088, 106.8456]); // Jakarta default
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`,
        { headers: { "User-Agent": "OveerseaAdmin/1.0" } }
      );
      const data: NominatimResult = await res.json();
      if (data?.address) {
        const cityName = data.address.city || data.address.town || data.address.village || data.address.county || "";
        const countryName = data.address.country || "";
        const parts = [data.address.road, data.address.house_number, data.address.suburb, data.address.postcode].filter(Boolean);
        const fullAddress = parts.length > 0 ? parts.join(", ") : data.display_name;

        onCityChange(cityName);
        onCountryChange(countryName);
        onAddressChange(fullAddress);
      }
    } catch {
      // silently fail
    }
  }, [onCityChange, onCountryChange, onAddressChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    onLatLngChange?.(lat, lng);
    reverseGeocode(lat, lng);
  }, [onLatLngChange, reverseGeocode]);

  const searchLocation = useCallback(async (q: string) => {
    if (q.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5&accept-language=id`,
        { headers: { "User-Agent": "OveerseaAdmin/1.0" } }
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(q), 400);
  };

  const selectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerPos([lat, lng]);
    onLatLngChange?.(lat, lng);

    const cityName = result.address.city || result.address.town || result.address.village || result.address.county || "";
    const countryName = result.address.country || "";
    const parts = [result.address.road, result.address.house_number, result.address.suburb, result.address.postcode].filter(Boolean);
    const fullAddress = parts.length > 0 ? parts.join(", ") : result.display_name;

    onCityChange(cityName);
    onCountryChange(countryName);
    onAddressChange(fullAddress);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Cari Lokasi
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Ketik alamat atau nama tempat..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {searchResults.length > 0 && (
          <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border bg-popover shadow-md">
            {searchResults.map((r, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors flex items-start gap-2"
                onClick={() => selectResult(r)}
              >
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border h-[280px]">
        <MapContainer
          center={markerPos}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={markerPos} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          <MapCenterUpdater lat={markerPos[0]} lng={markerPos[1]} />
        </MapContainer>
      </div>
      <p className="text-[11px] text-muted-foreground">Klik pada peta atau cari lokasi untuk mengisi otomatis alamat, kota, dan negara.</p>

      {/* Autofilled fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kota</Label>
          <Input value={city} onChange={(e) => onCityChange(e.target.value)} placeholder="Kota" />
        </div>
        <div className="space-y-2">
          <Label>Negara</Label>
          <Input value={country} onChange={(e) => onCountryChange(e.target.value)} placeholder="Negara" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Alamat Lengkap</Label>
          <Textarea value={address} onChange={(e) => onAddressChange(e.target.value)} placeholder="Alamat akan terisi otomatis dari peta" rows={2} />
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
