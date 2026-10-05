import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { Input } from "@/components/ui/input";
import { API_ENDPOINTS } from "@/constants";
import { MapPin } from "lucide-react";

interface Location {
  name: string;
  lat: string;
  lon: string;
}

type LocationSearchResponse =
  | Location[]
  | {
      data?: Location[];
    };

interface LocationSearchProps {
  placeholder?: string;
  onSelect: (location: Location) => void;
}

export default function LocationSearch({
  placeholder,
  onSelect,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selected) return;

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    let isCurrent = true;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);

        const response = await api.get(API_ENDPOINTS.location.search(trimmed));
        if (!isCurrent) return;

        const payload = response.data as LocationSearchResponse;
        setResults(Array.isArray(payload) ? payload : payload.data ?? []);
        setShowDropdown(true);
      } catch {
        if (isCurrent) setResults([]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, 350);

    return () => {
      isCurrent = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, selected]);

  const handleSelect = (location: Location) => {
    setQuery(location.name);
    setShowDropdown(false);
    setSelected(true);
    onSelect(location);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(false);
    setQuery(e.target.value);
  };

  return (
    <div className="relative w-full">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      {isLoading && (
        <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          Searching...
        </p>
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border bg-background shadow-lg">
          {results.map((loc, index) => (
            <button
              key={index}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={() => handleSelect(loc)}
            >
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{loc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
