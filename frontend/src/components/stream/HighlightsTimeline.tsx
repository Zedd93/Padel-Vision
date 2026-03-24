import { useState } from "react";
import {
  Zap,
  Trophy,
  Target,
  Flame,
  Star,
  Clock,
  Play,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

export interface HighlightMarker {
  id: string;
  time: number; // seconds into the VOD
  endTime: number;
  type: "point" | "ace" | "break" | "set_end" | "match_point" | "golden_point" | "rally";
  label: string;
  intensity: number; // 0-100 (chat activity spike)
}

interface HighlightsTimelineProps {
  markers: HighlightMarker[];
  duration: number; // total VOD duration in seconds
  currentTime: number;
  onSeek: (time: number) => void;
}

/* ─── Config ───────────────────────────────────── */

const MARKER_ICONS: Record<HighlightMarker["type"], typeof Zap> = {
  point: Target,
  ace: Zap,
  break: Flame,
  set_end: Trophy,
  match_point: Star,
  golden_point: Star,
  rally: Sparkles,
};

const MARKER_COLORS: Record<HighlightMarker["type"], string> = {
  point: "#C8FF00",
  ace: "#C8FF00",
  break: "#FB923C",
  set_end: "#60A5FA",
  match_point: "#F87171",
  golden_point: "#FBBF24",
  rally: "#A78BFA",
};

/* ─── Helpers ──────────────────────────────────── */

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─── Component ────────────────────────────────── */

export function HighlightsTimeline({
  markers,
  duration,
  currentTime,
  onSeek,
}: HighlightsTimelineProps) {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);
  const visibleMarkers = showAll ? sortedMarkers : sortedMarkers.slice(0, 8);

  // Generate intensity heatmap
  const heatmapSegments = 100;
  const segmentWidth = duration / heatmapSegments;
  const heatmap = Array.from({ length: heatmapSegments }, (_, i) => {
    const segStart = i * segmentWidth;
    const segEnd = (i + 1) * segmentWidth;
    const matchingMarkers = markers.filter(
      (m) => m.time >= segStart && m.time < segEnd
    );
    const maxIntensity = matchingMarkers.reduce(
      (max, m) => Math.max(max, m.intensity),
      0
    );
    return maxIntensity;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lime" />
          <h3 className="text-sm font-semibold text-text">
            AI Highlights
          </h3>
          <span className="rounded-full bg-lime/10 px-2 py-0.5 text-[10px] font-bold text-lime">
            {markers.length} momentów
          </span>
        </div>
        <button
          onClick={() => {
            // Jump to first highlight
            if (sortedMarkers.length > 0) {
              onSeek(sortedMarkers[0].time);
            }
          }}
          className="flex items-center gap-1.5 rounded-lg bg-lime/10 px-3 py-1.5 text-xs font-medium text-lime transition-colors hover:bg-lime/20"
        >
          <Play className="h-3 w-3" />
          Obejrzyj skrót
        </button>
      </div>

      {/* Visual heatmap bar */}
      <div className="relative">
        <div className="flex h-8 gap-px overflow-hidden rounded-lg">
          {heatmap.map((intensity, i) => (
            <button
              key={i}
              onClick={() => onSeek(i * segmentWidth)}
              className="relative flex-1 transition-all hover:brightness-125"
              style={{
                backgroundColor:
                  intensity > 70
                    ? `rgba(200, 255, 0, ${0.3 + intensity * 0.007})`
                    : intensity > 30
                      ? `rgba(200, 255, 0, ${0.05 + intensity * 0.003})`
                      : "rgba(255,255,255,0.03)",
              }}
              title={`${formatTime(Math.floor(i * segmentWidth))}`}
            />
          ))}
        </div>

        {/* Current time indicator */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/80 transition-all"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Marker dots on heatmap */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="absolute top-0 h-full cursor-pointer"
            style={{
              left: `${(marker.time / duration) * 100}%`,
              width: "3px",
            }}
            onClick={() => onSeek(marker.time)}
            onMouseEnter={() => setHoveredMarker(marker.id)}
            onMouseLeave={() => setHoveredMarker(null)}
          >
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: MARKER_COLORS[marker.type] }}
            />

            {/* Tooltip */}
            {hoveredMarker === marker.id && (
              <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-bg2 px-3 py-2 text-xs shadow-xl">
                <p className="font-medium text-text">{marker.label}</p>
                <p className="text-muted">{formatTime(marker.time)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Marker list */}
      <div className="space-y-1">
        {visibleMarkers.map((marker) => {
          const Icon = MARKER_ICONS[marker.type] || Zap;
          const color = MARKER_COLORS[marker.type];
          const isActive =
            currentTime >= marker.time && currentTime < marker.endTime;

          return (
            <button
              key={marker.id}
              onClick={() => onSeek(marker.time)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all",
                isActive
                  ? "bg-lime/10 border border-lime/20"
                  : "bg-bg3 hover:bg-bg4"
              )}
            >
              <Icon
                className="h-4 w-4 flex-shrink-0"
                style={{ color }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "truncate text-xs font-medium",
                    isActive ? "text-lime" : "text-text"
                  )}
                >
                  {marker.label}
                </p>
              </div>
              <span className="flex-shrink-0 font-mono text-[10px] text-muted">
                {formatTime(marker.time)}
              </span>
              {/* Intensity bar */}
              <div className="w-12 flex-shrink-0">
                <div className="h-1 rounded-full bg-bg4">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${marker.intensity}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Show more */}
      {sortedMarkers.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full rounded-lg bg-bg3 py-2 text-xs text-muted transition-colors hover:bg-bg4 hover:text-text"
        >
          {showAll
            ? "Pokaż mniej"
            : `Pokaż wszystkie (${sortedMarkers.length})`}
        </button>
      )}
    </div>
  );
}
