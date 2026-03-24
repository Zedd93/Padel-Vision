import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ChevronRight,
  Medal,
  Flame,
  Filter,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

type Category = "all" | "OPEN" | "A" | "B1" | "B2" | "C";

interface RankedPlayer {
  rank: number;
  name: string;
  slug: string;
  club: string;
  points: number;
  matchesPlayed: number;
  winRate: number;
  trend: "up" | "down" | "same";
  trendDelta: number;
  streak: number;
  category: string;
}

/* ─── Mock Data ────────────────────────────────── */

const RANKINGS: RankedPlayer[] = [
  { rank: 1, name: "Tomasz Baran", slug: "tomasz-baran", club: "Padel Zone Warszawa", points: 2450, matchesPlayed: 156, winRate: 78.2, trend: "same", trendDelta: 0, streak: 8, category: "OPEN" },
  { rank: 2, name: "Jakub Zawadzki", slug: "jakub-zawadzki", club: "Padel Arena Kraków", points: 2380, matchesPlayed: 142, winRate: 75.4, trend: "up", trendDelta: 2, streak: 5, category: "OPEN" },
  { rank: 3, name: "Michał Czarnecki", slug: "michal-czarnecki", club: "Padel City Łódź", points: 2310, matchesPlayed: 138, winRate: 73.9, trend: "up", trendDelta: 1, streak: 3, category: "OPEN" },
  { rank: 4, name: "Piotr Krawczyk", slug: "piotr-krawczyk", club: "Smash Padel Wrocław", points: 2240, matchesPlayed: 161, winRate: 71.4, trend: "down", trendDelta: 2, streak: 0, category: "A" },
  { rank: 5, name: "Dawid Kamiński", slug: "dawid-kaminski", club: "Racket Club Poznań", points: 2180, matchesPlayed: 129, winRate: 72.1, trend: "up", trendDelta: 3, streak: 4, category: "A" },
  { rank: 6, name: "Robert Pawlak", slug: "robert-pawlak", club: "Padel Zone Warszawa", points: 2120, matchesPlayed: 145, winRate: 69.0, trend: "down", trendDelta: 1, streak: 0, category: "A" },
  { rank: 7, name: "Adam Jankowski", slug: "adam-jankowski", club: "Padel Masters Gdańsk", points: 2050, matchesPlayed: 118, winRate: 70.3, trend: "same", trendDelta: 0, streak: 2, category: "A" },
  { rank: 8, name: "Krzysztof Kubiak", slug: "krzysztof-kubiak", club: "Padel Center Katowice", points: 1980, matchesPlayed: 132, winRate: 68.2, trend: "up", trendDelta: 4, streak: 6, category: "A" },
  { rank: 9, name: "Łukasz Wróbel", slug: "lukasz-wrobel", club: "Smash Padel Wrocław", points: 1920, matchesPlayed: 125, winRate: 67.2, trend: "down", trendDelta: 3, streak: 0, category: "B1" },
  { rank: 10, name: "Marek Sikora", slug: "marek-sikora", club: "Padel Club Lublin", points: 1870, matchesPlayed: 110, winRate: 66.4, trend: "up", trendDelta: 1, streak: 3, category: "B1" },
  { rank: 11, name: "Paweł Nowicki", slug: "pawel-nowicki", club: "Padel Arena Kraków", points: 1810, matchesPlayed: 105, winRate: 65.7, trend: "same", trendDelta: 0, streak: 1, category: "B1" },
  { rank: 12, name: "Marcin Kowalski", slug: "marcin-kowalski", club: "Racket Club Katowice", points: 1760, matchesPlayed: 187, winRate: 66.3, trend: "up", trendDelta: 2, streak: 4, category: "A" },
  { rank: 13, name: "Wojciech Olszewski", slug: "wojciech-olszewski", club: "Padel Zone Warszawa", points: 1710, matchesPlayed: 98, winRate: 64.3, trend: "down", trendDelta: 1, streak: 0, category: "B1" },
  { rank: 14, name: "Sebastian Król", slug: "sebastian-krol", club: "Padel City Łódź", points: 1650, matchesPlayed: 88, winRate: 63.6, trend: "up", trendDelta: 5, streak: 7, category: "B1" },
  { rank: 15, name: "Artur Piotrowski", slug: "artur-piotrowski", club: "Padel Masters Gdańsk", points: 1590, matchesPlayed: 95, winRate: 62.1, trend: "same", trendDelta: 0, streak: 2, category: "B2" },
  { rank: 16, name: "Grzegorz Mazur", slug: "grzegorz-mazur", club: "Padel Center Katowice", points: 1540, matchesPlayed: 82, winRate: 61.0, trend: "down", trendDelta: 2, streak: 0, category: "B2" },
  { rank: 17, name: "Kamil Lewandowski", slug: "kamil-lewandowski", club: "Racket Club Poznań", points: 1480, matchesPlayed: 76, winRate: 60.5, trend: "up", trendDelta: 1, streak: 3, category: "B2" },
  { rank: 18, name: "Rafał Wiśniewski", slug: "rafal-wisniewski", club: "Smash Padel Wrocław", points: 1420, matchesPlayed: 91, winRate: 59.3, trend: "same", trendDelta: 0, streak: 1, category: "B2" },
  { rank: 19, name: "Bartosz Zieliński", slug: "bartosz-zielinski", club: "Padel Club Lublin", points: 1370, matchesPlayed: 68, winRate: 58.8, trend: "up", trendDelta: 3, streak: 4, category: "C" },
  { rank: 20, name: "Daniel Szymański", slug: "daniel-szymanski", club: "Padel Arena Kraków", points: 1310, matchesPlayed: 72, winRate: 56.9, trend: "down", trendDelta: 1, streak: 0, category: "C" },
];

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "Wszyscy" },
  { key: "OPEN", label: "OPEN" },
  { key: "A", label: "A" },
  { key: "B1", label: "B1" },
  { key: "B2", label: "B2" },
  { key: "C", label: "C" },
];

