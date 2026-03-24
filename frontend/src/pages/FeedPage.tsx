import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Users, Trophy, ChevronRight } from "lucide-react";

/* ─── Mock data — will be replaced with API calls ─── */

const featuredStream = {
  id: "1",
  title: "Silesia Open 2025 — Finał OPEN A",
  clubName: "Racket Club Katowice",
  clubSlug: "racket-club",
  viewerCount: 1247,
  thumbnailUrl: null,
  tags: ["turniej", "OPEN A", "Śląsk"],
};

const liveStreams = [
  {
    id: "2",
    title: "Liga Weekendowa — Mecz 3",
    clubName: "Padel Kraków",
    clubSlug: "padel-krakow",
    viewerCount: 432,
    tags: ["liga", "B1"],
  },
  {
    id: "3",
    title: "Turniej Kobiet — Półfinał",
    clubName: "Smash Arena Wrocław",
    clubSlug: "smash-arena",
    viewerCount: 289,
    tags: ["turniej", "KOBIETY"],
  },
  {
    id: "4",
    title: "Americano Night — Kort 2",
    clubName: "Vamos Padel Gdańsk",
    clubSlug: "vamos-padel",
    viewerCount: 156,
    tags: ["americano", "C"],
  },
];

const tournaments = [
  { id: "1", name: "Warsaw Padel Masters", club: "Warsaw Padel Club", date: "15 Mar", level: "A" },
  { id: "2", name: "Kraków Open", club: "Padel Kraków", date: "22 Mar", level: "B1" },
  { id: "3", name: "Silesia Cup", club: "Racket Club", date: "29 Mar", level: "OPEN" },
  { id: "4", name: "Beach Padel Gdańsk", club: "Vamos Padel", date: "5 Apr", level: "C" },
];

/* ─── StreamCard ─── */

function StreamCard({
  stream,
}: {
  stream: (typeof liveStreams)[number];
}) {
  return (
    <Link to={`/stream/${stream.id}`} className="glass-card-hover overflow-hidden">
      <div className="relative aspect-video bg-bg3">
        <div className="absolute left-2 top-2 flex items-center gap-2">
          <span className="badge-live text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-live-pulse" />
            LIVE
          </span>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-bg/70 px-1.5 py-0.5 text-xs text-text backdrop-blur-sm">
          <Users className="h-3 w-3" />
          {stream.viewerCount}
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-text line-clamp-1">
          {stream.title}
        </h3>
        <p className="text-xs text-muted">{stream.clubName}</p>
        <div className="mt-1.5 flex gap-1.5">
          {stream.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-bg4 px-1.5 py-0.5 text-[10px] text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

/* ─── Page Component ─── */

export default function FeedPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero: Featured Stream */}
      <section className="relative">
        <Link to={`/stream/${featuredStream.id}`}>
          <div className="relative aspect-video max-h-[480px] w-full overflow-hidden bg-bg3">
            {/* Video background */}
            <video
              src="/test.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Overlay gradient + play icon */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-bg/90 via-bg/20 to-transparent">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/20 backdrop-blur-sm">
                <Play className="h-8 w-8 text-lime" fill="currentColor" />
              </div>
            </div>

            {/* Stream info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg via-bg/80 to-transparent p-6 pt-16">
              <div className="flex items-center gap-3">
                <span className="badge-live">
                  <span className="h-2 w-2 rounded-full bg-white animate-live-pulse" />
                  NA ŻYWO
                </span>
                <span className="flex items-center gap-1 text-sm text-muted">
                  <Users className="h-3.5 w-3.5" />
                  {featuredStream.viewerCount.toLocaleString()}
                </span>
              </div>
              <h2 className="text-display mt-2 text-2xl text-text md:text-3xl">
                {featuredStream.title}
              </h2>
              <p className="text-sm text-muted">{featuredStream.clubName}</p>
              <div className="mt-2 flex gap-2">
                {featuredStream.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-bg4 px-2 py-0.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Live Now */}
      <section className="px-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display flex items-center gap-2 text-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-live animate-live-pulse" />
            Na Żywo Teraz
          </h2>
          <Link
            to="/browse"
            className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-lime"
          >
            Wszystkie
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveStreams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      </section>

      {/* Tournaments Today */}
      <section className="px-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-lime" />
            Nadchodzące Turnieje
          </h2>
          <Link
            to="/browse?tab=tournaments"
            className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-lime"
          >
            Wszystkie
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="glass-card-hover min-w-[260px] flex-shrink-0 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-lime/10 px-2 py-0.5 text-xs font-semibold text-lime">
                  {t.level}
                </span>
                <span className="text-xs text-muted">{t.date}</span>
              </div>
              <h3 className="font-semibold text-text">{t.name}</h3>
              <p className="text-sm text-muted">{t.club}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent VODs */}
      <section className="px-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display text-xl">Ostatnie Nagrania</h2>
          <Link
            to="/browse?tab=vods"
            className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-lime"
          >
            Więcej
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card-hover overflow-hidden">
              <div className="aspect-video bg-bg3" />
              <div className="p-3">
                <p className="text-sm font-medium text-text">
                  Turniej Weekendowy — Mecz {i}
                </p>
                <p className="text-xs text-muted">2h temu</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
