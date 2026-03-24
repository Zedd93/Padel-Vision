import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Zap,
  Target,
  Flame,
  Shield,
  Swords,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

export interface MatchStats {
  team1Name: string;
  team2Name: string;
  stats: StatRow[];
  momentum: number[]; // -100 to +100 for last N points (positive = team1)
  headToHead: {
    team1Wins: number;
    team2Wins: number;
    totalMatches: number;
  };
}

interface StatRow {
  label: string;
  team1: number;
  team2: number;
  type: "count" | "percent";
  icon: typeof Zap;
}

interface MatchStatsPanelProps {
  stats: MatchStats;
}

/* ─── Mock Data ────────────────────────────────── */

export const DEMO_MATCH_STATS: MatchStats = {
  team1Name: "Kowalski / Nowak",
  team2Name: "Wiśniewski / Zając",
  stats: [
    { label: "Asy serwisowe", team1: 8, team2: 5, type: "count", icon: Zap },
    { label: "Skuteczność serwisu", team1: 72, team2: 65, type: "percent", icon: Target },
    { label: "Przełamania", team1: 3, team2: 2, type: "count", icon: Flame },
    { label: "Złote punkty", team1: 4, team2: 3, type: "count", icon: Target },
    { label: "Winners", team1: 22, team2: 18, type: "count", icon: Swords },
    { label: "Błędy wymuszone", team1: 12, team2: 15, type: "count", icon: Shield },
    { label: "Punkty przy siatce", team1: 14, team2: 10, type: "count", icon: TrendingUp },
  ],
  momentum: [30, 50, 20, -10, -40, -20, 10, 60, 80, 40, 70, 50, -10, 30, 60],
  headToHead: {
    team1Wins: 3,
    team2Wins: 2,
    totalMatches: 5,
  },
};

/* ─── Component ────────────────────────────────── */

export function MatchStatsPanel({ stats }: MatchStatsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-lime" />
          <h3 className="text-sm font-semibold text-text">
            Statystyki meczu
          </h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* Team headers */}
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-bold text-lime">{stats.team1Name}</span>
            <span className="text-muted">vs</span>
            <span className="font-bold text-text">{stats.team2Name}</span>
          </div>

          {/* Stat bars */}
          <div className="space-y-3">
            {stats.stats.map((stat) => {
              const Icon = stat.icon;
              const total = stat.team1 + stat.team2;
              const pct1 = total > 0 ? (stat.team1 / total) * 100 : 50;
              const isT1Better = stat.team1 > stat.team2;
              const isT2Better = stat.team2 > stat.team1;

              return (
                <div key={stat.label}>
                  {/* Label */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-mono",
                        isT1Better ? "text-lime" : "text-text"
                      )}
                    >
                      {stat.team1}
                      {stat.type === "percent" && "%"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted">
                      <Icon className="h-3 w-3" />
                      {stat.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono",
                        isT2Better ? "text-lime" : "text-text"
                      )}
                    >
                      {stat.team2}
                      {stat.type === "percent" && "%"}
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "rounded-l-full transition-all",
                        isT1Better ? "bg-lime" : "bg-lime/30"
                      )}
                      style={{ width: `${pct1}%` }}
                    />
                    <div
                      className={cn(
                        "rounded-r-full transition-all",
                        isT2Better ? "bg-orange" : "bg-orange/30"
                      )}
                      style={{ width: `${100 - pct1}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Momentum graph */}
          <div className="mt-4 border-t border-border pt-3">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-lime" />
              <span className="text-xs font-medium text-text">
                Momentum (ostatnie {stats.momentum.length} punktów)
              </span>
            </div>
            <div className="flex h-12 items-center gap-px">
              {stats.momentum.map((val, i) => {
                const absVal = Math.abs(val);
                const height = Math.max(4, (absVal / 100) * 100);
                return (
                  <div
                    key={i}
                    className="relative flex flex-1 items-center justify-center"
                    style={{ height: "100%" }}
                  >
                    <div
                      className={cn(
                        "w-full rounded-sm transition-all",
                        val > 0 ? "bg-lime" : "bg-orange"
                      )}
                      style={{
                        height: `${height}%`,
                        opacity: 0.3 + (absVal / 100) * 0.7,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] text-muted">
              <span className="text-lime">← {stats.team1Name.split(" / ")[0]}</span>
              <span className="text-orange">{stats.team2Name.split(" / ")[0]} →</span>
            </div>
          </div>

          {/* Head to Head */}
          <div className="mt-3 rounded-lg bg-bg3 p-3">
            <p className="mb-2 text-center text-[10px] font-medium text-muted">
              HISTORIA SPOTKAŃ
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-lime">
                  {stats.headToHead.team1Wins}
                </p>
                <p className="text-[9px] text-muted">wygrane</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted">
                  {stats.headToHead.totalMatches} meczów
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text">
                  {stats.headToHead.team2Wins}
                </p>
                <p className="text-[9px] text-muted">wygrane</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
