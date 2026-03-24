import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Scissors,
  TrendingUp,
  Clock,
  Eye,
  ThumbsUp,
  Play,
  Monitor,
  Smartphone,
  Trophy,
  Filter,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface Clip {
  id: string;
  title: string;
  streamTitle: string;
  clubName: string;
  clubSlug: string;
  creatorName: string;
  duration: number;
  views: number;
  votes: number;
  format: "horizontal" | "vertical";
  thumbnail: string;
  createdAt: string;
}

/* ─── Filters ──────────────────────────────────── */

const PERIOD_FILTERS = [
  { value: "today", label: "Dziś" },
  { value: "week", label: "Tydzień" },
  { value: "month", label: "Miesiąc" },
  { value: "all", label: "Wszystko" },
];

const SORT_OPTIONS = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "newest", label: "Najnowsze", icon: Clock },
  { value: "views", label: "Wyświetlenia", icon: Eye },
];

/* ─── Helpers ──────────────────────────────────── */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "teraz";
  if (hours < 24) return `${hours}h temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d temu`;
  return `${Math.floor(days / 7)}tyg temu`;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ─── Page Component ───────────────────────────── */

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [period, setPeriod] = useState("week");
  const [sort, setSort] = useState("trending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/clips?period=${period}&sort=${sort}`)
      .then((r) => r.json())
      .then((data) => {
        setClips(data.clips || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, sort]);

  // Top 3 for leaderboard
  const topClips = clips.slice(0, 3);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/10">
            <Scissors className="h-5 w-5 text-lime" />
          </div>
          <div>
            <h1 className="text-display text-2xl">KLIPY</h1>
            <p className="text-sm text-muted">
              Najlepsze momenty z turniejów padla
            </p>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                sort === opt.value
                  ? "bg-lime/20 text-lime"
                  : "bg-bg3 text-muted hover:text-text"
              )}
            >
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period filters */}
      <div className="mb-6 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted" />
        {PERIOD_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setPeriod(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              period === f.value
                ? "bg-lime text-black"
                : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Clip Leaderboard — Top 3 */}
      {topClips.length > 0 && sort === "trending" && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold text-text">
              TOP KLIPY TYGODNIA
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {topClips.map((clip, index) => (
              <Link
                key={clip.id}
                to={`/clips/${clip.id}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-bg2 transition-all hover:border-lime hover:-translate-y-1"
              >
                {/* Rank badge */}
                <div
                  className={cn(
                    "absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    index === 0
                      ? "bg-yellow-500 text-black"
                      : index === 1
                        ? "bg-gray-300 text-black"
                        : "bg-orange text-black"
                  )}
                >
                  #{index + 1}
                </div>

                {/* Thumbnail */}
                <div
                  className={cn(
                    "relative bg-bg3",
                    clip.format === "vertical"
                      ? "aspect-[9/16] max-h-48"
                      : "aspect-video"
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-10 w-10 text-white/80 transition-transform group-hover:scale-110" />
                  </div>
                  {/* Duration */}
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                    {formatDuration(clip.duration)}
                  </span>
                  {/* Format badge */}
                  <span className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white/80">
                    {clip.format === "vertical" ? (
                      <Smartphone className="h-3 w-3" />
                    ) : (
                      <Monitor className="h-3 w-3" />
                    )}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-text group-hover:text-lime">
                    {clip.title}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {clip.clubName}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViews(clip.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {clip.votes}
                    </span>
                    <span>{timeAgo(clip.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Clips Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-border bg-bg2"
            >
              <div className="aspect-video bg-bg3" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-bg3" />
                <div className="h-3 w-1/2 rounded bg-bg3" />
              </div>
            </div>
          ))}
        </div>
      ) : clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Scissors className="mb-3 h-12 w-12 text-muted/30" />
          <p className="text-sm text-muted">Brak klipów w wybranym okresie</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clips.map((clip) => (
            <Link
              key={clip.id}
              to={`/clips/${clip.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-bg2 transition-all hover:border-lime hover:-translate-y-1"
            >
              {/* Thumbnail */}
              <div
                className={cn(
                  "relative bg-bg3",
                  clip.format === "vertical"
                    ? "aspect-[9/16] max-h-52"
                    : "aspect-video"
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-10 w-10 text-white/80" />
                </div>
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                  {formatDuration(clip.duration)}
                </span>
                <span className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white/80">
                  {clip.format === "vertical" ? (
                    <Smartphone className="h-3 w-3" />
                  ) : (
                    <Monitor className="h-3 w-3" />
                  )}
                </span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-text group-hover:text-lime">
                  {clip.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {clip.clubName} · {clip.creatorName}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatViews(clip.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {clip.votes}
                  </span>
                  <span>{timeAgo(clip.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
