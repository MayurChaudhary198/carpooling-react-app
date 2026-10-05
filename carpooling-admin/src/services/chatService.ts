import { API_ENDPOINTS } from "@/constants";
import api from "@/services/api";
import type { PaginationMeta } from "@/services/adminUsersService";
import { unwrapApiData } from "@/lib/apiResponse";

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    name?: string;
  };
}

export interface ChatRide {
  origin: string;
  destinationLocation: string;
  departureTime: string;
}

export interface ChatParticipant {
  name: string;
}

export interface Chat {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  message: ChatMessage[];
  sender: ChatParticipant;
  receiver: ChatParticipant;
  ride: ChatRide;
  unreadCount?: number;
}

export interface ChatListResponse {
  data: Chat[];
  meta: PaginationMeta;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  meta: PaginationMeta;
}

export interface ChatPaginationRequest {
  pagination: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
}

export function normalizeChat(chat: any): Chat {
  return {
    id: chat?.id ?? "",
    rideId: chat?.rideId ?? "",
    senderId: chat?.senderId ?? "",
    receiverId: chat?.receiverId ?? "",
    createdAt: chat?.createdAt ?? new Date().toISOString(),
    message: Array.isArray(chat?.message) ? chat.message : [],
    sender: chat?.sender ?? { name: "User" },
    receiver: chat?.receiver ?? { name: "User" },
    ride: {
      origin: chat?.ride?.origin ?? "",
      destinationLocation: chat?.ride?.destinationLocation ?? (chat?.ride as any)?.destination ?? "",
      departureTime: chat?.ride?.departureTime ?? new Date().toISOString(),
    },
    unreadCount: chat?.unreadCount ?? 0,
  };
}

function normalizeChatListResponse<T>(payload: unknown): {
  data: T[];
  meta: PaginationMeta;
} {
  const candidate = unwrapApiData<any>(payload);

  if (candidate?.success && candidate?.data) {
    return normalizeChatListResponse<T>(candidate.data);
  }

  let items: any[] = [];
  let meta: PaginationMeta = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  if (Array.isArray(candidate)) {
    items = candidate;
    meta.total = items.length;
    meta.totalPages = Math.ceil(items.length / meta.limit) || 1;
  } else if (candidate?.data && Array.isArray(candidate.data.data)) {
    items = candidate.data.data;
    meta = { ...meta, ...(candidate.data.meta || {}) };
  } else if (Array.isArray(candidate?.data)) {
    items = candidate.data;
    meta = { ...meta, ...(candidate.meta || {}) };
  }

  const normalized = items.map((item) =>
    item && typeof item === "object" && "rideId" in item ? normalizeChat(item) : item
  );

  return {
    data: normalized as T[],
    meta,
  };
}

export async function createChat(bookingId: string) {
  const response = await api.post<Chat>(API_ENDPOINTS.chat.root, { bookingId });
  const raw = unwrapApiData<any>(response.data);
  return normalizeChat(raw);
}

export async function fetchMyChats(body: ChatPaginationRequest) {
  const response = await api.post<unknown>(API_ENDPOINTS.chat.list, body);
  return normalizeChatListResponse<Chat>(response.data);
}

export async function fetchChatMessages(
  chatId: string,
  body: ChatPaginationRequest
) {
  const response = await api.post<unknown>(
    API_ENDPOINTS.chat.messages(chatId),
    body
  );
  return normalizeChatListResponse<ChatMessage>(response.data);
}
