import { useState, useEffect, useRef } from "react";
import { Flame, Trophy, Star, Zap, Crown } from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface WatchStreakProps {
  className?: string;
  compact?: boolean; // For chat badge mode
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayWatched: boolean;
  todayMinutes: number;
  milestones: Milestone[];
}

interface Milestone {
  days: number;
  label: string;
  icon: "flame" | "star" | "trophy" | "zap" | "crown";
  unlocked: boolean;
}

/* ─── Constants ────────────────────────────────── */

const STREAK_THRESHOLD_MINUTES = 10; // 10 min = streak continues

const MILESTONES: Omit<Milestone, "unlocked">[] = [
  { days: 3, label: "Początek serii", icon: "flame" },
  { days: 7, label: "Tydzień z Padlem", icon: "star" },
  { days: 14, label: "Fan miesiąca", icon: "zap" },
  { days: 30, label: "Hardcore Fan", icon: "trophy" },
  { days: 100, label: "Legenda Padel Vision", icon: "crown" },
];

const ICON_MAP = {
  flame: Flame,
  star: Star,
  trophy: Trophy,
  zap: Zap,
  crown: Crown,
};

/* ─── Component ────────────────────────────────── */

export function WatchStreak({ className, compact }: WatchStreakProps) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 12,
    longestStreak: 23,
    todayWatched: true,
    todayMinutes: 45,
    milestones: MILESTONES.map((m) => ({
      ...m,
      unlocked: 12 >= m.days,
    })),
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track watch time (in production: call API every minute)
  useEffect(() => {
    watchTimerRef.current = setInterval(() => {
      setStreak((prev) => {
        const newMinutes = prev.todayMinutes + 1;
        const nowQualifies = newMinutes >= STREAK_THRESHOLD_MINUTES;
        return {
          ...prev,
          todayMinutes: newMinutes,
          todayWatched: nowQualifies || prev.todayWatched,
        };
      });
    }, 60_000); // every 60s

    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, []);

  // Compact badge for chat
  if (compact) {
    if (streak.currentStreak < 3) return null;
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded bg-orange/20 px-1 py-0.5 text-[10px] font-bold text-orange"
        title={`Seria ${streak.currentStreak} dni`}
      >
        <Flame className="h-2.5 w-2.5" />
        {streak.currentStreak}
      </span>
    );
  }

  // Current milestone (highest unlocked)
  const currentMilestone = [...streak.milestones]
    .reverse()
    .find((m) => m.unlocked);
  const nextMilestone = streak.milestones.find((m) => !m.unlocked);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Streak badge */}
      <button
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition-all",
          streak.currentStreak >= 7
            ? "bg-orange/20 text-orange"
            : streak.currentStreak >= 3
              ? "bg-lime/20 text-lime"
              : "bg-bg3 text-muted"
        )}
      >
        <Flame
          className={cn(
            "h-4 w-4",
            streak.currentStreak >= 7 && "animate-pulse"
          )}
        />
        <span className="font-mono">{streak.currentStreak}</span>
        <span className="hidden text-xs font-normal sm:inline">
          {streak.currentStreak === 1 ? "dzień" : "dni"}
        </span>
      </button>

      {/* Tooltip / detail panel */}
      {showTooltip && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-bg2 p-4 shadow-2xl">
          {/* Header */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                streak.currentStreak >= 7
                  ? "bg-orange/20"
                  : "bg-lime/20"
              )}
            >
              <Flame
                className={cn(
                  "h-5 w-5",
                  streak.currentStreak >= 7 ? "text-orange" : "text-lime"
                )}
              />
            </div>
            <div>
              <p className="text-display text-lg">
                {streak.currentStreak} dni serii
              </p>
              <p className="text-[10px] text-muted">
                Rekord: {streak.longestStreak} dni
              </p>
            </div>
          </div>

          {/* Today's progress */}
          <div className="mb-3 rounded-lg bg-bg3 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted">Dziś</span>
              <span
                className={cn(
                  "font-medium",
                  streak.todayWatched ? "text-lime" : "text-muted"
                )}
              >
                {streak.todayMinutes} min / {STREAK_THRESHOLD_MINUTES} min
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-bg4">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  streak.todayWatched ? "bg-lime" : "bg-muted"
                )}
                style={{
                  width: `${Math.min(100, (streak.todayMinutes / STREAK_THRESHOLD_MINUTES) * 100)}%`,
                }}
              />
            </div>
            {!streak.todayWatched && (
              <p className="mt-1.5 text-[10px] text-muted">
                Obejrzyj jeszcze {STREAK_THRESHOLD_MINUTES - streak.todayMinutes} min aby utrzymać serię
              </p>
            )}
          </div>

          {/* Milestones */}
          <div>
            <p className="mb-2 text-xs font-medium text-text">Osiągnięcia</p>
            <div className="space-y-1.5">
              {streak.milestones.map((m) => {
                const Icon = ICON_MAP[m.icon];
                return (
                  <div
                    key={m.days}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                      m.unlocked ? "bg-bg3" : "opacity-40"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        m.unlocked ? "text-lime" : "text-muted"
                      )}
                    />
                    <span className={m.unlocked ? "text-text" : "text-muted"}>
                      {m.label}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted">
                      {m.days}d
                    </span>
                    {m.unlocked && (
                      <span className="text-[10px] text-lime">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next milestone */}
          {nextMilestone && (
            <div className="mt-3 rounded-lg border border-dashed border-border p-2 text-center text-[10px] text-muted">
              Następne osiągnięcie za{" "}
              <span className="font-bold text-lime">
                {nextMilestone.days - streak.currentStreak}
              </span>{" "}
              dni: {nextMilestone.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
