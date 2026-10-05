import { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { MapPin } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Location {
  name: string;
  lat: number | string;
  lon: number | string;
}

type LocationSearchResponse =
  | Location[]
  | {
      data?: Location[];
    };

export interface LocationSearchProps {
  placeholder?: string;
  onSelect: (loc: Location) => void;
  value?: string;
  className?: string;
  searchFn?: (query: string) => Promise<Location[]>;
}

export default function LocationSearch({
  placeholder = "Search location...",
  onSelect,
  value,
  className,
  searchFn,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<Location[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (selected) return;
    if (query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        if (searchFn) {
          const res = await searchFn(query);
          setResults(res);
        } else {
          const response = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
          if (!response.ok) throw new Error("Search failed");
          const payload = (await response.json()) as LocationSearchResponse;
          setResults(Array.isArray(payload) ? payload : payload.data ?? []);
        }
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected, searchFn]);

  const handleSelect = (loc: Location) => {
    setQuery(loc.name);
    setShowDropdown(false);
    setSelected(true);
    onSelect(loc);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setSelected(false);
            setQuery(e.target.value);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="rounded-xl pl-9 bg-card shadow-sm border-input"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl backdrop-blur">
          {results.map((loc, i) => (
            <button
              key={i}
              type="button"
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent/80 first:rounded-t-xl last:rounded-b-xl"
              onMouseDown={() => handleSelect(loc)}
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{loc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export { LocationSearch };
