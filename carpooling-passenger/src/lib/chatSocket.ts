import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
    : "http://localhost:5000");

let socket: Socket | null = null;
let activeToken: string | null = null;

const normalizeToken = (token: string) =>
  token.startsWith("Bearer ") ? token : `Bearer ${token}`;

export const connectChatSocket = (token: string) => {
  const authToken = normalizeToken(token);

  if (socket && activeToken === authToken) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  activeToken = authToken;
  socket = io(SOCKET_URL, {
    auth: { token: authToken },
    reconnection: true,
  });

  return socket;
};

export const getChatSocket = () => socket;

export const disconnectChatSocket = () => {
  if (!socket) {
    activeToken = null;
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  activeToken = null;
};
