import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface CheerMessageProps {
  username: string;
  amount: number;
  message?: string;
  timestamp: string;
}

/* ─── Tier config ──────────────────────────────── */

function getCheerStyle(amount: number) {
  if (amount >= 2000)
    return {
      bg: "bg-gradient-to-r from-yellow-500/20 to-orange/20 border-yellow-500/30",
      text: "text-yellow-300",
      badge: "bg-yellow-500 text-black",
      emoji: "🏆",
    };
  if (amount >= 500)
    return {
      bg: "bg-gradient-to-r from-yellow-500/10 to-orange/10 border-yellow-500/20",
      text: "text-yellow-400",
      badge: "bg-yellow-500/80 text-black",
      emoji: "💥",
    };
  if (amount >= 100)
    return {
      bg: "bg-orange/10 border-orange/20",
      text: "text-orange",
      badge: "bg-orange text-black",
      emoji: "🔥",
    };
  return {
    bg: "bg-lime/5 border-lime/15",
    text: "text-lime",
    badge: "bg-lime/80 text-black",
    emoji: "🎾",
  };
}

/* ─── Component ────────────────────────────────── */

export function CheerMessage({
  username,
  amount,
  message,
  timestamp,
}: CheerMessageProps) {
  const style = getCheerStyle(amount);

  return (
    <div
      className={cn(
        "mx-2 my-1 rounded-lg border px-3 py-2",
        style.bg
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{style.emoji}</span>
        <span className={cn("text-xs font-bold", style.text)}>
          {username}
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
            style.badge
          )}
        >
          {amount} Piłek
        </span>
      </div>
      {message && (
        <p className="mt-1 text-xs text-text/80">{message}</p>
      )}
    </div>
  );
}
