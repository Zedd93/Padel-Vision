import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Banknote,
  Radio,
  ArrowLeft,
  Share2,
  Eye,
  BarChart3,
  Target,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { LiveBracket, DEMO_BRACKET } from "@/components/tournaments/LiveBracket";

/* ─── Types ────────────────────────────────────── */

interface Prediction {
  matchId: string;
  pick: "team1" | "team2";
}

/* ─── Mock Data ────────────────────────────────── */

const MOCK_TOURNAMENT = {
  id: "silesia-open-2026",
  name: "SILESIA OPEN 2026",
  category: "OPEN A",
  clubName: "Racket Club Katowice",
  clubSlug: "racket-club-katowice",
  location: "Katowice, Kort 1-4",
  date: "13-14 marca 2026",
  teams: 8,
  prize: "10 000 zł",
  status: "live" as "live" | "upcoming" | "past",
  viewers: 3245,
  description:
    "Największy turniej padla na Śląsku. 8 najlepszych par z całej Polski walczy o tytuł mistrza i pulę nagród 10 000 zł.",
};

const PREDICTION_LEADERBOARD = [
  { rank: 1, username: "PadelProphet", correct: 6, total: 7 },
  { rank: 2, username: "AceHunter", correct: 5, total: 7 },
  { rank: 3, username: "SmashKing99", correct: 5, total: 7 },
  { rank: 4, username: "WarsawPadel", correct: 4, total: 7 },
  { rank: 5, username: "GoldenPoint", correct: 3, total: 7 },
];

