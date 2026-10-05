import { useEffect, useRef } from "react";
import api from "@/services/api";

interface LatLon {
  lat: number | string;
  lon: number | string;
  name?: string;
}

interface RouteMapProps {
  start?: LatLon;
  end?: LatLon;
  height?: string;
}

export default function RouteMap({ start, end, height = "300px" }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultCenter: [number, number] = [23.0225, 72.5714]; // Ahmedabad
      const map = L.map(mapRef.current!).setView(defaultCenter, 10);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      if (start && end) {
        const startLatLng: [number, number] = [Number(start.lat), Number(start.lon)];
        const endLatLng: [number, number] = [Number(end.lat), Number(end.lon)];

        const startMarker = L.marker(startLatLng).addTo(map);
        if (start.name) startMarker.bindPopup(start.name);

        const endMarker = L.marker(endLatLng).addTo(map);
        if (end.name) endMarker.bindPopup(end.name);

        map.fitBounds([startLatLng, endLatLng], { padding: [40, 40] });

        // Fetch route
        api
          .post("/location/route", {
            start: { name: start.name, lat: start.lat, lon: start.lon },
            end: { name: end.name, lat: end.lat, lon: end.lon },
          })
          .then((res) => {
            const coords = res.data?.coordinates || res.data?.geometry?.coordinates;
            if (coords) {
              const latLngs: [number, number][] = coords.map(([lon, lat]: [number, number]) => [
                lat,
                lon,
              ]);
              L.polyline(latLngs, { color: "#3b82f6", weight: 4, opacity: 0.8 }).addTo(map);
              map.fitBounds(latLngs, { padding: [40, 40] });
            }
          })
          .catch(() => {
            // Draw straight line as fallback
            L.polyline([startLatLng, endLatLng], {
              color: "#3b82f6",
              weight: 3,
              dashArray: "8, 8",
              opacity: 0.7,
            }).addTo(map);
          });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [start?.lat, start?.lon, end?.lat, end?.lon]);

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="w-full rounded-xl border border-slate-200 overflow-hidden z-0"
    />
  );
}
