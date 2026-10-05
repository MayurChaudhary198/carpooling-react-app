import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { Navigation, Clock, Milestone, Loader2 } from "lucide-react";
import type { LocationResult } from "../../types";
import { useTheme } from "../../lib/theme";

// Fix standard Leaflet default icon paths if needed
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Modern SVG custom pins
const createStartIcon = () =>
  L.divIcon({
    className: "custom-map-marker-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9999px; background: linear-gradient(135deg, #10B981, #0F766E); color: white; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.45); font-weight: 700;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

const createEndIcon = () =>
  L.divIcon({
    className: "custom-map-marker-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(239, 68, 68, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9999px; background: linear-gradient(135deg, #F43F5E, #E11D48); color: white; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.45); font-weight: 700;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

const createWaypointIcon = (index: number) =>
  L.divIcon({
    className: "custom-map-marker-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 9999px; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.45); font-weight: 700; font-size: 11px;">
          ${index + 1}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });

export type MapStyle = "streets" | "osm" | "carto";

const toNum = (val: number | string) =>
  typeof val === "number" ? val : parseFloat(val);

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// Auto framing component
function MapAutoFitter({
  coords,
  points,
}: {
  coords: [number, number][];
  points: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    const list = coords.length > 0 ? coords : points;
    if (list.length >= 2) {
      try {
        const bounds = L.latLngBounds(list.map(([lat, lon]) => [lat, lon]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
      } catch (err) {
        console.error("Leaflet auto-fit error:", err);
      }
    }
  }, [map, coords, points]);

  return null;
}

export interface RouteMapProps {
  origin: LocationResult;
  destination: LocationResult;
  pickupPoints?: LocationResult[];
  height?: string;
  orsApiKey?: string;
  cartoApiKey?: string;
  initialStyle?: MapStyle;
  className?: string;
}

interface RouteResult {
  coords: [number, number][];
  isRealRoute: boolean;
  distanceKm?: number;
  durationMinutes?: number;
  engine: "osrm" | "ors" | "direct";
}

const calculateRoute = async (
  start: LocationResult,
  end: LocationResult,
  waypoints: LocationResult[],
  apiKey?: string
): Promise<RouteResult> => {
  const allPoints: [number, number][] = [
    [toNum(start.lat), toNum(start.lon)],
    ...waypoints.map((p) => [toNum(p.lat), toNum(p.lon)] as [number, number]),
    [toNum(end.lat), toNum(end.lon)],
  ];

  // 1. Primary: OSRM Routing Engine (Fast, free, no key required, covers Indian highways & city streets)
  try {
    const coordString = allPoints
      .map(([lat, lon]) => `${lon},${lat}`)
      .join(";");

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
    const response = await axios.get(osrmUrl, { timeout: 7000 });

    if (response.data?.code === "Ok" && response.data?.routes?.[0]) {
      const route = response.data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon]
      );
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMinutes = Math.round(route.duration / 60);

      return {
        coords,
        isRealRoute: true,
        distanceKm,
        durationMinutes,
        engine: "osrm",
      };
    }
  } catch (osrmError) {
    console.warn("OSRM routing request failed, trying fallback:", osrmError);
  }

  // 2. Secondary: OpenRouteService (if apiKey or VITE_ORS_API_KEY provided)
  const key =
    apiKey ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_ORS_API_KEY);

  if (key) {
    try {
      const coordinates = allPoints.map(([lat, lon]) => [lon, lat]);
      const orsResponse = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        { coordinates },
        {
          headers: {
            Authorization: key,
            "Content-Type": "application/json",
          },
          timeout: 7000,
        }
      );

      const feature = orsResponse.data?.features?.[0];
      if (feature?.geometry?.coordinates) {
        const coords: [number, number][] = feature.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );
        const summary = feature.properties?.summary;
        const distanceKm = summary?.distance
          ? Math.round((summary.distance / 1000) * 10) / 10
          : undefined;
        const durationMinutes = summary?.duration
          ? Math.round(summary.duration / 60)
          : undefined;

        return {
          coords,
          isRealRoute: true,
          distanceKm,
          durationMinutes,
          engine: "ors",
        };
      }
    } catch (orsError) {
      console.warn("ORS routing failed:", orsError);
    }
  }

  // 3. Fallback: Straight-line path with Haversine distance estimate
  let totalMeters = 0;
  for (let i = 0; i < allPoints.length - 1; i++) {
    const [lat1, lon1] = allPoints[i];
    const [lat2, lon2] = allPoints[i + 1];
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(dLambda / 2) *
        Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalMeters += R * c;
  }

  const distanceKm = Math.round((totalMeters / 1000) * 10) / 10;
  const durationMinutes = Math.round((distanceKm / 50) * 60);

  return {
    coords: allPoints,
    isRealRoute: false,
    distanceKm,
    durationMinutes,
    engine: "direct",
  };
};

