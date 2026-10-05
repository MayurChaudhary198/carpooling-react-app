import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  off,
  type Database,
} from "firebase/database";
import type { FirebaseTrackingData } from "../types";

const getFirebaseConfig = () => {
  const env =
    typeof import.meta !== "undefined" && (import.meta as any).env
      ? (import.meta as any).env
      : {};

  return {
    apiKey:
      env.VITE_FIREBASE_API_KEY || "AIzaSyAzzPDiB3J359Ny_fWkJhF4OqSOjn3NoYQ",
    authDomain:
      env.VITE_FIREBASE_AUTH_DOMAIN || "carpooling-app-4879a.firebaseapp.com",
    databaseURL:
      env.VITE_FIREBASE_DATABASE_URL ||
      "https://carpooling-app-4879a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "carpooling-app-4879a",
    storageBucket:
      env.VITE_FIREBASE_STORAGE_BUCKET || "carpooling-app-4879a.firebasestorage.app",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "988389117509",
    appId:
      env.VITE_FIREBASE_APP_ID || "1:988389117509:web:79c2d3817d3f6ea5f6dd2c",
  };
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Database | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;

  const apps = getApps();
  if (apps.length > 0) {
    appInstance = apps[0];
    return appInstance;
  }

  const config = getFirebaseConfig();
  appInstance = initializeApp(config);
  return appInstance;
}

export function getFirebaseDb(): Database | null {
  if (dbInstance) return dbInstance;
  try {
    const app = getFirebaseApp();
    const config = getFirebaseConfig();
    dbInstance = getDatabase(app, config.databaseURL);
    return dbInstance;
  } catch (err) {
    console.warn("Failed to initialize Firebase Realtime Database:", err);
    return null;
  }
}

/**
 * Driver writes live location to Firebase path (e.g. tripTracking/trip-id)
 */
export async function writeDriverTrackingLocation(
  databasePath: string,
  data: FirebaseTrackingData
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firebase DB not available to write tracking location.");
    return;
  }

  const cleanPath = databasePath.startsWith("/")
    ? databasePath.slice(1)
    : databasePath;
  const trackingRef = ref(db, cleanPath);
  await set(trackingRef, data);
  console.log("[Firebase RTDB] Broadcast updated:", cleanPath, data);
}

/**
 * Passenger subscribes to driver tracking updates on tripTracking/{tripId}
 */
export function subscribeToTripTracking(
  tripId: string,
  onData: (data: FirebaseTrackingData | null) => void,
  onError?: (err: Error) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) {
    console.warn("Firebase DB not available for tracking subscription.");
    return () => {};
  }

  const path = `tripTracking/${tripId}`;
  const trackingRef = ref(db, path);

  const unsubscribe = onValue(
    trackingRef,
    (snapshot: any) => {
      if (snapshot && typeof snapshot.exists === "function" && snapshot.exists()) {
        const val = snapshot.val() as FirebaseTrackingData;
        onData(val);
      } else {
        onData(null);
      }
    },
    (err: any) => {
      console.warn(`Firebase tracking subscription error on ${path}:`, err);
      if (onError) onError(err);
    }
  );

  return () => {
    try {
      off(trackingRef);
      unsubscribe();
    } catch {
      // Ignore cleanup error
    }
  };
}
