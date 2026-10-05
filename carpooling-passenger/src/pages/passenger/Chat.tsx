import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { SEO } from "@carpooling/common";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchChatMessages, fetchChats } from "@/services/chatService";
import type { ChatConversation, ChatMessage } from "@/types";
import { formatLocationName } from "@/lib/locations";
import { connectChatSocket } from "@/lib/chatSocket";
import type { Socket } from "socket.io-client";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

const getOtherParticipant = (
  chat?: ChatConversation | null,
  userId?: string | null
) => {
  if (!chat) return null;
  if (chat.senderId === userId) return chat.receiver;
  if (chat.receiverId === userId) return chat.sender;
  return chat.driver ?? chat.sender ?? chat.receiver ?? null;
};

const formatRoute = (chat?: ChatConversation | null) => {
  if (!chat || !chat.ride) return "";
  const origin = formatLocationName(chat.ride.origin) || "Unknown origin";
  const dest =
    formatLocationName(chat.ride.destinationLocation || (chat.ride as any)?.destination) ||
    "Unknown destination";
  return `${origin} → ${dest}`;
};

function ChatRoom({ chatId }: { chatId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const routeState = location.state as { chat?: ChatConversation } | null;
  const [input, setInput] = useState("");
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historySnapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(
    null
  );
  const typingTimeoutRef = useRef<number | null>(null);

  const { data: chats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: () => fetchChats(1, 10),
  });

  const activeChat =
    routeState?.chat ?? chats.find((chat) => chat.id === chatId) ?? null;
  const otherUser = getOtherParticipant(activeChat, user?.id);
  const routeLabel = formatRoute(activeChat);

  useEffect(() => {
    if (!token) return;
    setSocket(connectChatSocket(token));
  }, [token]);

  const {
    data: messagePages,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: ({ pageParam }) => fetchChatMessages(chatId, Number(pageParam ?? 1)),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled: Boolean(chatId),
  });

  const messages = useMemo(
    () =>
      (messagePages?.pages ?? [])
        .flatMap((page) => page.data)
        .filter(
          (message, index, list) => index === list.findIndex((item) => item.id === message.id)
        )
        .sort(
          (left, right) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        ),
    [messagePages]
  );

  useEffect(() => {
    if (!token || !socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("joinRoom", chatId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (message: ChatMessage) => {
      if (message.chatId === chatId) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
    };

    const handleTyping = ({ userId }: { userId: string }) => {
      if (userId !== user?.id) {
        setTypingUserId(userId);
      }
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      if (userId !== user?.id) {
        setTypingUserId((current) => (current === userId ? null : current));
      }
    };

    setIsConnected(socket.connected);
    socket.emit("joinRoom", chatId);
    socket.emit("markAsRead", { roomId: chatId });

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [chatId, queryClient, socket, token, user?.id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (historySnapshotRef.current) {
      const previous = historySnapshotRef.current;
      const heightDelta = container.scrollHeight - previous.scrollHeight;
      container.scrollTop = previous.scrollTop + heightDelta;
      historySnapshotRef.current = null;
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 || !socket) return;
    socket.emit("markAsRead", { roomId: chatId });
  }, [chatId, messages.length, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;

    if (container.scrollTop <= 32) {
      historySnapshotRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
      fetchNextPage();
    }
  };

  const handleTyping = () => {
    if (!socket || !chatId) return;

    socket.emit("typing", chatId);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("stopTyping", chatId);
    }, 1000);
  };

  const handleSend = () => {
    const content = input.trim();
    if (!content || !socket) return;

    socket.emit("sendMessage", {
      roomId: chatId,
      content,
    });

    setInput("");

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socket.emit("stopTyping", chatId);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  const showTyping =
    typingUserId &&
    otherUser &&
    typingUserId === otherUser.id &&
    otherUser.name;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col lg:h-screen">
      <SEO
        title={otherUser?.name ? `Chat with ${otherUser.name}` : "Trip Chat"}
        description="Communicate with your driver or passenger in real time."
      />
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/passenger/chat")}
          className="lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
          {otherUser?.name?.charAt(0)?.toUpperCase() || "D"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {otherUser?.name || "Driver"}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </span>
          </div>
          {routeLabel && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{routeLabel}</span>
            </p>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto bg-background p-4"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {hasNextPage && (
              <div className="flex justify-center py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    historySnapshotRef.current = {
                      scrollHeight: containerRef.current?.scrollHeight ?? 0,
                      scrollTop: containerRef.current?.scrollTop ?? 0,
                    };
                    fetchNextPage();
                  }}
                  disabled={isFetchingNextPage}
                  className="text-xs text-muted-foreground"
                >
                  {isFetchingNextPage ? "Loading older messages..." : "Load older messages"}
                </Button>
              </div>
            )}
            {messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              const senderName = isOwn
                ? "You"
                : message.sender?.name || otherUser?.name || "Driver";

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                      isOwn
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-card text-foreground"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-medium opacity-80">
                      {senderName}
                    </p>
                    <p className="break-words">{message.content}</p>
                    <div
                      className={`mt-1 flex items-center justify-between gap-3 text-[10px] ${
                        isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
                      }`}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwn && message.isRead && (
                        <span className="inline-flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        {showTyping && (
          <p className="mb-2 text-xs text-muted-foreground">{otherUser.name} is typing...</p>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border-input bg-background text-foreground"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => fetchChats(1, 10),
  });

  const openChat = (chat: ChatConversation) => {
    queryClient.setQueryData(["chat-state", chat.id], chat);
    navigate(`/passenger/chat/${chat.id}`, { state: { chat } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Passenger conversations
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Messages
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Chat with your drivers about accepted bookings.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : chats.length === 0 ? (
        <Card className="mt-6 border-border bg-card shadow-sm">
          <CardContent className="p-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold text-foreground">No conversations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Accepted bookings will appear here as conversations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-2">
          {chats.map((chat) => {
            const otherUser = getOtherParticipant(chat, user?.id);
            const routeLabel = formatRoute(chat);
            const lastMessage = chat.lastMessage ?? chat.messages[chat.messages.length - 1];

            return (
              <Card
                key={chat.id}
                className="cursor-pointer border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                onClick={() => openChat(chat)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="relative shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {otherUser?.name?.charAt(0)?.toUpperCase() || "D"}
                    </div>
                    {chat.unreadCount ? (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {otherUser?.name || "Driver"}
                      </p>
                      {lastMessage && (
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {formatTime(lastMessage.createdAt)}
                        </p>
                      )}
                    </div>
                    {routeLabel && (
                      <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{routeLabel}</span>
                      </p>
                    )}
                    {lastMessage && (
                      <p className="truncate text-xs text-muted-foreground">
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const { id } = useParams();

  if (!id) {
    return <ChatList />;
  }

  return <ChatRoom chatId={id} />;
}
