import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  Send,
  Flag,
  Pause,
  Play,
  Crown,
  ShieldCheck,
  KeyRound,
  Video,
  MessageSquareWarning,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Role badges for chat ─────────────────────────────── */

type ChatRole = "SUPER_ADMIN" | "ADMIN" | "CLUB" | "CLUB_MOD" | "CHAT_MOD" | "VIEWER" | string;

const CHAT_ROLE_CONFIG: Record<string, {
  icon: typeof Crown;
  color: string;
  title: string;
} | null> = {
  SUPER_ADMIN: { icon: Crown, color: "text-red-400", title: "Super Admin" },
  ADMIN: { icon: ShieldCheck, color: "text-orange", title: "Administrator" },
  CLUB: { icon: KeyRound, color: "text-lime", title: "Właściciel klubu" },
  CLUB_MOD: { icon: Video, color: "text-blue-400", title: "Moderator klubowy" },
  CHAT_MOD: { icon: MessageSquareWarning, color: "text-purple-400", title: "Moderator czatu" },
  VIEWER: null, // No icon for regular users
};

interface ChatMessage {
  id?: string;
  username: string;
  role?: ChatRole;
  message: string;
  color?: string;
  badges?: string[];
  timestamp: string;
  isSystem?: boolean;
}

interface BitsAnimation {
  username: string;
  amount: number;
  effect: "ACE" | "SMASH" | "MATCHPOINT";
}

interface ChatBoxProps {
  streamId: string;
  userId?: string;
  username?: string;
}

const CHAT_COLORS = [
  "text-lime",
  "text-orange",
  "text-blue-400",
  "text-pink-400",
  "text-purple-400",
  "text-emerald-400",
  "text-yellow-400",
  "text-cyan-400",
];

function getUserColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHAT_COLORS[Math.abs(hash) % CHAT_COLORS.length];
}

export function ChatBox({ streamId, userId, username }: ChatBoxProps) {
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [bitsAnimation, setBitsAnimation] = useState<BitsAnimation | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  // Connect to Socket.io
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const socket = io(apiUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("chat:join", { streamId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        // Keep last 200 messages in memory
        return next.length > 200 ? next.slice(-200) : next;
      });
    });

    socket.on("chat:system", (msg: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: msg.message,
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ]);
    });

    socket.on("viewers:count", ({ count }: { count: number }) => {
      setViewerCount(count);
    });

    socket.on("bits:animation", (data: BitsAnimation) => {
      setBitsAnimation(data);
      setTimeout(() => setBitsAnimation(null), 3000);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [streamId]);

  // Auto-scroll
  useEffect(() => {
    if (!paused && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, paused]);

  // Detect manual scroll (pause auto-scroll)
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setPaused(!isAtBottom);
  }, []);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socketRef.current) return;

    const trimmed = input.trim();

    // Handle slash commands
    if (trimmed.startsWith("/")) {
      socketRef.current.emit("chat:command", {
        streamId,
        command: trimmed,
      });
    } else {
      socketRef.current.emit("chat:message", {
        streamId,
        message: trimmed,
        userId: userId || "anonymous",
      });
    }

    setInput("");
  }, [input, streamId, userId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-display text-sm">Czat na żywo</h3>
          {connected && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </div>
        <button className="text-muted transition-colors hover:text-text">
          <Flag className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bits Animation Overlay */}
      {bitsAnimation && (
        <div className="flex flex-col items-center bg-gradient-to-b from-lime/10 to-transparent py-4">
          <span className="text-display text-2xl text-lime">
            {bitsAnimation.effect === "ACE" && "ACE! 🎾"}
            {bitsAnimation.effect === "SMASH" && "SMASH! 💥"}
            {bitsAnimation.effect === "MATCHPOINT" && "MATCH POINT! 🏆"}
          </span>
          <span className="text-sm text-text">
            <span className="font-semibold text-lime">
              {bitsAnimation.username}
            </span>{" "}
            wysłał {bitsAnimation.amount} piłek
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-1 overflow-y-auto px-3 py-2"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-xs text-muted">
              Czat jest pusty. Bądź pierwszy!
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "text-sm leading-relaxed",
              msg.isSystem && "rounded bg-bg4/50 px-2 py-1 text-xs"
            )}
          >
            {msg.isSystem ? (
              <span className="text-muted">{msg.message}</span>
            ) : (
              <>
                {/* Role icon */}
                {msg.role && CHAT_ROLE_CONFIG[msg.role] && (() => {
                  const cfg = CHAT_ROLE_CONFIG[msg.role!]!;
                  const Icon = cfg.icon;
                  return (
                    <span className="mr-1 inline-flex align-text-bottom" title={cfg.title}>
                      <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </span>
                  );
                })()}
                <span
                  className={cn(
                    "font-semibold",
                    getUserColor(msg.username)
                  )}
                >
                  {msg.username}
                </span>
                <span className="text-muted">: </span>
                <span className="text-text/90 break-words">{msg.message}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Paused indicator */}
      {paused && messages.length > 0 && (
        <button
          onClick={() => {
            setPaused(false);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mx-3 mb-1 rounded bg-bg4 px-3 py-1 text-center text-xs text-muted transition-colors hover:text-text"
        >
          Czat wstrzymany — kliknij aby przewinąć w dół
        </button>
      )}

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              userId
                ? "Wyślij wiadomość..."
                : "Zaloguj się, żeby pisać..."
            }
            disabled={!userId}
            className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !userId}
            className="btn-primary px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
          <span>Komendy: /wynik /sety /gracze</span>
        </div>
      </div>
    </div>
  );
}
