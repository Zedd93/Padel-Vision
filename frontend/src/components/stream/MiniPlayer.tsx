import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Radio,
  Users,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface MiniPlayerProps {
  hlsUrl: string;
  title: string;
  clubName: string;
  viewers: number;
  isLive?: boolean;
  isActive?: boolean; // Is this the one with audio
  scoreLabel?: string; // e.g. "6:4 / SET 2"
  onActivate?: () => void;
  onExpand?: () => void;
  onRemove?: () => void;
}

/* ─── Component ────────────────────────────────── */

export function MiniPlayer({
  hlsUrl,
  title,
  clubName,
  viewers,
  isLive = true,
  isActive = false,
  scoreLabel,
  onActivate,
  onExpand,
  onRemove,
}: MiniPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [muted, setMuted] = useState(!isActive);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        liveSyncDurationCount: 3,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          video.muted = true;
          setMuted(true);
          video.play();
        });
      });

      hlsRef.current = hls;
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.play();
    }
  }, [hlsUrl]);

  // Sync muted state with isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isActive;
    setMuted(!isActive);
  }, [isActive]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) onActivate?.();
  }, [onActivate]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-black transition-all cursor-pointer",
        isActive
          ? "border-lime ring-2 ring-lime/30"
          : "border-border hover:border-muted"
      )}
      onClick={() => onActivate?.()}
    >
      {/* Video */}
      <div className="aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted={muted}
        />
      </div>

      {/* Live badge + viewers */}
      <div className="absolute left-2 top-2 flex items-center gap-2">
        {isLive && (
          <span className="badge-live flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold">
            <Radio className="h-2.5 w-2.5" />
            LIVE
          </span>
        )}
        <span className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
          <Users className="h-2.5 w-2.5" />
          {viewers.toLocaleString("pl-PL")}
        </span>
      </div>

      {/* Score label */}
      {scoreLabel && (
        <div className="absolute right-2 top-2 rounded bg-bg2/90 px-2 py-0.5 text-xs font-mono font-bold text-lime backdrop-blur-sm">
          {scoreLabel}
        </div>
      )}

      {/* Action buttons (visible on hover) */}
      <div className="absolute right-1 bottom-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={toggleMute}
          className="rounded-lg bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-lime"
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
        {onExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="rounded-lg bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-lime"
            title="Pełny widok"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded-lg bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-live"
            title="Usuń"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Info bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-2">
        <p className="truncate text-xs font-semibold text-white">{title}</p>
        <p className="truncate text-[10px] text-white/60">{clubName}</p>
      </div>

      {/* Active audio indicator */}
      {isActive && (
        <div className="absolute left-2 bottom-2 flex items-center gap-1">
          <div className="flex items-end gap-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-lime animate-pulse"
                style={{
                  height: `${6 + i * 3}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
