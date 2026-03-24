import { cn } from "@/utils/cn";
import type { MatchStats } from "./MatchStatsPanel";

/* ─── Types ────────────────────────────────────── */

interface StatsOverlayProps {
  stats: MatchStats;
  visible: boolean;
}

/* ─── Component ────────────────────────────────── */

export function StatsOverlay({ stats, visible }: StatsOverlayProps) {
  if (!visible) return null;

  // Show top 4 stats as compact overlay
  const topStats = stats.stats.slice(0, 4);

  return (
    <div className="absolute left-4 top-4 z-20 w-56 rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur-md">
      {/* Team headers */}
      <div className="mb-2 flex items-center justify-between text-[10px]">
        <span className="font-bold text-lime">
          {stats.team1Name.split(" / ")[0]}
        </span>
        <span className="text-white/40">STATS</span>
        <span className="font-bold text-white/90">
          {stats.team2Name.split(" / ")[0]}
        </span>
      </div>

      {/* Compact stat rows */}
      <div className="space-y-1.5">
        {topStats.map((stat) => {
          const total = stat.team1 + stat.team2;
          const pct1 = total > 0 ? (stat.team1 / total) * 100 : 50;

          return (
            <div key={stat.label}>
              <div className="flex items-center justify-between text-[9px]">
                <span
                  className={cn(
                    "font-mono",
                    stat.team1 > stat.team2
                      ? "text-lime"
                      : "text-white/70"
                  )}
                >
                  {stat.team1}
                  {stat.type === "percent" && "%"}
                </span>
                <span className="text-white/40">{stat.label}</span>
                <span
                  className={cn(
                    "font-mono",
                    stat.team2 > stat.team1
                      ? "text-lime"
                      : "text-white/70"
                  )}
                >
                  {stat.team2}
                  {stat.type === "percent" && "%"}
                </span>
              </div>
              <div className="flex h-1 gap-px overflow-hidden rounded-full">
                <div
                  className={cn(
                    "rounded-l-full",
                    stat.team1 >= stat.team2
                      ? "bg-lime/60"
                      : "bg-white/20"
                  )}
                  style={{ width: `${pct1}%` }}
                />
                <div
                  className={cn(
                    "rounded-r-full",
                    stat.team2 > stat.team1
                      ? "bg-orange/60"
                      : "bg-white/20"
                  )}
                  style={{ width: `${100 - pct1}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini momentum */}
      <div className="mt-2 flex h-4 items-end gap-px border-t border-white/10 pt-1">
        {stats.momentum.slice(-10).map((val, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm",
              val > 0 ? "bg-lime/50" : "bg-orange/50"
            )}
            style={{ height: `${Math.max(15, Math.abs(val))}%` }}
          />
        ))}
      </div>
    </div>
  );
}
