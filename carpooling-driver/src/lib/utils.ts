import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TripLocationValue } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLocationName(
  location: TripLocationValue | null | undefined
): string {
  if (location == null) return "";
  const raw = typeof location === "string" ? location : location.name ?? "";
  if (!raw) return "";
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 2) {
    const meaningful = parts.filter(
      (p) => !/^\d{5,6}$/.test(p) && p.toLowerCase() !== "india"
    );
    if (meaningful.length >= 2) {
      return `${meaningful[0]}, ${meaningful[1]}`;
    }
    return meaningful[0] || parts[0];
  }
  return raw;
}
