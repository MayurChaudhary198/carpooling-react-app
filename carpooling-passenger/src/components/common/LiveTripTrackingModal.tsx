import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { subscribeToTripTracking } from "@carpooling/common";
import type { FirebaseTrackingData } from "@carpooling/common";
import api from "@/services/api";
import { useTheme } from "@/lib/theme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  CheckCircle2,
  Clock,
  LocateFixed,
  Maximize2,
  Gauge,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface LiveTripTrackingModalProps {
  tripId: string | null;
  isOpen: boolean;
  onClose: () => void;
  tripcode?: string;
  pickupLocation?: { lat?: number | string; lon?: number | string; name?: string };
  dropoffLocation?: { lat?: number | string; lon?: number | string; name?: string };
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 45) return "Arrived";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatEta(meters: number, speedMps?: number | null): string {
  if (meters < 45) return "Now";
  const effectiveSpeed = Math.max(speedMps || 0, 6.5); // ~23 km/h city average
  const seconds = meters / effectiveSpeed;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 1) return "< 1 min";
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return `${hours}h ${remMins}m`;
  }
  return `~${minutes} min${minutes > 1 ? "s" : ""}`;
}

async function fetchRoadGeometry(
  points: { lat: number; lon: number }[]
): Promise<[number, number][] | null> {
  if (points.length < 2) return null;
  try {
    const coordsStr = points.map((p) => `${p.lon},${p.lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const coords = json.routes?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length > 0) {
      return coords.map(([lon, lat]: [number, number]) => [lat, lon]);
    }
  } catch (err) {
    console.warn("OSRM road route fetch failed:", err);
  }
  return null;
}

export default function LiveTripTrackingModal({
  tripId,
  isOpen,
  onClose,
  tripcode,
  pickupLocation,
  dropoffLocation,
}: LiveTripTrackingModalProps) {
  const [trackingData, setTrackingData] = useState<FirebaseTrackingData | null>(null);
  const [passengerCoords, setPassengerCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishedStatus, setFinishedStatus] = useState<string | null>(null);
  const [mapTheme, setMapTheme] = useState<"streets" | "satellite">("streets");

  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext.isDark;
  } catch {
    if (typeof document !== "undefined") {
      isDark = document.documentElement.classList.contains("dark");
    }
  }

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const passengerMarkerRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);
  const ambientGlowPolylineRef = useRef<any>(null);
  const roadCasingPolylineRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const driverGlowLineRef = useRef<any>(null);
  const driverToPickupLineRef = useRef<any>(null);
  const isFetchingRouteRef = useRef(false);
  const lastDriverRouteFetchRef = useRef<{ lat: number; lon: number; time: number }>({
    lat: 0,
    lon: 0,
    time: 0,
  });

  // 1. Get Passenger's current live location
  useEffect(() => {
    if (!isOpen) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPassengerCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => console.log("Passenger geolocation unavailable:", err.message),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [isOpen]);

  // 2. Subscribe to Firebase Realtime Database
  useEffect(() => {
    if (!isOpen || !tripId || isFinished) return;

    const unsubscribe = subscribeToTripTracking(
      tripId,
      (data) => {
        if (!data) return;

        setTrackingData(data);

        // Check if trip ended
        if (data.status === "COMPLETED" || data.status === "CANCELLED") {
          setIsFinished(true);
          setFinishedStatus(data.status);
        }
      },
      (err) => {
        console.warn("Live tracking subscription error:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, tripId, isFinished]);

  // 3. Staleness timer: check if updatedAt is older than 30s
  useEffect(() => {
    if (!isOpen || !trackingData || isFinished) {
      setIsStale(false);
      return;
    }

    const checkStaleness = () => {
      const diff = Date.now() - (trackingData.updatedAt || 0);
      setIsStale(diff > 30000);
    };

    checkStaleness();
    const interval = setInterval(checkStaleness, 5000);
    return () => clearInterval(interval);
  }, [isOpen, trackingData, isFinished]);

  // Center on driver or fit all points
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.invalidateSize();

    if (trackingData?.lat && trackingData?.lon) {
      map.setView([trackingData.lat, trackingData.lon], 16, { animate: true });
    } else if (passengerCoords) {
      map.setView([passengerCoords.lat, passengerCoords.lon], 16, { animate: true });
    }
  }, [trackingData, passengerCoords]);

  // Fit entire journey route in view
  const handleFitRoute = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.invalidateSize();
    if (routePolylineRef.current) {
      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [60, 60], animate: true });
    } else {
      handleRecenter();
    }
  }, [handleRecenter]);

  // Toggle between Street and Satellite view (100% free, no API keys, zero watermark)
  const toggleMapTheme = useCallback(() => {
    setMapTheme((curr) => (curr === "streets" ? "satellite" : "streets"));
  }, []);

  // Update map tile layer when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      if (mapTheme === "satellite") {
        tileLayerRef.current = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri",
          }
        ).addTo(mapInstanceRef.current);
      } else {
        tileLayerRef.current = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            subdomains: "abc",
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          }
        ).addTo(mapInstanceRef.current);
      }
      tileLayerRef.current.bringToBack();
    });
  }, [mapTheme]);

  // 4. Initialize and update Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default leaflet icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const pLat = Number(pickupLocation?.lat);
      const pLon = Number(pickupLocation?.lon);
      const hasPickup = !isNaN(pLat) && !isNaN(pLon) && pLat !== 0;

      const dLat = Number(dropoffLocation?.lat);
      const dLon = Number(dropoffLocation?.lon);
      const hasDropoff = !isNaN(dLat) && !isNaN(dLon) && dLat !== 0;

      const initialLat = trackingData?.lat
        ? trackingData.lat
        : passengerCoords
        ? passengerCoords.lat
        : hasPickup
        ? pLat
        : 23.0225;
      const initialLon = trackingData?.lon
        ? trackingData.lon
        : passengerCoords
        ? passengerCoords.lon
        : hasPickup
        ? pLon
        : 72.5714;

      // Initialize map instance if not created
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false, // Clean UI: use our floating controls
          attributionControl: false, // <-- REMOVE BRANDING
        }).setView([initialLat, initialLon], 14);
        mapInstanceRef.current = map;

        // Modern crisp OpenStreetMap tiles (100% free, no API key required, no watermark)
        tileLayerRef.current = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            subdomains: "abc",
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          }
        ).addTo(map);

        // Multiple invalidates to guarantee tiles render properly inside modal
        setTimeout(() => map.invalidateSize(), 150);
        setTimeout(() => map.invalidateSize(), 400);
        setTimeout(() => map.invalidateSize(), 800);

        // Add Pickup Marker with glowing beacon
        if (hasPickup && !pickupMarkerRef.current) {
          const pickupIcon = L.divIcon({
            className: "pickup-custom-marker",
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
                <div style="
                  background: rgba(15, 118, 110, 0.95);
                  color: white;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.3px;
                  padding: 3px 9px;
                  border-radius: 9999px;
                  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.35);
                  border: 1.5px solid rgba(255, 255, 255, 0.9);
                  margin-bottom: 4px;
                  white-space: nowrap;
                  backdrop-filter: blur(4px);
                ">
                  Pickup
                </div>
                <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                  <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #14B8A6; opacity: 0.45; animation: pulse-ring 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;"></span>
                  <div style="
                    position: relative;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
                    border: 3px solid #FFFFFF;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                  ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                </div>
              </div>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 48],
          });
          pickupMarkerRef.current = L.marker([pLat, pLon], { icon: pickupIcon }).addTo(map);
          pickupMarkerRef.current.bindPopup(`<b>Pickup:</b> ${pickupLocation?.name || "Pickup Point"}`);
        }

        // Add Dropoff Marker with golden beacon
        if (hasDropoff && !dropoffMarkerRef.current) {
          const dropoffIcon = L.divIcon({
            className: "dropoff-custom-marker",
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
                <div style="
                  background: rgba(217, 119, 6, 0.95);
                  color: white;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: 0.3px;
                  padding: 3px 9px;
                  border-radius: 9999px;
                  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
                  border: 1.5px solid rgba(255, 255, 255, 0.9);
                  margin-bottom: 4px;
                  white-space: nowrap;
                  backdrop-filter: blur(4px);
                ">
                  Destination
                </div>
                <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                  <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #F59E0B; opacity: 0.45; animation: pulse-ring 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite 0.5s;"></span>
                  <div style="
                    position: relative;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
                    border: 3px solid #FFFFFF;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                  ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                      <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                  </div>
                </div>
              </div>
            `,
            iconSize: [70, 60],
            iconAnchor: [35, 48],
          });
          dropoffMarkerRef.current = L.marker([dLat, dLon], { icon: dropoffIcon }).addTo(map);
          dropoffMarkerRef.current.bindPopup(`<b>Destination:</b> ${dropoffLocation?.name || "Dropoff"}`);
        }

        // Fetch and draw road route between Pickup and Dropoff along actual street network
        if (hasPickup && hasDropoff && !routePolylineRef.current && !isFetchingRouteRef.current) {
          isFetchingRouteRef.current = true;
          (async () => {
            let waypoints: { lat: number; lon: number }[] = [
              { lat: pLat, lon: pLon },
              { lat: dLat, lon: dLon },
            ];

            try {
              const res = await api.post("/location/route", {
                start: { name: pickupLocation?.name || "Pickup", lat: pLat, lon: pLon },
                end: { name: dropoffLocation?.name || "Dropoff", lat: dLat, lon: dLon },
              });
              const raw = res.data?.data || res.data;
              const pts = Array.isArray(raw) ? raw : raw?.pickupLocations || raw?.routePoints;
              if (Array.isArray(pts) && pts.length >= 2) {
                const validPts = pts
                  .map((p: any) => ({ lat: Number(p.lat), lon: Number(p.lon) }))
                  .filter((p) => !isNaN(p.lat) && !isNaN(p.lon) && p.lat !== 0);
                if (validPts.length >= 2) {
                  waypoints = validPts;
                }
              }
            } catch (e) {
              // Proceed with start and end points
            }

            const roadCoords = await fetchRoadGeometry(waypoints);
            if (!isMounted || !mapInstanceRef.current) return;

            const latLngs: [number, number][] =
              roadCoords && roadCoords.length > 1
                ? roadCoords
                : [
                    [pLat, pLon],
                    [dLat, dLon],
                  ];

            // Layer 1: Ambient outer glow
            if (ambientGlowPolylineRef.current) {
              mapInstanceRef.current.removeLayer(ambientGlowPolylineRef.current);
            }
            ambientGlowPolylineRef.current = L.polyline(latLngs, {
              color: "#0F766E",
              weight: 12,
              opacity: 0.16,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(mapInstanceRef.current);

            // Layer 2: Deep road casing
            if (roadCasingPolylineRef.current) {
              mapInstanceRef.current.removeLayer(roadCasingPolylineRef.current);
            }
            roadCasingPolylineRef.current = L.polyline(latLngs, {
              color: "#042F2E",
              weight: 6.5,
              opacity: 0.75,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(mapInstanceRef.current);

            // Layer 3: Vibrant core road route
            if (routePolylineRef.current) {
              mapInstanceRef.current.removeLayer(routePolylineRef.current);
            }
            routePolylineRef.current = L.polyline(latLngs, {
              color: "#14B8A6",
              weight: 4.5,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(mapInstanceRef.current);

            mapInstanceRef.current.fitBounds(latLngs, { padding: [55, 55] });
          })();
        }
      }

      // Add or update Passenger's "You" location marker
      if (mapInstanceRef.current && passengerCoords) {
        const youIcon = L.divIcon({
          className: "passenger-you-marker",
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
              <div style="
                background: rgba(30, 58, 138, 0.92);
                color: white;
                font-size: 10px;
                font-weight: 700;
                padding: 2px 7px;
                border-radius: 9999px;
                box-shadow: 0 3px 8px rgba(30, 58, 138, 0.35);
                border: 1px solid rgba(255, 255, 255, 0.85);
                margin-bottom: 3px;
                white-space: nowrap;
              ">
                You
              </div>
              <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #3B82F6; opacity: 0.5; animation: pulse-ring 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;"></span>
                <span style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></span>
              </div>
            </div>
          `,
          iconSize: [40, 48],
          iconAnchor: [20, 36],
        });

        if (!passengerMarkerRef.current) {
          passengerMarkerRef.current = L.marker([passengerCoords.lat, passengerCoords.lon], {
            icon: youIcon,
            zIndexOffset: 500,
          }).addTo(mapInstanceRef.current);
          passengerMarkerRef.current.bindPopup("<b>Your Current Location</b>");
        } else {
          passengerMarkerRef.current.setLatLng([passengerCoords.lat, passengerCoords.lon]);
        }
      }

      // Add or update Driver's CAR marker (3D Top-Down Car with Headlights Beam)
      if (mapInstanceRef.current && trackingData?.lat && trackingData?.lon) {
        mapInstanceRef.current.invalidateSize();

        const carHeading = trackingData.heading || 0;
        const carIcon = L.divIcon({
          className: "driver-car-symbol-marker",
          html: `
            <div style="
              position: relative;
              width: 52px;
              height: 52px;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${carHeading}deg);
              transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
            ">
              <!-- Dynamic Headlight Projection Beam -->
              <div style="
                position: absolute;
                top: -36px;
                left: 50%;
                transform: translateX(-50%);
                width: 64px;
                height: 44px;
                background: radial-gradient(ellipse at 50% 100%, rgba(253, 224, 71, 0.5) 0%, rgba(253, 224, 71, 0.18) 45%, transparent 75%);
                clip-path: polygon(32% 100%, 68% 100%, 100% 0%, 0% 0%);
                pointer-events: none;
                z-index: 1;
              "></div>

              <!-- Soft Ambient Ground Shadow -->
              <div style="
                position: absolute;
                width: 32px;
                height: 44px;
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.28);
                filter: blur(4px);
                transform: translateY(3px);
              "></div>

              <!-- High-Fidelity 3D Car Vector -->
              <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: relative; z-index: 2; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));">
                <!-- Wheels -->
                <rect x="8.5" y="8" width="5" height="9" rx="2.5" fill="#0F172A"/>
                <rect x="34.5" y="8" width="5" height="9" rx="2.5" fill="#0F172A"/>
                <rect x="8.5" y="30" width="5" height="9" rx="2.5" fill="#0F172A"/>
                <rect x="34.5" y="30" width="5" height="9" rx="2.5" fill="#0F172A"/>

                <!-- Main Chassis Body with Gradient -->
                <rect x="12" y="5" width="24" height="38" rx="8" fill="#0F766E" stroke="#FFFFFF" stroke-width="2.5"/>

                <!-- Hood Accent Line -->
                <path d="M19 8 L29 8" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round"/>

                <!-- Roof -->
                <rect x="15.5" y="16" width="17" height="15" rx="4" fill="#0B5E58"/>

                <!-- Front Windshield with Gloss -->
                <path d="M15 15.5 C15 12, 33 12, 33 15.5 L31.5 19.5 L16.5 19.5 Z" fill="#93C5FD"/>

                <!-- Rear Windshield -->
                <path d="M16 31 C16 34, 32 34, 32 31 L31 28.5 L17 28.5 Z" fill="#60A5FA"/>

                <!-- High-Luminance Headlights -->
                <circle cx="16" cy="7" r="2.2" fill="#FEF08A"/>
                <circle cx="32" cy="7" r="2.2" fill="#FEF08A"/>

                <!-- Rear Tail Lights (Glowing Crimson) -->
                <rect x="14.5" y="40.5" width="4.5" height="2" rx="1" fill="#EF4444"/>
                <rect x="29" y="40.5" width="4.5" height="2" rx="1" fill="#EF4444"/>
              </svg>
            </div>
          `,
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        });

        if (!driverMarkerRef.current) {
          driverMarkerRef.current = L.marker([trackingData.lat, trackingData.lon], {
            icon: carIcon,
            zIndexOffset: 1000,
          }).addTo(mapInstanceRef.current);
          driverMarkerRef.current.bindPopup("<b>Driver Live Location</b>");
          mapInstanceRef.current.panTo([trackingData.lat, trackingData.lon], { animate: true });
        } else {
          driverMarkerRef.current.setLatLng([trackingData.lat, trackingData.lon]);
          driverMarkerRef.current.setIcon(carIcon);
          mapInstanceRef.current.panTo([trackingData.lat, trackingData.lon], { animate: true });
        }

        // Real street road route from Driver Car to Pickup point
        if (hasPickup && mapInstanceRef.current) {
          const distToPickup = getDistanceMeters(trackingData.lat, trackingData.lon, pLat, pLon);
          if (distToPickup < 45) {
            // Driver is at pickup point - remove approaching route line
            if (driverToPickupLineRef.current) {
              mapInstanceRef.current.removeLayer(driverToPickupLineRef.current);
              driverToPickupLineRef.current = null;
            }
            if (driverGlowLineRef.current) {
              mapInstanceRef.current.removeLayer(driverGlowLineRef.current);
              driverGlowLineRef.current = null;
            }
          } else {
            const timeSinceLast = Date.now() - lastDriverRouteFetchRef.current.time;
            const distFromLast = getDistanceMeters(
              trackingData.lat,
              trackingData.lon,
              lastDriverRouteFetchRef.current.lat,
              lastDriverRouteFetchRef.current.lon
            );

            // Fetch road route if first time or driver moved > 50m or > 12s
            if (timeSinceLast > 12000 || distFromLast > 50 || !driverToPickupLineRef.current) {
              lastDriverRouteFetchRef.current = {
                lat: trackingData.lat,
                lon: trackingData.lon,
                time: Date.now(),
              };

              fetchRoadGeometry([
                { lat: trackingData.lat, lon: trackingData.lon },
                { lat: pLat, lon: pLon },
              ]).then((coords) => {
                if (!isMounted || !mapInstanceRef.current) return;
                const pathCoords: [number, number][] =
                  coords && coords.length > 1
                    ? coords
                    : [
                        [trackingData.lat, trackingData.lon],
                        [pLat, pLon],
                      ];

                // Outer blue glow
                if (driverGlowLineRef.current) {
                  driverGlowLineRef.current.setLatLngs(pathCoords);
                } else {
                  driverGlowLineRef.current = L.polyline(pathCoords, {
                    color: "#3B82F6",
                    weight: 10,
                    opacity: 0.22,
                    lineCap: "round",
                    lineJoin: "round",
                  }).addTo(mapInstanceRef.current);
                }

                // Core electric blue road
                if (driverToPickupLineRef.current) {
                  driverToPickupLineRef.current.setLatLngs(pathCoords);
                } else {
                  driverToPickupLineRef.current = L.polyline(pathCoords, {
                    color: "#2563EB",
                    weight: 4,
                    dashArray: "8, 10",
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                  }).addTo(mapInstanceRef.current);
                }
              });
            }
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, trackingData, pickupLocation, dropoffLocation, passengerCoords]);

  // Teardown map on modal close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      driverMarkerRef.current = null;
      passengerMarkerRef.current = null;
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      if (ambientGlowPolylineRef.current) {
        mapInstanceRef.current?.removeLayer(ambientGlowPolylineRef.current);
        ambientGlowPolylineRef.current = null;
      }
      if (roadCasingPolylineRef.current) {
        mapInstanceRef.current?.removeLayer(roadCasingPolylineRef.current);
        roadCasingPolylineRef.current = null;
      }
      routePolylineRef.current = null;
      if (driverGlowLineRef.current) {
        mapInstanceRef.current?.removeLayer(driverGlowLineRef.current);
        driverGlowLineRef.current = null;
      }
      driverToPickupLineRef.current = null;
      isFetchingRouteRef.current = false;
      lastDriverRouteFetchRef.current = { lat: 0, lon: 0, time: 0 };
      setTrackingData(null);
      setPassengerCoords(null);
      setIsStale(false);
      setIsFinished(false);
      setFinishedStatus(null);
    }
  }, [isOpen]);

  const pLat = Number(pickupLocation?.lat);
  const pLon = Number(pickupLocation?.lon);
  const hasPickup = !isNaN(pLat) && !isNaN(pLon) && pLat !== 0;

  const dLat = Number(dropoffLocation?.lat);
  const dLon = Number(dropoffLocation?.lon);
  const hasDropoff = !isNaN(dLat) && !isNaN(dLon) && dLat !== 0;

  const distToPickup =
    trackingData?.lat && trackingData?.lon && hasPickup
      ? getDistanceMeters(trackingData.lat, trackingData.lon, pLat, pLon)
      : null;

  const distToDropoff =
    trackingData?.lat && trackingData?.lon && hasDropoff
      ? getDistanceMeters(trackingData.lat, trackingData.lon, dLat, dLon)
      : null;

  const pickupDisplayName =
    pickupLocation?.name ||
    (typeof pickupLocation === "string" ? pickupLocation : "Pickup Location");
  const dropoffDisplayName =
    dropoffLocation?.name ||
    (typeof dropoffLocation === "string" ? dropoffLocation : "Dropoff Location");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121216] p-0 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-foreground">
        {/* Top Header Bar */}
        <DialogHeader className="border-b border-black/5 dark:border-white/10 px-6 py-4 bg-white/80 dark:bg-[#121216]/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                <Navigation className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  Live Trip Tracking
                  {tripcode && (
                    <Badge variant="secondary" className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80 px-2 py-0.5 border border-black/5 dark:border-white/10">
                      #{tripcode}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Real-time turn-by-turn vehicle telemetry and GPS feed
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isFinished ? (
                <Badge
                  variant={finishedStatus === "COMPLETED" ? "default" : "destructive"}
                  className="gap-1.5 py-1 px-3 shadow-sm text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {finishedStatus === "COMPLETED" ? "Trip Completed" : "Trip Cancelled"}
                </Badge>
              ) : trackingData ? (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                  </span>
                  <span>Streaming Live</span>
                </div>
              ) : (
                <Badge variant="outline" className="text-muted-foreground bg-muted/60 dark:bg-white/10 dark:text-white/70 dark:border-white/15 text-xs">
                  Connecting...
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Warning notification banner if signal is weak */}
        {isStale && !isFinished && (
          <div className="bg-amber-50 dark:bg-amber-950/40 px-5 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 border-b border-amber-200 dark:border-amber-800/50">
            <Clock className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium">Driver GPS signal updating...</span>
            <span className="text-amber-700 dark:text-amber-400/80 ml-auto">Last ping was &gt;30s ago</span>
          </div>
        )}

        {/* Leaflet Map Canvas with Floating HUD */}
        <div className={`relative h-[480px] w-full bg-[#f1f5f9] dark:bg-[#0c0f17] overflow-hidden live-map-wrapper ${isDark && mapTheme !== "satellite" ? "dark-tiles" : ""}`}>
          <style>{`
            .leaflet-control-attribution { display: none !important; }
            .live-map-wrapper.dark-tiles .leaflet-tile-pane {
              filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(92%);
            }
            .live-map-wrapper .leaflet-container {
              background: ${isDark ? "#0c0f17" : "#f1f5f9"} !important;
            }
            @keyframes pulse-ring {
              0% { transform: scale(0.9); opacity: 0.7; }
              50% { opacity: 0.3; }
              100% { transform: scale(2.2); opacity: 0; }
            }
          `}</style>

          {/* Leaflet Container */}
          <div
            ref={mapContainerRef}
            style={{ height: "480px", width: "100%", zIndex: 0 }}
            className="h-full w-full"
          />

          {/* Floating Top-Left Telemetry Card (Glassmorphism) */}
          <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-auto">
            <div className="backdrop-blur-md bg-white/92 dark:bg-[#121216]/92 shadow-xl border border-black/10 dark:border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5 min-w-[210px] sm:min-w-[240px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-muted-foreground">
                  Ride Telemetry
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                  <Zap className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                  Active
                </span>
              </div>

              {/* Status Header */}
              <div className="flex items-center gap-2">
                {distToPickup !== null && distToPickup < 45 ? (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Driver Arrived at Pickup</span>
                ) : distToPickup !== null ? (
                  <span className="text-xs font-bold text-slate-800 dark:text-foreground">Driver on the way</span>
                ) : (
                  <span className="text-xs font-bold text-slate-800 dark:text-foreground">Trip in Progress</span>
                )}
              </div>

              {/* Metric Chips */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-white/10 text-xs">
                <div className="bg-slate-50/90 dark:bg-white/5 rounded-xl p-2 flex flex-col border border-slate-200/60 dark:border-white/10">
                  <span className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">Distance</span>
                  <span className="font-bold text-slate-800 dark:text-foreground mt-0.5 text-sm">
                    {distToPickup !== null
                      ? formatDistance(distToPickup)
                      : distToDropoff !== null
                      ? formatDistance(distToDropoff)
                      : "--"}
                  </span>
                </div>
                <div className="bg-slate-50/90 dark:bg-white/5 rounded-xl p-2 flex flex-col border border-slate-200/60 dark:border-white/10">
                  <span className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">Est. Arrival</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400 mt-0.5 text-sm">
                    {distToPickup !== null
                      ? formatEta(distToPickup, trackingData?.speed)
                      : distToDropoff !== null
                      ? formatEta(distToDropoff, trackingData?.speed)
                      : "--"}
                  </span>
                </div>
              </div>

              {/* Live Speedometer */}
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-muted-foreground bg-slate-50/90 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/10">
                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                  <Gauge className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Speed
                </span>
                <span className="font-bold text-slate-800 dark:text-foreground text-xs">
                  {trackingData?.speed !== undefined && trackingData?.speed !== null
                    ? `${Math.round(trackingData.speed * 3.6)} km/h`
                    : "Stationary"}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Top-Right Map Controls (Glass FABs) */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleRecenter}
              className="h-10 w-10 rounded-full backdrop-blur-md bg-white/95 dark:bg-[#18181d]/90 shadow-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white/80 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-[#222228] active:scale-95 transition-all group"
              title="Center on driver vehicle"
            >
              <LocateFixed className="h-4 w-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleFitRoute}
              className="h-10 w-10 rounded-full backdrop-blur-md bg-white/95 dark:bg-[#18181d]/90 shadow-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white/80 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-[#222228] active:scale-95 transition-all group"
              title="Fit full journey route"
            >
              <Maximize2 className="h-4 w-4 text-slate-600 dark:text-white/70 group-hover:scale-110 transition-transform" />
            </button>

            <button
              type="button"
              onClick={toggleMapTheme}
              className="h-10 w-10 rounded-full backdrop-blur-md bg-white/95 dark:bg-[#18181d]/90 shadow-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white/80 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-[#222228] active:scale-95 transition-all group"
              title={`Switch to ${mapTheme === "streets" ? "Satellite" : "Street"} map`}
            >
              <Layers className="h-4 w-4 text-slate-600 dark:text-white/70 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Enhanced Bottom Journey Stepper & Info Bar */}
        <div className="border-t border-black/5 dark:border-white/10 bg-[#FAFAF8] dark:bg-[#121216] px-6 py-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Visual Route Timeline */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2 truncate">
                <div className="h-3 w-3 rounded-full bg-teal-600 ring-4 ring-teal-500/20 dark:ring-teal-500/30 shrink-0"></div>
                <div className="flex flex-col truncate">
                  <span className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">From</span>
                  <span className="font-semibold text-slate-800 dark:text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                    {pickupDisplayName}
                  </span>
                </div>
              </div>

              {/* Progress Connector */}
              <div className="flex-1 flex items-center justify-center px-2 relative min-w-[50px] max-w-[130px]">
                <div className="w-full h-0.5 bg-slate-200 dark:bg-white/15 relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-amber-500 animate-pulse"></div>
                </div>
                <div className="h-5 w-5 rounded-full bg-white dark:bg-[#1c1c22] shadow-xs border border-slate-200 dark:border-white/15 flex items-center justify-center absolute">
                  <Navigation className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400 rotate-90" />
                </div>
              </div>

              <div className="flex items-center gap-2 truncate">
                <div className="h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20 dark:ring-amber-500/30 shrink-0"></div>
                <div className="flex flex-col truncate">
                  <span className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">To</span>
                  <span className="font-semibold text-slate-800 dark:text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                    {dropoffDisplayName}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Meta Chips */}
            <div className="flex items-center gap-3 shrink-0 sm:ml-auto text-slate-500 dark:text-muted-foreground text-[11px]">
              {passengerCoords && (
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  You on map
                </span>
              )}

              {trackingData?.updatedAt && (
                <span className="text-slate-400 dark:text-muted-foreground text-[11px]">
                  Signal: {new Date(trackingData.updatedAt).toLocaleTimeString()}
                </span>
              )}

              <Badge variant="outline" className="border-teal-500/20 text-teal-700 dark:text-teal-400 bg-teal-500/10 gap-1 py-1 font-medium">
                <ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                Verified GPS
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
