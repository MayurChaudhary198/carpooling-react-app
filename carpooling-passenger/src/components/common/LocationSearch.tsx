import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Location {
  name: string;
  lat: number | string;
  lon: number | string;
}

type LocationSearchResponse =
  | Location[]
  | {
      data?: Location[];
    };

interface LocationSearchProps {
  placeholder?: string;
  onSelect: (loc: Location) => void;
  value?: string;
  className?: string;
}

export default function LocationSearch({ placeholder, onSelect, value, className }: LocationSearchProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<Location[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (selected) return;
    const trimmed = query.trim();
    if (trimmed.length < 3) { setResults([]); setShowDropdown(false); return; }
    let isCurrent = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/location/search?q=${encodeURIComponent(trimmed)}`);
        if (!isCurrent) return;
        const payload = res.data as LocationSearchResponse;
        setResults(Array.isArray(payload) ? payload : payload.data ?? []);
        setShowDropdown(true);
      } catch { if (isCurrent) setResults([]); }
      finally { if (isCurrent) setIsLoading(false); }
    }, 350);
    return () => { isCurrent = false; if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected]);

  const handleSelect = (loc: Location) => {
    setQuery(loc.name);
    setShowDropdown(false);
    setSelected(true);
    onSelect(loc);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setSelected(false); setQuery(e.target.value); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="rounded-lg border-black/10 bg-white pl-9 shadow-sm"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_18px_35px_rgba(17,24,39,0.08)]">
          {results.map((loc, i) => (
            <button
              key={i}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#111827] transition-colors hover:bg-[#FAFAF8] first:rounded-t-lg last:rounded-b-lg"
              onMouseDown={() => handleSelect(loc)}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
              <span className="truncate">{loc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
