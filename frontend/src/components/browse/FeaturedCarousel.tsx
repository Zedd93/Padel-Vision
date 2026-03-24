import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  Play,
  Radio,
  Trophy,
  MapPin,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface FeaturedStream {
  id: string;
  title: string;
  clubName: string;
  clubSlug: string;
  location: string;
  viewers: number;
  category: string;
  isLive: boolean;
  isTournament: boolean;
  description: string;
  startedAt: string;
}

/* ─── Mock Data ────────────────────────────────── */

const FEATURED_STREAMS: FeaturedStream[] = [
  {
    id: "feat-1",
    title: "SILESIA OPEN 2026 — Finał OPEN A",
    clubName: "Racket Club Katowice",
    clubSlug: "racket-club-katowice",
    location: "Katowice",
    viewers: 2847,
    category: "OPEN",
    isLive: true,
    isTournament: true,
    description:
      "Największy turniej padel na Śląsku. Najlepsze pary z całej Polski walczą o tytuł mistrza.",
    startedAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: "feat-2",
    title: "Liga Padel Warszawa — Runda 6",
    clubName: "Padel Arena Mokotów",
    clubSlug: "padel-arena-mokotow",
    location: "Warszawa",
    viewers: 1523,
    category: "OPEN",
    isLive: true,
    isTournament: true,
    description:
      "Szósta runda najpopularniejszej ligi padel w stolicy. Emocjonujące mecze w każdej kategorii.",
    startedAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "feat-3",
    title: "Turniej Kobiet — Wielki Finał",
    clubName: "Smash Padel Wrocław",
    clubSlug: "smash-padel-wroclaw",
    location: "Wrocław",
    viewers: 967,
    category: "KOBIETY",
    isLive: true,
    isTournament: true,
    description:
      "Finał kategorii KOBIETY — najlepsze zawodniczki Dolnego Śląska na jednym korcie.",
    startedAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

/* ─── Helpers ──────────────────────────────────── */

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ─── Component ────────────────────────────────── */

export function FeaturedCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % FEATURED_STREAMS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent(
      (c) => (c - 1 + FEATURED_STREAMS.length) % FEATURED_STREAMS.length
    );
  }, []);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const stream = FEATURED_STREAMS[current];

  return (
    <div
      className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-bg2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Link to={`/stream/${stream.id}`} className="block">
        {/* Background — gradient placeholder */}
        <div className="relative aspect-[21/9] bg-bg3 sm:aspect-[3/1]">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Animated placeholder visual */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-24 rounded-lg bg-lime/30"
                  style={{
                    animationDelay: `${i * 0.3}s`,
                    animation: "pulse 3s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
            {/* Badges */}
            <div className="mb-3 flex items-center gap-2">
              {stream.isLive && (
                <span className="badge-live flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  NA ŻYWO
                </span>
              )}
              {stream.isTournament && (
                <span className="flex items-center gap-1 rounded bg-yellow-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
                  <Trophy className="h-3 w-3" />
                  TURNIEJ
                </span>
              )}
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-sm">
                {stream.category}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-display text-xl leading-tight text-white sm:text-3xl">
              {stream.title}
            </h2>

            {/* Description */}
            <p className="mt-2 line-clamp-2 max-w-lg text-sm text-white/60">
              {stream.description}
            </p>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-lime" />
                {stream.clubName}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {stream.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {formatViewers(stream.viewers)} widzów
              </span>
            </div>

            {/* CTA */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-black transition-transform hover:scale-105">
                <Play className="h-4 w-4" />
                Oglądaj teraz
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Navigation arrows */}
      <button
        onClick={(e) => {
          e.preventDefault();
          prev();
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
        aria-label="Poprzedni"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          next();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
        aria-label="Następny"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {FEATURED_STREAMS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === current
                ? "w-6 bg-lime"
                : "w-1.5 bg-white/30 hover:bg-white/50"
            )}
            aria-label={`Slajd ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
