import { TripLocation, LocationValue } from "@/types";

export interface LocationInput {
  name: string;
  lat: number | string;
  lon: number | string;
}

export type { LocationValue };

export const toTripLocation = (loc: LocationInput): TripLocation => ({
  name: loc.name,
  lat: typeof loc.lat === "string" ? Number(loc.lat) : loc.lat,
  lon: typeof loc.lon === "string" ? Number(loc.lon) : loc.lon,
});

export function formatLocationName(
  location: LocationValue | null | undefined
): string {
  if (location == null) return "";
  if (typeof location === "string") return location;
  return location.name ?? "";
}
