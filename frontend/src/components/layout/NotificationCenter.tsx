import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Radio,
  Trophy,
  Coins,
  Gift,
  X,
  Check,
  Flame,
  Scissors,
  User,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";

type NotifType =
  | "stream_live"
  | "tournament"
  | "bits"
  | "promo"
  | "ppv"
  | "match_point"
  | "clip_trending"
  | "player_live"
  | "streak_warning";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  /** Optional link to navigate to */
  href?: string;
  /** Priority: high = vibrant style */
  priority?: "high" | "normal";
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "stream_live",
    title: "Racket Club Katowice",
    body: "Rozpoczął transmisję na żywo!",
    time: "2 min temu",
    read: false,
  },
  {
    id: "2",
    type: "tournament",
    title: "Silesia Open 2025",
    body: "Zapisy startują za 1h — zarezerwuj miejsce!",
    time: "15 min temu",
    read: false,
  },
  {
    id: "3",
    type: "bits",
    title: "Zakup potwierdzony",
    body: "500 Piłek zostało dodanych do portfela.",
    time: "1h temu",
    read: false,
  },
  {
    id: "4",
    type: "promo",
    title: "Darmowe Piłki!",
    body: "Odbierz 50 Piłek z okazji weekendu.",
    time: "3h temu",
    read: true,
  },
  {
    id: "5",
    type: "ppv",
    title: "Wyniki: Kraków Open",
    body: "Finał zakończony — zobacz powtórkę.",
    time: "5h temu",
    read: true,
  },
  {
    id: "6",
    type: "stream_live",
    title: "Padel Kraków",
    body: "Transmituje półfinał turnieju.",
    time: "6h temu",
    read: true,
  },
  {
    id: "7",
    type: "match_point",
    title: "Match Point w Silesia Open!",
    body: "Kowalski/Nowak prowadzą 6:4, 5:4 — oglądaj finał teraz!",
    time: "1 min temu",
    read: false,
    href: "/stream/1",
    priority: "high",
  },
  {
    id: "8",
    type: "clip_trending",
    title: "Twój klip jest na topie!",
    body: "\"Niewiarygodny smash\" ma już 12.4k wyświetleń.",
    time: "30 min temu",
    read: false,
    href: "/clips/clip-1",
  },
  {
    id: "9",
    type: "player_live",
    title: "Kowalski gra za 30 minut",
    body: "Twój obserwowany gracz pojawi się na korcie 1.",
    time: "30 min temu",
    read: false,
    href: "/stream/1",
  },
  {
    id: "10",
    type: "streak_warning",
    title: "Twój streak wygasa dziś!",
    body: "Obejrzyj 10 min live lub VOD żeby utrzymać 12-dniową serię.",
    time: "8h temu",
    read: false,
    priority: "high",
  },
];

const TYPE_CONFIG: Record<
  NotifType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  stream_live: { icon: Radio, color: "text-live", bg: "bg-live/20" },
  tournament: { icon: Trophy, color: "text-orange", bg: "bg-orange/20" },
  bits: { icon: Coins, color: "text-yellow-400", bg: "bg-yellow-400/20" },
  promo: { icon: Gift, color: "text-lime", bg: "bg-lime/20" },
  ppv: { icon: Trophy, color: "text-blue-400", bg: "bg-blue-400/20" },
  match_point: { icon: Flame, color: "text-red-400", bg: "bg-red-400/20" },
  clip_trending: { icon: Scissors, color: "text-lime", bg: "bg-lime/20" },
  player_live: { icon: User, color: "text-blue-400", bg: "bg-blue-400/20" },
  streak_warning: { icon: Flame, color: "text-orange", bg: "bg-orange/20" },
};

type NotifFilter = "all" | "live" | "clips" | "account";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotifFilter>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications
    .filter((n) => {
      if (filter === "all") return true;
      if (filter === "live")
        return ["stream_live", "match_point", "player_live"].includes(n.type);
      if (filter === "clips") return n.type === "clip_trending";
      if (filter === "account")
        return ["bits", "promo", "ppv", "streak_warning", "tournament"].includes(n.type);
      return true;
    })
    // Sort: unread first, high priority first, then by recency
    .sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      return 0;
    });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted transition-colors hover:bg-bg3 hover:text-text"
        aria-label="Powiadomienia"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-live text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-[#0B0C10] shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text">Powiadomienia</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-lime hover:underline"
                >
                  <Check className="h-3 w-3" />
                  Oznacz wszystkie
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-border px-3 py-2">
            {(
              [
                { key: "all", label: "Wszystko" },
                { key: "live", label: "Na żywo" },
                { key: "clips", label: "Klipy" },
                { key: "account", label: "Konto" },
              ] as { key: NotifFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                  filter === f.key
                    ? "bg-lime/20 text-lime"
                    : "text-muted hover:text-text"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type];
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    "flex cursor-pointer gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-bg3",
                    !notif.read && "bg-lime/[0.03]",
                    notif.priority === "high" && !notif.read && "bg-orange/[0.05] border-l-2 border-l-orange"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold text-text">
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="ml-2 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lime" />
                      )}
                    </div>
                    <p className="text-xs text-muted">{notif.body}</p>
                    <p className="mt-1 text-[10px] text-muted/60">
                      {notif.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 text-center">
            <button
              onClick={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setOpen(false);
              }}
              className="text-xs text-lime hover:underline"
            >
              Oznacz wszystkie jako przeczytane
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
