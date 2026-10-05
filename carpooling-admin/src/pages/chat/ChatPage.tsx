import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, MessageSquarePlus, Send, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/errors";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useSocket } from "@/context/SocketContext";
import { ROUTES } from "@/constants";
import {
  createChat,
  fetchChatMessages,
  fetchMyChats,
  type Chat,
  type ChatMessage,
  type ChatListResponse,
  type ChatPaginationRequest,
} from "@/services/chatService";

const MESSAGE_LIMIT = 50;

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOtherParticipant(chat: Chat, userId?: string | null) {
  if (!userId) {
    return {
      name: chat.receiver?.name || chat.sender?.name || "Chat",
      id: chat.receiverId,
    };
  }

  if (chat.senderId === userId) {
    return { name: chat.receiver?.name || "Chat", id: chat.receiverId };
  }

  return { name: chat.sender?.name || "Chat", id: chat.senderId };
}

function dedupeMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { chatId: chatIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const { socket, connected } = useSocket();
  const { user } = useAppSelector((state) => state.auth);

  const [chatsResponse, setChatsResponse] = useState<ChatListResponse | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(chatIdParam ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [messageMeta, setMessageMeta] = useState<ChatListResponse["meta"] | null>(null);
  const [input, setInput] = useState("");
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const activeChatRef = useRef<string | null>(null);

  const bookingId = searchParams.get("bookingId");

  const activeChat = useMemo(() => {
    return chatsResponse?.data.find((chat) => chat.id === activeChatId) ?? null;
  }, [activeChatId, chatsResponse]);

  const activeOtherParticipant = useMemo(
    () => (activeChat ? getOtherParticipant(activeChat, user?.id) : null),
    [activeChat, user?.id]
  );

  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const response = await fetchMyChats({
        pagination: { page: 1, limit: 20 },
        sort: { field: "createdAt", order: "desc" },
      });
      setChatsResponse(response);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load chats."));
    } finally {
      setChatsLoading(false);
    }
  }, []);

  const loadChatMessages = useCallback(
    async (chatId: string, page = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setMessagesLoading(true);
      }

      try {
        const response = await fetchChatMessages(chatId, {
          pagination: { page, limit: MESSAGE_LIMIT },
          sort: { field: "createdAt", order: "asc" },
        } satisfies ChatPaginationRequest);

        setMessageMeta(response.meta);
        setMessagePage(page);
        setMessages((current) => {
          const merged = append ? [...response.data, ...current] : [...response.data];
          return dedupeMessages(merged).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to load messages."));
      } finally {
        setMessagesLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (bookingId && !activeChatId && !creatingChat) {
      setCreatingChat(true);
      createChat(bookingId)
        .then((chat) => {
          setCreatingChat(false);
          loadChats().then(() => {
            navigate(`${ROUTES.chat.root}/${chat.id}`, { replace: true });
          });
        })
        .catch((error: unknown) => {
          setCreatingChat(false);
          toast.error(getApiErrorMessage(error, "Failed to open chat from booking."));
        });
    }
  }, [activeChatId, bookingId, creatingChat, loadChats, navigate]);

  useEffect(() => {
    if (chatIdParam && chatIdParam !== activeChatId) {
      setActiveChatId(chatIdParam);
    }
  }, [activeChatId, chatIdParam]);

  useEffect(() => {
    if (!activeChatId) return;
    activeChatRef.current = activeChatId;
    setTypingUserId(null);
    setMessages([]);
    setMessageMeta(null);
    setMessagePage(1);
    loadChatMessages(activeChatId, 1, false).then(() => {
      socket?.emit("joinRoom", activeChatId);
      socket?.emit("markAsRead", { roomId: activeChatId });
    });
  }, [activeChatId, loadChatMessages, socket]);

  useEffect(() => {
    if (!socket) return;

    const handlePreviousMessages = (incoming: ChatMessage[]) => {
      if (!activeChatRef.current) return;
      const normalized = [...incoming].reverse();
      setMessages((current) => {
        const merged = dedupeMessages([...normalized, ...current]);
        return merged.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    };

    const handleNewMessage = (incoming: ChatMessage) => {
      if (activeChatRef.current && incoming.chatId === activeChatRef.current) {
        setMessages((current) => {
          const merged = dedupeMessages([...current, incoming]);
          return merged.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
      loadChats();
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

    socket.on("previousMessages", handlePreviousMessages);
    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("previousMessages", handlePreviousMessages);
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [loadChats, socket, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectChat = (chat: Chat) => {
    navigate(`${ROUTES.chat.root}/${chat.id}`);
  };

  const handleSendMessage = () => {
    if (!activeChatId || !socket) return;
    const content = input.trim();
    if (!content) return;

    socket.emit("sendMessage", {
      roomId: activeChatId,
      content,
    });

    setInput("");
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socket.emit("stopTyping", activeChatId);
  };

  const handleTyping = () => {
    if (!activeChatId || !socket) return;
    socket.emit("typing", activeChatId);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("stopTyping", activeChatId);
    }, 1000);
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!activeChatId || loadingMore) return;
    const target = event.currentTarget;
    if (target.scrollTop > 0 || !messageMeta?.hasNext) return;

    const nextPage = messagePage + 1;
    loadChatMessages(activeChatId, nextPage, true);
  };

  const renderedChats = chatsResponse?.data ?? [];
  const activeMessages = messages;
  const isTyping = Boolean(typingUserId);

  return (
    <div className="flex h-[calc(100vh-0px)] bg-muted/30">
      <aside
        className={`${
          activeChatId ? "hidden lg:flex" : "flex"
        } w-full lg:w-[360px] shrink-0 border-r border-border bg-card flex-col`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold">Chats</h1>
            <p className="text-xs text-muted-foreground">
              {connected ? "Online" : "Offline"}
            </p>
          </div>
          {connected ? (
            <Wifi className="h-4 w-4 text-emerald-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-rose-500" />
          )}
        </div>

        <div className="overflow-y-auto">
          {chatsLoading ? (
            <div className="p-5 text-sm text-muted-foreground">Loading chats...</div>
          ) : renderedChats.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">No chats yet.</div>
          ) : (
            renderedChats.map((chat) => {
              const other = getOtherParticipant(chat, user?.id);
              const preview = chat.message?.[0];
              const unreadCount =
                preview && preview.senderId !== user?.id && !preview.isRead ? 1 : 0;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full border-b border-border px-5 py-4 text-left transition hover:bg-muted/50 ${
                    chat.id === activeChatId ? "bg-muted/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{other.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground truncate">
                        {chat?.ride?.origin || "Origin"} →{" "}
                        {chat?.ride?.destinationLocation || "Destination"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {unreadCount > 0 && (
                        <div className="mb-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {unreadCount}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground">
                        {preview ? formatTime(preview.createdAt) : formatDateTime(chat.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                    {preview ? preview.content : "No messages yet"}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main
        className={`${
          activeChatId ? "flex" : "hidden lg:flex"
        } flex-1 flex-col`}
      >
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {activeChatId && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => {
                  setActiveChatId(null);
                  navigate(ROUTES.chat.root);
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {activeChat ? activeOtherParticipant?.name : "Select a chat"}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {activeChat
                  ? `${activeChat?.ride?.origin || "Origin"} → ${
                      activeChat?.ride?.destinationLocation || "Destination"
                    }${
                      activeChat?.ride?.departureTime
                        ? ` • Departure ${formatDateTime(activeChat.ride.departureTime)}`
                        : ""
                    }`
                  : "Choose a chat from the list to start messaging"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {connected ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-500" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-rose-500" />
                Disconnected
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {!activeChat ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <MessageSquarePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">Open a conversation</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a chat from the sidebar to view the message history, typing
                  indicators, and live updates.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
                {messagesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading messages...</div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No messages yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMessages.map((message) => {
                      const isMine = message.senderId === user?.id;
                      const senderName =
                        message.sender?.name || (isMine ? "You" : activeOtherParticipant?.name || "User");

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                              isMine
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-foreground border border-black/10 dark:border-white/10"
                            }`}
                          >
                            <div className="mb-1 text-[11px] font-medium opacity-80">
                              {senderName}
                            </div>
                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                            <div className="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-75">
                              <span>{formatTime(message.createdAt)}</span>
                              {isMine && <span>{message.isRead ? "Read" : "Sent"}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-card p-4 lg:p-6">
                {isTyping && (
                  <div className="mb-2 text-xs text-muted-foreground">Typing...</div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Write a message..."
                    className="flex-1 rounded-xl border-border bg-background shadow-xs"
                  />
                  <Button onClick={handleSendMessage} disabled={!input.trim()} className="rounded-xl shadow-xs">
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
