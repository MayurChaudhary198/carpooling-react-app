import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/hooks/useAppDispatch";
import {
  getStartableTrips,
  startTrip,
  getStartTripErrorMessage,
} from "@/services/tripService";
import {
  writeDriverTrackingLocation,
  type StartableTrip,
  type FirebaseTrackingData,
} from "@carpooling/common";

interface ActiveTrackingSession {
  tripId: string;
  driverId: string;
  databasePath: string;
}

interface DriverTrackingContextType {
  isTracking: boolean;
  activeSession: ActiveTrackingSession | null;
  lastTrackingData: FirebaseTrackingData | null;
  activeStartableModalTrip: StartableTrip | null;
  dismissStartableModal: () => void;
  checkStartableTrips: () => Promise<void>;
  handleStartTrip: (tripId: string) => Promise<boolean>;
  stopTracking: (finalStatus?: "COMPLETED" | "CANCELLED") => Promise<void>;
}

const DriverTrackingContext = createContext<DriverTrackingContextType | undefined>(
  undefined
);

const STORAGE_ACTIVE_TRACKING = "driver_active_tracking_session";
const THROTTLE_INTERVAL_MS = 3500; // 3.5 seconds throttle

export const DriverTrackingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, token } = useAppSelector((s) => s.auth);
  const [activeSession, setActiveSession] = useState<ActiveTrackingSession | null>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_ACTIVE_TRACKING);
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
  );
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [lastTrackingData, setLastTrackingData] =
    useState<FirebaseTrackingData | null>(null);

  const [activeStartableModalTrip, setActiveStartableModalTrip] =
    useState<StartableTrip | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const latestDataRef = useRef<FirebaseTrackingData | null>(null);
  const lastWriteTimeRef = useRef<number>(0);
  const dismissedTripsRef = useRef<Record<string, number>>({});

  // Clean up watcher when component unmounts
  const clearWatcher = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (heartbeatTimerRef.current !== null) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Stop tracking
  const stopTracking = useCallback(
    async (finalStatus: "COMPLETED" | "CANCELLED" = "COMPLETED") => {
      clearWatcher();
      if (activeSession && (lastTrackingData || latestDataRef.current)) {
        try {
          const baseData = lastTrackingData || latestDataRef.current;
          if (baseData) {
            await writeDriverTrackingLocation(activeSession.databasePath, {
              ...baseData,
              status: finalStatus,
              updatedAt: Date.now(),
            });
          }
        } catch (e) {
          console.warn("Failed to write final tracking status:", e);
        }
      }
      setActiveSession(null);
      setLastTrackingData(null);
      latestDataRef.current = null;
      localStorage.removeItem(STORAGE_ACTIVE_TRACKING);
    },
    [activeSession, lastTrackingData, clearWatcher]
  );

  // Stop tracking if driver logs out
  useEffect(() => {
    if (!token || !user) {
      clearWatcher();
      setActiveSession(null);
      latestDataRef.current = null;
      localStorage.removeItem(STORAGE_ACTIVE_TRACKING);
    }
  }, [token, user, clearWatcher]);

  // Start watching position
  const beginGeolocationWatch = useCallback(
    (session: ActiveTrackingSession) => {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.");
        return;
      }

      clearWatcher();
      setIsTracking(true);

      const success = (pos: GeolocationPosition) => {
        const now = Date.now();
        const data: FirebaseTrackingData = {
          tripId: session.tripId,
          driverId: session.driverId,
          status: "ONGOING",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          heading: pos.coords.heading ?? null,
          speed: pos.coords.speed ?? null,
          accuracy: pos.coords.accuracy ?? null,
          updatedAt: now,
        };

        latestDataRef.current = data;
        setLastTrackingData(data);

        // Throttle write to Firebase: write every 3.5s
        if (now - lastWriteTimeRef.current >= THROTTLE_INTERVAL_MS) {
          lastWriteTimeRef.current = now;
          writeDriverTrackingLocation(session.databasePath, data).catch((err) => {
            console.error("Error streaming driver location to Firebase:", err);
          });
        }
      };

      const error = (err: GeolocationPositionError) => {
        console.warn("Driver geolocation watch error:", err.message);
        toast.error(`GPS Error: ${err.message}. Please check browser location permissions.`, {
          id: "driver-gps-error",
        });
      };

      // 1. Immediate position fix
      navigator.geolocation.getCurrentPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 8000,
      });

      // 2. Continuous watch
      const watchId = navigator.geolocation.watchPosition(success, error, {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      });
      watchIdRef.current = watchId;

      // 3. Heartbeat: periodically refresh updatedAt and stream to Firebase even if vehicle is stationary
      heartbeatTimerRef.current = setInterval(() => {
        if (latestDataRef.current) {
          const freshData: FirebaseTrackingData = {
            ...latestDataRef.current,
            updatedAt: Date.now(),
          };
          writeDriverTrackingLocation(session.databasePath, freshData).catch((err) => {
            console.warn("Heartbeat broadcast error:", err);
          });
        }
      }, 4000);
    },
    [clearWatcher]
  );

  // Resume tracking session if saved in localStorage on page load
  useEffect(() => {
    if (activeSession && token && user) {
      beginGeolocationWatch(activeSession);
    }
    return () => {
      clearWatcher();
    };
  }, [activeSession, token, user, beginGeolocationWatch, clearWatcher]);

  // Check startable trips from backend GET /api/trip/startable
  const checkStartableTrips = useCallback(async () => {
    if (!token || user?.role !== "DRIVER") return;
    try {
      const trips = await getStartableTrips();
      if (Array.isArray(trips) && trips.length > 0) {
        // Find first startable trip not dismissed in last 3 minutes
        const now = Date.now();
        const eligibleTrip = trips.find((t) => {
          const tripId = t.id || t._id;
          if (!tripId) return false;
          const dismissedAt = dismissedTripsRef.current[tripId];
          return !dismissedAt || now - dismissedAt > 3 * 60 * 1000;
        });

        if (eligibleTrip) {
          setActiveStartableModalTrip(eligibleTrip);
        }
      }
    } catch (err) {
      console.warn("Failed checking startable trips:", err);
    }
  }, [token, user]);

  // Polling interval: every 45 seconds while driver is active
  useEffect(() => {
    if (!token || user?.role !== "DRIVER") return;

    checkStartableTrips();
    const interval = setInterval(checkStartableTrips, 45000);
    return () => clearInterval(interval);
  }, [token, user, checkStartableTrips]);

  const dismissStartableModal = () => {
    if (activeStartableModalTrip) {
      const tripId = activeStartableModalTrip.id || activeStartableModalTrip._id;
      if (tripId) {
        dismissedTripsRef.current[tripId] = Date.now();
      }
    }
    setActiveStartableModalTrip(null);
  };

  const handleStartTrip = async (tripId: string): Promise<boolean> => {
    try {
      const response = await startTrip(tripId);
      toast.success("Trip started! Passengers notified & live GPS streaming.");

      const databasePath =
        response.tracking?.databasePath || `tripTracking/${tripId}`;

      const session: ActiveTrackingSession = {
        tripId,
        driverId: user?.id || "",
        databasePath,
      };

      setActiveSession(session);
      localStorage.setItem(STORAGE_ACTIVE_TRACKING, JSON.stringify(session));
      setActiveStartableModalTrip(null);

      // Immediately begin geolocation watching
      beginGeolocationWatch(session);
      return true;
    } catch (err: any) {
      const message = getStartTripErrorMessage(err);
      toast.error(message);
      return false;
    }
  };

  return (
    <DriverTrackingContext.Provider
      value={{
        isTracking,
        activeSession,
        lastTrackingData,
        activeStartableModalTrip,
        dismissStartableModal,
        checkStartableTrips,
        handleStartTrip,
        stopTracking,
      }}
    >
      {children}
    </DriverTrackingContext.Provider>
  );
};

export const useDriverTracking = () => {
  const context = useContext(DriverTrackingContext);
  if (!context) {
    throw new Error(
      "useDriverTracking must be used within a DriverTrackingProvider"
    );
  }
  return context;
};
