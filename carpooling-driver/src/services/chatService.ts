import api from "@/services/api";
import { API_ENDPOINTS } from "@/constants";
import type {
  ChatConversation,
  ChatMessage,
  PaginationMeta,
} from "@/types";
import { unwrapApiData } from "@/lib/apiResponse";

type ApiMessage = Partial<ChatMessage> & {
  sender?: { name: string };
};

type ApiChat = Partial<ChatConversation> & {
  message?: ApiMessage[];
};

type ChatListResponse = {
  data?: ApiChat[];
  meta?: Partial<PaginationMeta>;
};

type ChatMessagesResponse = {
  data?: ApiMessage[];
  meta?: Partial<PaginationMeta>;
};

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const normalizeMessage = (message: ApiMessage): ChatMessage => ({
  id: message.id ?? crypto.randomUUID(),
  chatId: message.chatId ?? "",
  senderId: message.senderId ?? "",
  content: message.content ?? "",
  isRead: Boolean(message.isRead),
  createdAt: message.createdAt ?? new Date().toISOString(),
  sender: message.sender,
});

const normalizeChat = (chat: ApiChat): ChatConversation => {
  const messages = (chat.message ?? []).map(normalizeMessage);

  return {
    id: chat.id ?? crypto.randomUUID(),
    rideId: chat.rideId ?? "",
    senderId: chat.senderId ?? "",
    receiverId: chat.receiverId ?? "",
    createdAt: chat.createdAt ?? new Date().toISOString(),
    messages,
    sender: chat.sender ?? { name: "Driver" },
    receiver: chat.receiver ?? { name: "Passenger" },
    ride: chat.ride ?? {
      origin: "",
      destinationLocation: "",
      departureTime: new Date().toISOString(),
    },
    lastMessage: messages[0],
    unreadCount: chat.unreadCount ?? 0,
  };
};

export const fetchChats = async (
  page = 1,
  limit = 10
): Promise<ChatConversation[]> => {
  const response = await api.post<ChatListResponse | ApiChat[]>(API_ENDPOINTS.chat.list, {
    pagination: { page, limit },
    sort: { field: "createdAt", order: "desc" },
  });

  const payload = unwrapApiData<ChatListResponse | ApiChat[]>(response.data);
  if (Array.isArray(payload)) {
    return payload.map(normalizeChat);
  }

  return (payload.data ?? []).map(normalizeChat);
};

export const createChat = async (bookingId: string): Promise<ChatConversation> => {
  const response = await api.post(API_ENDPOINTS.chat.create, { bookingId });
  const payload = unwrapApiData<ApiChat | { data?: ApiChat }>(response.data);
  const chat = "data" in payload && payload.data ? payload.data : payload;
  return normalizeChat(chat as ApiChat);
};

export const fetchChatMessages = async (
  chatId: string,
  page = 1,
  limit = 50
): Promise<{ data: ChatMessage[]; meta: PaginationMeta }> => {
  const response = await api.post<ChatMessagesResponse | ApiMessage[]>(
    API_ENDPOINTS.chat.messages(chatId),
    {
      pagination: { page, limit },
      sort: { field: "createdAt", order: "asc" },
    }
  );

  const payload = unwrapApiData<ChatMessagesResponse | ApiMessage[]>(response.data);
  if (Array.isArray(payload)) {
    return {
      data: payload.map(normalizeMessage),
      meta: defaultMeta,
    };
  }

  return {
    data: (payload.data ?? []).map(normalizeMessage),
    meta: { ...defaultMeta, ...(payload.meta ?? {}) },
  };
};

export const normalizeChatList = (chat: ChatConversation): ChatConversation => {
  const messages = chat.messages ?? [];
  return {
    ...chat,
    messages,
    lastMessage: chat.lastMessage ?? messages[0],
  };
};
