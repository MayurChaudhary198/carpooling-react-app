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
  },
  chat: {
    root: "/chat",
    room: "/chat/:chatId",
    driver: "/driver/chat",
    passenger: "/passenger/chat",
  },
  admin: {
    root: "/admin",
    dashboard: "/admin/dashboard",
    drivers: "/admin/drivers",
    passengers: "/admin/passengers",
    trips: "/admin/trips",
    bookings: "/admin/bookings",
    documents: "/admin/documents",
  },
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    refreshToken: "/auth/refresh-token",
  },
  chat: {
    root: "/chat",
    list: "/chat/get-my-chats",
    messages: (chatId: string) => `/chat/${chatId}/messages`,
  },
  admin: {
    users: "/admin/users",
    trips: "/admin/trips",
    bookings: "/admin/bookings",
    documents: "/admin/documents",
    stats: "/admin/stats",
  },
} as const;
