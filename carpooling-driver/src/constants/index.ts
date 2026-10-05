import type { User } from "@/types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const STORAGE_KEYS = {
  token: "token",
  user: "user",
  refreshToken: "refreshToken",
} as const;

export const USER_ROLES = {
  admin: "ADMIN",
  driver: "DRIVER",
  passenger: "PASSENGER",
} as const satisfies Record<string, User["role"]>;

export const ROUTES = {
  root: "/",
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  driver: {
    root: "/driver",
    dashboard: "/driver/dashboard",
    documents: "/driver/documents",
    documentsView: "/driver/documents-view",
    carSetup: "/driver/car-setup",
    car: "/driver/car",
    trips: "/driver/trips",
    tripDetails: (id: string) => `/driver/trips/${id}`,
    bookings: "/driver/bookings",
    chat: "/driver/chat",
    chatRoom: (id: string) => `/driver/chat/${id}`,
    profile: "/driver/profile",
  },
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refreshToken: "/auth/refresh-token",
    sendRegistrationOtp: "/auth/send-registration-otp",
    verifyOtp: "/auth/verify-otp",
  },
  car: {
    add: "/car/add-car",
    documents: "/car/documents",
    myCars: "/car/my-cars",
  },
  trip: {
    list: "/trip",
    details: (id: string) => `/trip/${id}`,
    startable: "/trip/startable",
    start: (id: string) => `/trip/${id}/start`,
    sendPickupOtp: (tripId: string, bookingId: string) =>
      `/trip/${tripId}/pickup/${bookingId}`,
    verifyOtp: (id: string) => `/trip/${id}/verify-otp`,
  },
  booking: {
    list: "/booking",
    updateStatus: (bookingId: string, status: string) =>
      `/booking/${bookingId}/${status}`,
  },
  location: {
    search: (query: string) =>
      `/location/search?q=${encodeURIComponent(query)}`,
    route: "/location/route",
  },
  chat: {
    root: "/chat",
    list: "/chat/get-my-chats",
    create: "/chat",
    messages: (id: string) => `/chat/${id}/messages`,
  },
  user: {
    profile: "/user/profile",
  },
} as const;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_BASE_URL.replace(/\/api$/, "") ||
  "http://localhost:5000";

export const TRIP_STATUS = {
  scheduled: "SCHEDULED",
  ongoing: "ONGOING",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
} as const;

export const BOOKING_STATUS = {
  pending: "PENDING",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  completed: "COMPLETED",
} as const;

export const DOCUMENT_STATUS = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
} as const;

export const TRIP_STATUS_STYLES: Record<string, string> = {
  [TRIP_STATUS.scheduled]: "bg-blue-100 text-blue-700",
  [TRIP_STATUS.ongoing]: "bg-green-100 text-green-700",
  [TRIP_STATUS.completed]: "bg-gray-100 text-gray-700",
  [TRIP_STATUS.cancelled]: "bg-red-100 text-red-700",
};

export const BOOKING_STATUS_STYLES: Record<string, string> = {
  [BOOKING_STATUS.pending]: "bg-yellow-100 text-yellow-700",
  [BOOKING_STATUS.accepted]: "bg-green-100 text-green-700",
  [BOOKING_STATUS.rejected]: "bg-red-100 text-red-700",
  [BOOKING_STATUS.cancelled]: "bg-gray-100 text-gray-700",
  [BOOKING_STATUS.completed]: "bg-blue-100 text-blue-700",
};