export default function RouteMap({
  origin,
  destination,
  pickupPoints = [],
  height = "500px",
  orsApiKey,
  cartoApiKey,
  initialStyle = "streets",
  className = "",
}: RouteMapProps) {
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStyle, setActiveStyle] = useState<MapStyle>(initialStyle);

  // Safe theme detection
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext.isDark;
  } catch {
    if (typeof document !== "undefined") {
      isDark = document.documentElement.classList.contains("dark");
    }
  }

  const centerLat = (toNum(origin.lat) + toNum(destination.lat)) / 2;
  const centerLon = (toNum(origin.lon) + toNum(destination.lon)) / 2;
  const mapKey = `${origin.lat}-${origin.lon}-${destination.lat}-${destination.lon}-${pickupPoints.length}`;

  const allKeyPoints = useMemo<[number, number][]>(
    () => [
      [toNum(origin.lat), toNum(origin.lon)],
      ...pickupPoints.map(
        (p) => [toNum(p.lat), toNum(p.lon)] as [number, number]
      ),
      [toNum(destination.lat), toNum(destination.lon)],
    ],
    [origin, destination, pickupPoints]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchRoute = async () => {
      try {
        setIsLoading(true);
        const result = await calculateRoute(
          origin,
          destination,
          pickupPoints,
          orsApiKey
        );
        if (!cancelled) {
          setRouteData(result);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [origin, destination, pickupPoints, orsApiKey]);

  // Resolve tile provider
  const resolvedCartoKey =
    cartoApiKey ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_CARTO_API_KEY);

  const getTileConfig = () => {
    if (activeStyle === "carto") {
      if (!resolvedCartoKey) {
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          subdomains: ["a", "b", "c"],
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        };
      }
      const baseUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      return {
        url: `${baseUrl}?key=${resolvedCartoKey}`,
        subdomains: ["a", "b", "c", "d"],
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      };
    }

    if (activeStyle === "osm") {
      return {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c"],
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      };
    }

    // Default: "streets" - Esri World Street Map (Full detail with cities, highways & road networks)
    // 100% Free, NO API key required, NO watermark. Filtered seamlessly to deep slate in dark mode.
    return {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      subdomains: ["a", "b", "c"],
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom",
      maxZoom: 18,
    };
  };

  const tileConfig = getTileConfig();
  const routeCoords = routeData?.coords || [];
  const isRealRoute = routeData?.isRealRoute ?? false;

  return (
    <div className={`relative flex flex-col gap-2 w-full ${className}`}>
      {/* Map Viewport Container */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-md bg-muted/30 ${
          isDark && activeStyle !== "carto" ? "leaflet-dark-tiles" : ""
        }`}
        style={{ height }}
      >
        <style>{`
          .leaflet-control-attribution {
            display: none !important;
          }
          .leaflet-dark-tiles .leaflet-tile-pane {
            filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(92%);
          }
          .leaflet-dark-tiles .leaflet-container {
            background: #0f172a !important;
          }
          .leaflet-dark-tiles .leaflet-control-zoom a {
            background-color: #1e293b !important;
            color: #f1f5f9 !important;
            border-color: #334155 !important;
          }
          .leaflet-dark-tiles .leaflet-control-zoom a:hover {
            background-color: #334155 !important;
          }
          .custom-route-popup .leaflet-popup-content-wrapper {
            background: ${isDark ? "#1e293b" : "#ffffff"} !important;
            color: ${isDark ? "#f8fafc" : "#0f172a"} !important;
            border: 1px solid ${isDark ? "rgba(51, 65, 85, 0.9)" : "rgba(226, 232, 240, 0.9)"} !important;
            border-radius: 14px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35) !important;
            padding: 2px !important;
          }
          .custom-route-popup .leaflet-popup-tip {
            background: ${isDark ? "#1e293b" : "#ffffff"} !important;
          }
          .custom-route-popup .leaflet-popup-close-button {
            color: ${isDark ? "#94a3b8" : "#64748b"} !important;
            padding: 8px !important;
          }
          .custom-route-popup .leaflet-popup-close-button:hover {
            color: ${isDark ? "#ffffff" : "#0f172a"} !important;
          }
        `}</style>
        <MapContainer
          key={mapKey}
          center={[centerLat, centerLon]}
          zoom={8}
          scrollWheelZoom={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Active Basemap Layer */}
          <TileLayer
            key={`${tileConfig.url}-${activeStyle}-${isDark}`}
            url={tileConfig.url}
            subdomains={tileConfig.subdomains ?? ["a", "b", "c"]}
            attribution={tileConfig.attribution}
            maxZoom={tileConfig.maxZoom ?? 18}
          />

          {/* Auto bounds framing */}
          <MapAutoFitter coords={routeCoords} points={allKeyPoints} />

          {/* Glowing Underlay Route Polyline */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              color={
                isRealRoute
                  ? isDark
                    ? "rgba(45, 212, 191, 0.25)"
                    : "rgba(15, 118, 110, 0.2)"
                  : "rgba(148, 163, 184, 0.2)"
              }
              weight={9}
              opacity={1}
            />
          )}

          {/* Crisp Primary Route Polyline */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              color={
                isRealRoute ? (isDark ? "#2DD4BF" : "#0F766E") : "#94A3B8"
              }
              weight={4.5}
              opacity={0.95}
              dashArray={isRealRoute ? undefined : "6, 8"}
            />
          )}

          {/* Origin Marker */}
          <Marker
            position={[toNum(origin.lat), toNum(origin.lon)]}
            icon={createStartIcon()}
          >
            <Popup className="custom-route-popup">
              <div className="p-1 min-w-[160px]">
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Departure / Pickup
                </div>
                <div
                  className={`text-xs font-semibold leading-relaxed ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {origin.name}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Pickup Waypoint Markers */}
          {pickupPoints.map((point, index) => (
            <Marker
              key={`${point.name}-${index}`}
              position={[toNum(point.lat), toNum(point.lon)]}
              icon={createWaypointIcon(index)}
            >
              <Popup className="custom-route-popup">
                <div className="p-1 min-w-[160px]">
                  <div className="flex items-center gap-1.5 text-blue-500 font-bold text-[11px] uppercase tracking-wider mb-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                    Stop #{index + 1}
                  </div>
                  <div
                    className={`text-xs font-semibold leading-relaxed ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {point.name}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Destination Marker */}
          <Marker
            position={[toNum(destination.lat), toNum(destination.lon)]}
            icon={createEndIcon()}
          >
            <Popup className="custom-route-popup">
              <div className="p-1 min-w-[160px]">
                <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 inline-block animate-pulse" />
                  Final Destination
                </div>
                <div
                  className={`text-xs font-semibold leading-relaxed ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {destination.name}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Route HUD Status Card */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] flex flex-wrap items-center gap-2.5 rounded-xl bg-card/90 px-3.5 py-2 text-foreground shadow-lg backdrop-blur-md border border-border/80 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-primary" />
            )}
            <span>
              {isLoading
                ? "Calculating Road Route..."
                : isRealRoute
                  ? "Live Road Route"
                  : "Direct Path Preview"}
            </span>
          </div>

          {routeData?.distanceKm !== undefined && (
            <>
              <span className="text-muted-foreground/40 hidden sm:inline">•</span>
              <div className="flex items-center gap-1 text-muted-foreground font-medium">
                <Milestone className="h-3.5 w-3.5 text-primary/80" />
                <span className="font-semibold text-foreground">
                  {routeData.distanceKm} km
                </span>
              </div>
            </>
          )}

          {routeData?.durationMinutes !== undefined && (
            <>
              <span className="text-muted-foreground/40 hidden sm:inline">•</span>
              <div className="flex items-center gap-1 text-muted-foreground font-medium">
                <Clock className="h-3.5 w-3.5 text-primary/80" />
                <span className="font-semibold text-foreground">
                  ~{formatDuration(routeData.durationMinutes)}
                </span>
              </div>
            </>
          )}

          {/* Quick Map Layer Switcher (Watermark-free Streets / OSM / CARTO) */}
          <div className="ml-auto pointer-events-auto flex items-center gap-0.5 rounded-lg bg-muted/70 p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveStyle("streets")}
              className={`px-2 py-0.5 rounded-md text-[10px] transition-all ${
                activeStyle === "streets"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Esri World Streets (Clean, detailed, 100% free, no watermark)"
            >
              Streets
            </button>
            <button
              type="button"
              onClick={() => setActiveStyle("osm")}
              className={`px-2 py-0.5 rounded-md text-[10px] transition-all ${
                activeStyle === "osm"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="OpenStreetMap"
            >
              OSM
            </button>
            <button
              type="button"
              onClick={() => setActiveStyle("carto")}
              className={`px-2 py-0.5 rounded-md text-[10px] transition-all ${
                activeStyle === "carto"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={
                resolvedCartoKey
                  ? "CARTO (Key active)"
                  : "CARTO (Requires free key at carto.com/basemaps/apikey)"
              }
            >
              CARTO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RouteMap };