/* ─── Component ────────────────────────────────── */

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = id || "silesia-open-2026";

  const [activeTab, setActiveTab] = useState<"bracket" | "predictions" | "info">("bracket");
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const tournament = { ...MOCK_TOURNAMENT, id: tournamentId };

  const handlePredict = (matchId: string, pick: "team1" | "team2") => {
    setPredictions((prev) => {
      const existing = prev.find((p) => p.matchId === matchId);
      if (existing) {
        return prev.map((p) =>
          p.matchId === matchId ? { ...p, pick } : p
        );
      }
      return [...prev, { matchId, pick }];
    });
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/tournaments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, matchId, pick, action: "predict" }),
    }).catch(() => {});
  };

  const tabs = [
    { key: "bracket" as const, label: "Drabinka", icon: Trophy },
    { key: "predictions" as const, label: "Typowania", icon: Target },
    { key: "info" as const, label: "Informacje", icon: BarChart3 },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          to="/browse"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do odkrywania
        </Link>

        {/* Tournament header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {tournament.status === "live" && (
                <span className="badge-live flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  NA ŻYWO
                </span>
              )}
              <span className="rounded bg-bg4 px-2 py-0.5 text-[10px] font-bold text-muted">
                {tournament.category}
              </span>
            </div>
            <h1 className="text-display text-2xl lg:text-3xl">
              {tournament.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <Link
                to={`/club/${tournament.clubSlug}`}
                className="flex items-center gap-1 text-lime hover:underline"
              >
                <Radio className="h-3.5 w-3.5" />
                {tournament.clubName}
              </Link>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {tournament.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {tournament.date}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tournament.status === "live" && (
              <span className="flex items-center gap-1.5 rounded-lg bg-bg3 px-3 py-2 text-sm text-muted">
                <Eye className="h-4 w-4" />
                {tournament.viewers.toLocaleString("pl-PL")} widzów
              </span>
            )}
            <button className="rounded-lg p-2 text-muted hover:bg-bg3 hover:text-text">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="glass-card flex items-center gap-3 p-3">
            <Users className="h-5 w-5 text-lime" />
            <div>
              <p className="text-lg font-bold text-text">{tournament.teams}</p>
              <p className="text-[10px] text-muted">par</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 p-3">
            <Banknote className="h-5 w-5 text-lime" />
            <div>
              <p className="text-lg font-bold text-text">{tournament.prize}</p>
              <p className="text-[10px] text-muted">pula nagród</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 p-3">
            <Trophy className="h-5 w-5 text-lime" />
            <div>
              <p className="text-lg font-bold text-text">
                {DEMO_BRACKET.filter((m) => m.status === "completed").length}/
                {DEMO_BRACKET.length}
              </p>
              <p className="text-[10px] text-muted">meczów rozegranych</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "border-lime text-lime"
                    : "border-transparent text-muted hover:text-text"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "bracket" && (
          <LiveBracket
            matches={DEMO_BRACKET}
            tournamentName={tournament.name}
          />
        )}

        {activeTab === "predictions" && (
          <div className="space-y-6">
            {/* Predictions intro */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-lime" />
                <h3 className="text-sm font-semibold text-text">
                  Typuj wyniki meczów!
                </h3>
              </div>
              <p className="text-xs text-muted">
                Kliknij na drużynę, którą typujesz jako zwycięzcę. Najlepsi
                typerzy trafiają na leaderboard!
              </p>
            </div>

            {/* Pending matches to predict */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-text">
                Nadchodzące mecze
              </h3>
              <div className="space-y-2">
                {DEMO_BRACKET.filter((m) => m.status === "pending" && m.team1 && m.team2).map(
                  (match) => {
                    const userPick = predictions.find(
                      (p) => p.matchId === match.id
                    )?.pick;
                    return (
                      <div
                        key={match.id}
                        className="glass-card flex items-center gap-3 p-3"
                      >
                        <button
                          onClick={() => handlePredict(match.id, "team1")}
                          className={cn(
                            "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                            userPick === "team1"
                              ? "bg-lime/20 text-lime border border-lime/30"
                              : "bg-bg3 text-text hover:bg-bg4"
                          )}
                        >
                          {match.team1}
                        </button>
                        <span className="text-xs text-muted">vs</span>
                        <button
                          onClick={() => handlePredict(match.id, "team2")}
                          className={cn(
                            "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                            userPick === "team2"
                              ? "bg-lime/20 text-lime border border-lime/30"
                              : "bg-bg3 text-text hover:bg-bg4"
                          )}
                        >
                          {match.team2}
                        </button>
                      </div>
                    );
                  }
                )}
                {DEMO_BRACKET.filter((m) => m.status === "pending" && m.team1 && m.team2).length === 0 && (
                  <p className="text-xs text-muted">
                    Brak dostępnych meczów do typowania — poczekaj na wyniki bieżących spotkań.
                  </p>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-text">
                Leaderboard typerów
              </h3>
              <div className="glass-card overflow-hidden">
                {PREDICTION_LEADERBOARD.map((entry) => (
                  <div
                    key={entry.rank}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5",
                      entry.rank <= 3 && "bg-lime/[0.02]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                        entry.rank === 1
                          ? "bg-yellow-500 text-black"
                          : entry.rank === 2
                            ? "bg-gray-300 text-black"
                            : entry.rank === 3
                              ? "bg-orange text-black"
                              : "bg-bg4 text-muted"
                      )}
                    >
                      {entry.rank}
                    </span>
                    <span className="flex-1 text-sm font-medium text-text">
                      {entry.username}
                    </span>
                    <span className="font-mono text-sm text-lime">
                      {entry.correct}/{entry.total}
                    </span>
                    <span className="text-xs text-muted">
                      ({Math.round((entry.correct / entry.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-text">Opis</h3>
              <p className="text-xs leading-relaxed text-muted">
                {tournament.description}
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-text">
                Szczegóły
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Organizator</span>
                  <Link
                    to={`/club/${tournament.clubSlug}`}
                    className="text-lime hover:underline"
                  >
                    {tournament.clubName}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Kategoria</span>
                  <span className="text-text">{tournament.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Lokalizacja</span>
                  <span className="text-text">{tournament.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Data</span>
                  <span className="text-text">{tournament.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Pula nagród</span>
                  <span className="font-bold text-lime">{tournament.prize}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
