import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Calendar,
  Clock,
  Eye,
  Radio,
  Share2,
  Download,
  Zap,
  Pencil,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Mock Data ────────────────────────────────── */

const MOCK_VOD = {
  id: "vod-1",
  title: "Silesia Open 2026 — Finał: Kowalski/Nowak vs Wiśniewski/Zając",
  clubName: "Racket Club Katowice",
  clubSlug: "racket-club-katowice",
  date: "14 marca 2026",
  duration: 2700,
  views: 4521,
  category: "OPEN A",
  thumbnailUrl: null,
  score: "6-4, 3-6, 7-5",
};

const MOCK_HIGHLIGHTS = [
  { id: "h1", time: 124, endTime: 140, type: "ace" as const, label: "As serwisowy — Kowalski", intensity: 72 },
  { id: "h2", time: 312, endTime: 330, type: "rally" as const, label: "Niesamowity rally — 28 uderzeń!", intensity: 95 },
  { id: "h3", time: 487, endTime: 500, type: "break" as const, label: "Przełamanie — Wiśniewski/Zając", intensity: 68 },
  { id: "h4", time: 721, endTime: 740, type: "golden_point" as const, label: "Złoty punkt! Smash z woleja", intensity: 88 },
  { id: "h5", time: 945, endTime: 960, type: "set_end" as const, label: "Koniec seta 1 — 6:4", intensity: 82 },
  { id: "h6", time: 1203, endTime: 1220, type: "ace" as const, label: "Podwójny as — Nowak!", intensity: 76 },
  { id: "h7", time: 1567, endTime: 1585, type: "match_point" as const, label: "Piłka meczowa!", intensity: 98 },
];

/* ─── Component ────────────────────────────────── */

export default function VodPage() {
  const { id } = useParams<{ id: string }>();
  const vodId = id || "vod-1";

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeTab, setActiveTab] = useState<"highlights" | "coaching">("highlights");

  const vod = { ...MOCK_VOD, id: vodId };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const tabs = [
    { key: "highlights" as const, label: "Highlights (AI)", icon: Zap },
    { key: "coaching" as const, label: "Coaching", icon: Pencil },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <Link
          to="/browse"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do odkrywania
        </Link>

        {/* Video Player Placeholder */}
        <div className="relative mb-4 overflow-hidden rounded-xl bg-bg3">
          <div className="flex aspect-video items-center justify-center">
            <div className="text-center">
              <Play className="mx-auto mb-2 h-12 w-12 text-muted" />
              <p className="text-sm text-muted">VOD Player</p>
              <p className="mt-1 font-mono text-xs text-muted/50">
                {vod.id} — {formatDuration(vod.duration)}
              </p>
            </div>
          </div>

          {/* Score badge */}
          <div className="absolute left-4 top-4 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-md">
            <p className="font-mono text-sm font-bold text-white">{vod.score}</p>
          </div>

          {/* Playback rate indicator */}
          {playbackRate !== 1 && (
            <div className="absolute right-4 top-4 rounded-lg bg-lime/20 px-2.5 py-1 backdrop-blur-md">
              <p className="font-mono text-xs font-bold text-lime">{playbackRate}x</p>
            </div>
          )}
        </div>

        {/* VOD Info */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-display text-xl lg:text-2xl">{vod.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <Link
                to={`/club/${vod.clubSlug}`}
                className="flex items-center gap-1 text-lime hover:underline"
              >
                <Radio className="h-3.5 w-3.5" />
                {vod.clubName}
              </Link>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {vod.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(vod.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {vod.views.toLocaleString("pl-PL")} wyświetleń
              </span>
              <span className="rounded bg-bg4 px-2 py-0.5 text-[10px] font-bold">
                {vod.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 text-muted hover:bg-bg3 hover:text-text">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-muted hover:bg-bg3 hover:text-text">
              <Download className="h-4 w-4" />
            </button>
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

        {/* Tab Content */}
        {activeTab === "highlights" && (
          <div className="space-y-4">
            <h3 className="text-display text-base">Kluczowe momenty (AI)</h3>
            {/* Timeline visualization */}
            <div className="relative h-12 rounded-lg bg-bg3 overflow-hidden">
              {MOCK_HIGHLIGHTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setCurrentTime(h.time)}
                  className="absolute top-0 h-full w-1 hover:w-2 transition-all"
                  style={{
                    left: `${(h.time / vod.duration) * 100}%`,
                    backgroundColor: h.intensity > 90 ? "#C8FF00" : h.intensity > 75 ? "#FB923C" : "#60A5FA",
                    opacity: 0.8,
                  }}
                  title={h.label}
                />
              ))}
            </div>
            {/* Highlights list */}
            <div className="space-y-2">
              {MOCK_HIGHLIGHTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setCurrentTime(h.time)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    currentTime >= h.time && currentTime < (h.endTime || h.time + 15)
                      ? "bg-lime/10 border border-lime/20"
                      : "bg-bg3 hover:bg-bg4"
                  )}
                >
                  <span className="font-mono text-xs text-muted">{formatTimestamp(h.time)}</span>
                  <div className="h-2 w-2 rounded-full" style={{
                    backgroundColor: h.intensity > 90 ? "#C8FF00" : h.intensity > 75 ? "#FB923C" : "#60A5FA",
                  }} />
                  <span className="flex-1 text-xs text-text">{h.label}</span>
                  <span className="text-[10px] text-muted">{h.intensity}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "coaching" && (
          <div className="glass-card p-6">
            <h3 className="text-display text-base mb-3">Narzędzia coachingowe</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 rounded-lg bg-bg3 px-4 py-3 text-sm text-text hover:bg-bg4 transition-colors">
                <Pencil className="h-4 w-4 text-lime" />
                Rysuj na klatce
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-bg3 px-4 py-3 text-sm text-text hover:bg-bg4 transition-colors">
                <Zap className="h-4 w-4 text-orange" />
                Analiza AI
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-muted">Prędkość:</span>
              {[0.25, 0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setPlaybackRate(rate)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-mono transition-colors",
                    playbackRate === rate
                      ? "bg-lime/20 text-lime"
                      : "bg-bg3 text-muted hover:text-text"
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
