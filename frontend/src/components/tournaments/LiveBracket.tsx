import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Radio,
  Eye,
  Play,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  team1: string | null;
  team2: string | null;
  score1: number | null;
  score2: number | null;
  /** Set scores like "6-3, 4-6, 7-5" */
  setScores?: string;
  status: "pending" | "live" | "completed";
  streamId?: string;
  winnerId?: "team1" | "team2";
  scheduledAt?: string;
}

interface LiveBracketProps {
  matches: BracketMatch[];
  tournamentName: string;
}

/* ─── Mock Data ────────────────────────────────── */

export const DEMO_BRACKET: BracketMatch[] = [
  // Round 1 (Quarter-finals)
  { id: "m1", round: 1, position: 1, team1: "Kowalski / Nowak", team2: "Wiśniewski / Zając", score1: 6, score2: 3, setScores: "6-3, 6-4", status: "completed", winnerId: "team1" },
  { id: "m2", round: 1, position: 2, team1: "Biliński / Naduk", team2: "Janowicz / Arturo", score1: 4, score2: 6, setScores: "4-6, 6-7", status: "completed", winnerId: "team2" },
  { id: "m3", round: 1, position: 3, team1: "Szymański / Krawczyk", team2: "Duda / Majewski", score1: 6, score2: 2, setScores: "6-2, 6-1", status: "completed", winnerId: "team1" },
  { id: "m4", round: 1, position: 4, team1: "Lewandowski / Mazur", team2: "Wójcik / Piotrowski", score1: 5, score2: 4, status: "live", streamId: "stream-1" },
  // Round 2 (Semi-finals)
  { id: "m5", round: 2, position: 1, team1: "Kowalski / Nowak", team2: "Janowicz / Arturo", score1: 6, score2: 4, status: "live", streamId: "stream-2" },
  { id: "m6", round: 2, position: 2, team1: "Szymański / Krawczyk", team2: null, score1: null, score2: null, status: "pending", scheduledAt: "15:30" },
  // Round 3 (Final)
  { id: "m7", round: 3, position: 1, team1: null, team2: null, score1: null, score2: null, status: "pending", scheduledAt: "17:00" },
];

/* ─── Helpers ──────────────────────────────────── */

function getStatusBadge(status: BracketMatch["status"]) {
  switch (status) {
    case "live":
      return (
        <span className="badge-live flex items-center gap-1 text-[9px]">
          <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
      );
    case "completed":
      return (
        <span className="flex items-center gap-0.5 rounded bg-lime/20 px-1.5 py-0.5 text-[8px] font-bold text-lime">
          <Check className="h-2.5 w-2.5" />
          ZAKOŃCZONY
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-0.5 rounded bg-bg4 px-1.5 py-0.5 text-[8px] font-bold text-muted">
          <Clock className="h-2.5 w-2.5" />
          OCZEKUJE
        </span>
      );
  }
}

/* ─── Match Card ───────────────────────────────── */

function MatchCard({ match }: { match: BracketMatch }) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  return (
    <div
      className={cn(
        "w-52 rounded-lg border bg-bg2 transition-all",
        isLive
          ? "border-live/50 shadow-lg shadow-live/10"
          : isCompleted
            ? "border-lime/20"
            : "border-border"
      )}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5">
        {getStatusBadge(match.status)}
        {match.scheduledAt && match.status === "pending" && (
          <span className="text-[9px] text-muted">{match.scheduledAt}</span>
        )}
        {isLive && match.streamId && (
          <Link
            to={`/stream/${match.streamId}`}
            className="flex items-center gap-0.5 rounded bg-live/20 px-1.5 py-0.5 text-[8px] font-bold text-live hover:bg-live/30"
          >
            <Play className="h-2.5 w-2.5" />
            Oglądaj
          </Link>
        )}
      </div>

      {/* Teams */}
      <div className="px-2.5 pb-2.5">
        {/* Team 1 */}
        <div
          className={cn(
            "flex items-center justify-between rounded-t-md px-2 py-1.5",
            match.winnerId === "team1"
              ? "bg-lime/10"
              : "bg-bg3"
          )}
        >
          <span
            className={cn(
              "truncate text-xs font-medium",
              match.winnerId === "team1" ? "text-lime" : "text-text",
              !match.team1 && "text-muted italic"
            )}
          >
            {match.team1 || "TBD"}
          </span>
          {match.score1 !== null && (
            <span
              className={cn(
                "ml-2 font-mono text-sm font-bold",
                match.winnerId === "team1" ? "text-lime" : "text-text"
              )}
            >
              {match.score1}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Team 2 */}
        <div
          className={cn(
            "flex items-center justify-between rounded-b-md px-2 py-1.5",
            match.winnerId === "team2"
              ? "bg-lime/10"
              : "bg-bg3"
          )}
        >
          <span
            className={cn(
              "truncate text-xs font-medium",
              match.winnerId === "team2" ? "text-lime" : "text-text",
              !match.team2 && "text-muted italic"
            )}
          >
            {match.team2 || "TBD"}
          </span>
          {match.score2 !== null && (
            <span
              className={cn(
                "ml-2 font-mono text-sm font-bold",
                match.winnerId === "team2" ? "text-lime" : "text-text"
              )}
            >
              {match.score2}
            </span>
          )}
        </div>

        {/* Set scores */}
        {match.setScores && (
          <p className="mt-1 text-center text-[9px] text-muted">
            {match.setScores}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────── */

export function LiveBracket({ matches, tournamentName }: LiveBracketProps) {
  const rounds = Math.max(...matches.map((m) => m.round));
  const roundLabels = ["Ćwierćfinał", "Półfinał", "Finał", "Wielki Finał"];

  // Group matches by round
  const matchesByRound: Record<number, BracketMatch[]> = {};
  for (let r = 1; r <= rounds; r++) {
    matchesByRound[r] = matches
      .filter((m) => m.round === r)
      .sort((a, b) => a.position - b.position);
  }

  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-lime" />
          <h2 className="text-display text-lg">DRABINKA</h2>
          {liveCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-live/20 px-2 py-0.5 text-[10px] font-bold text-live">
              <Radio className="h-3 w-3" />
              {liveCount} mecz{liveCount > 1 ? "e" : ""} na żywo
            </span>
          )}
        </div>
      </div>

      {/* Bracket grid */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8" style={{ minWidth: `${rounds * 260}px` }}>
          {Array.from({ length: rounds }, (_, r) => r + 1).map((round) => {
            const roundMatches = matchesByRound[round] || [];
            const label =
              round === rounds
                ? "Finał"
                : round === rounds - 1
                  ? "Półfinał"
                  : round === rounds - 2
                    ? "Ćwierćfinał"
                    : `Runda ${round}`;

            return (
              <div key={round} className="flex flex-col">
                {/* Round label */}
                <div className="mb-3 text-center">
                  <span className="rounded-full bg-bg3 px-3 py-1 text-[10px] font-bold uppercase text-muted">
                    {label}
                  </span>
                </div>

                {/* Match cards with spacing for bracket lines */}
                <div
                  className="flex flex-1 flex-col justify-around gap-4"
                >
                  {roundMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
