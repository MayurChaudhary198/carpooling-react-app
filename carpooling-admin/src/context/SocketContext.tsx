import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/constants";
import { useAppSelector } from "@/hooks/useAppDispatch";

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

function getSocketUrl() {
  return (
    import.meta.env.VITE_SOCKET_URL ||
    API_BASE_URL.replace(/\/api\/?$/, "") ||
    "http://localhost:5000"
  );
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socket?.disconnect();
      setSocket(null);
      setConnected(false);
      return;
    }

    const nextSocket = io(getSocketUrl(), {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      transports: ["websocket"],
    });

    nextSocket.on("connect", () => setConnected(true));
    nextSocket.on("disconnect", () => setConnected(false));
    nextSocket.on("connect_error", () => setConnected(false));

    setSocket(nextSocket);

    return () => {
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      setConnected(false);
      setSocket((current) => (current === nextSocket ? null : current));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const value = useMemo(
    () => ({
      socket,
      connected,
    }),
    [socket, connected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