const TOP_MOVERS = RANKINGS
  .filter((p) => p.trend === "up")
  .sort((a, b) => b.trendDelta - a.trendDelta)
  .slice(0, 3);

/* ─── Component ────────────────────────────────── */

export default function RankingsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const filtered = RANKINGS.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.club.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-7 w-7 text-lime" />
            <h1 className="text-display text-2xl lg:text-3xl">Ranking Graczy</h1>
          </div>
          <p className="text-sm text-muted">
            Krajowy ranking Padel Vision — punkty przyznawane za turnieje na platformie.
            Aktualizacja co tydzień.
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-6 grid gap-3 grid-cols-3">
          {RANKINGS.slice(0, 3).map((player, i) => {
            const medals = ["🥇", "🥈", "🥉"];
            const bgColors = [
              "bg-yellow-500/10 border-yellow-500/20",
              "bg-gray-300/10 border-gray-300/20",
              "bg-orange/10 border-orange/20",
            ];
            return (
              <Link
                key={player.slug}
                to={`/player/${player.slug}`}
                className={cn(
                  "glass-card flex flex-col items-center p-4 text-center transition-all hover:scale-[1.02] border",
                  bgColors[i]
                )}
              >
                <span className="text-3xl mb-1">{medals[i]}</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg3 text-display text-lg text-lime mb-2">
                  {player.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <p className="text-sm font-semibold text-text">{player.name}</p>
                <p className="text-[10px] text-muted mb-1">{player.club}</p>
                <p className="font-mono text-lg font-bold text-lime">{player.points}</p>
                <p className="text-[9px] text-muted">punktów</p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="text-muted">{player.winRate}% WR</span>
                  {player.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-orange">
                      <Flame className="h-3 w-3" />
                      {player.streak}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Top Movers */}
        <div className="mb-6 glass-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Największe awanse tego tygodnia
          </h3>
          <div className="flex gap-3 overflow-x-auto">
            {TOP_MOVERS.map((player) => (
              <Link
                key={player.slug}
                to={`/player/${player.slug}`}
                className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5 min-w-fit transition-colors hover:bg-emerald-500/10"
              >
                <span className="flex items-center gap-1 font-mono text-sm font-bold text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +{player.trendDelta}
                </span>
                <div>
                  <p className="text-xs font-medium text-text">{player.name}</p>
                  <p className="text-[10px] text-muted">#{player.rank} · {player.club}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj gracza lub klubu..."
              className="w-full rounded-lg border border-border bg-bg3 py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted/50 focus:border-lime focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted mr-1" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  category === cat.key
                    ? "bg-lime/10 text-lime border border-lime/20"
                    : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rankings Table */}
        <div className="glass-card overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[3rem_1fr_10rem_5rem_5rem_4rem_3rem] gap-2 border-b border-border px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted">
            <span>#</span>
            <span>Gracz</span>
            <span>Klub</span>
            <span className="text-right">Punkty</span>
            <span className="text-right">Win Rate</span>
            <span className="text-center">Trend</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/50">
            {filtered.map((player) => (
              <Link
                key={player.slug}
                to={`/player/${player.slug}`}
                className={cn(
                  "group flex items-center gap-2 px-4 py-3 transition-colors hover:bg-bg3 sm:grid sm:grid-cols-[3rem_1fr_10rem_5rem_5rem_4rem_3rem]",
                  player.rank <= 3 && "bg-lime/[0.02]"
                )}
              >
                {/* Rank */}
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0",
                    player.rank === 1
                      ? "bg-yellow-500 text-black"
                      : player.rank === 2
                        ? "bg-gray-300 text-black"
                        : player.rank === 3
                          ? "bg-orange text-black"
                          : "bg-bg4 text-muted"
                  )}
                >
                  {player.rank}
                </span>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text group-hover:text-lime transition-colors truncate">
                      {player.name}
                    </span>
                    <span className="rounded bg-bg4 px-1.5 py-0.5 text-[9px] font-bold text-muted shrink-0">
                      {player.category}
                    </span>
                    {player.streak >= 5 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-orange shrink-0">
                        <Flame className="h-3 w-3" />
                        {player.streak}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted truncate sm:hidden">
                    {player.club}
                  </p>
                </div>

                {/* Club (desktop) */}
                <span className="hidden text-xs text-muted truncate sm:block">
                  {player.club}
                </span>

                {/* Points */}
                <span className="font-mono text-sm font-bold text-lime text-right">
                  {player.points}
                </span>

                {/* Win Rate */}
                <span className="hidden text-right font-mono text-xs text-text sm:block">
                  {player.winRate}%
                </span>

                {/* Trend */}
                <div className="hidden sm:flex items-center justify-center">
                  {player.trend === "up" && (
                    <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-mono">
                      <TrendingUp className="h-3 w-3" />
                      +{player.trendDelta}
                    </span>
                  )}
                  {player.trend === "down" && (
                    <span className="flex items-center gap-0.5 text-red-400 text-[10px] font-mono">
                      <TrendingDown className="h-3 w-3" />
                      -{player.trendDelta}
                    </span>
                  )}
                  {player.trend === "same" && (
                    <Minus className="h-3.5 w-3.5 text-muted" />
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="hidden sm:block h-4 w-4 text-muted group-hover:text-lime transition-colors ml-auto" />
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Brak wyników dla podanych kryteriów.
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-[10px] text-muted">
          Ranking obliczany na podstawie wyników turniejów rozegranych na PadelVision.tv ·
          Ostatnia aktualizacja: 10 marca 2026
        </p>
      </div>
    </div>
  );
}
