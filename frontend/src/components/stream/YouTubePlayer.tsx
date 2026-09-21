import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  SkipBack,
  Scissors,
  RotateCcw,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  useYouTubeIframeApi,
  YT_STATE,
  type YouTubePlayerInstance,
} from "@/hooks/useYouTubeIframeApi";
import type { StreamMarker } from "./types";

/* ─── Types ────────────────────────────────────── */

interface YouTubePlayerProps {
  videoId: string;
  isLive: boolean;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  markers?: StreamMarker[];
  onClipRequest?: (currentTime: number) => void;
}

/* ─── Helpers ──────────────────────────────────── */

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** IFrame API nie ma odpowiednika zdarzenia `timeupdate` — odpytujemy sami. */
const POLL_INTERVAL = 250;

/* ─── Component ────────────────────────────────── */

/**
 * Odtwarzacz YouTube z własnymi kontrolkami (`controls: 0`), żeby transmisja
 * wyglądała jak reszta PadelVision, a nie jak osadzony YouTube.
 *
 * Czego świadomie nie ma w stosunku do {@link HlsPlayer}:
 * selektora jakości — `setPlaybackQuality` jest w IFrame API martwe od 2019
 * i jakością steruje wyłącznie YouTube.
 */
export function YouTubePlayer({
  videoId,
  isLive,
  poster,
  autoPlay = true,
  muted: initialMuted = true,
  markers = [],
  onClipRequest,
}: YouTubePlayerProps) {
  const { api, error: apiError } = useYouTubeIframeApi();

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const replayReturnTimeRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedRatio, setBufferedRatio] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);
  const [dvrOffset, setDvrOffset] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState<StreamMarker | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [instantReplayActive, setInstantReplayActive] = useState(false);

  /* ─── Utworzenie odtwarzacza ─────────────────── */

  useEffect(() => {
    if (!api || !mountRef.current) return;

    const player = new api.Player(mountRef.current, {
      videoId,
      playerVars: {
        autoplay: autoPlay ? 1 : 0,
        // autoplay z dźwiękiem jest blokowane przez przeglądarki
        mute: initialMuted || autoPlay ? 1 : 0,
        controls: 0,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          playerRef.current = event.target;
          setReady(true);
          setMuted(event.target.isMuted());
          setVolume(event.target.getVolume() / 100);
        },
        onStateChange: (event) => {
          setPlaying(event.data === YT_STATE.PLAYING);
          setBuffering(event.data === YT_STATE.BUFFERING);
        },
      },
    });

    playerRef.current = player;

    return () => {
      player.destroy();
      playerRef.current = null;
      setReady(false);
    };
    // videoId celowo poza zależnościami niżej — zmiana filmu obsłużona osobno,
    // żeby nie przeładowywać całego iframe'a.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // Zmiana transmisji bez niszczenia iframe'a
  useEffect(() => {
    if (ready && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  /* ─── Odpytywanie czasu ──────────────────────── */

  useEffect(() => {
    if (!ready) return;

    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player || isSeeking) return;

      const time = player.getCurrentTime();
      const total = player.getDuration();

      setCurrentTime(time);
      setDuration(total);
      setBufferedRatio(player.getVideoLoadedFraction());

      if (replayReturnTimeRef.current !== null && time >= replayReturnTimeRef.current) {
        player.setPlaybackRate(1);
        setPlaybackRate(1);
        setInstantReplayActive(false);
        replayReturnTimeRef.current = null;
      }

      if (isLive && total > 0) {
        const offset = total - time;
        setDvrOffset(offset);
        setIsAtLiveEdge(offset < 5);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [ready, isSeeking, isLive]);

  /* ─── Fullscreen ─────────────────────────────── */

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ─── Sterowanie ─────────────────────────────── */

  const cancelReplay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setPlaybackRate(1);
    setPlaybackRate(1);
    setInstantReplayActive(false);
    replayReturnTimeRef.current = null;
  }, []);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (instantReplayActive) cancelReplay();
    if (player.getPlayerState() === YT_STATE.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [instantReplayActive, cancelReplay]);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }, []);

  const changeVolume = useCallback((value: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(value * 100);
    setVolume(value);
    if (value === 0) {
      player.mute();
      setMuted(true);
    } else if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    const player = playerRef.current;
    if (!player) return;
    const clamped = Math.max(0, Math.min(time, player.getDuration() || 0));
    player.seekTo(clamped, true);
    setCurrentTime(clamped);
  }, []);

  const skipBack = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player) return;
      seekTo(player.getCurrentTime() - seconds);
    },
    [seekTo]
  );

  const jumpToLive = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const total = player.getDuration();
    if (total > 0) {
      player.seekTo(total, true);
      setIsAtLiveEdge(true);
      setDvrOffset(0);
      cancelReplay();
    }
  }, [cancelReplay]);

  const instantReplay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (instantReplayActive) {
      cancelReplay();
      return;
    }
    replayReturnTimeRef.current = player.getCurrentTime();
    seekTo(player.getCurrentTime() - 15);
    player.setPlaybackRate(0.5);
    setPlaybackRate(0.5);
    setInstantReplayActive(true);
  }, [seekTo, instantReplayActive, cancelReplay]);

  const changeSpeed = useCallback((rate: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (rate === 1) setInstantReplayActive(false);
  }, []);

  /* ─── Seekbar ────────────────────────────────── */

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const bar = seekBarRef.current;
      if (!bar || !duration) return undefined;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleSeekStart = useCallback(
    (e: React.MouseEvent) => {
      setIsSeeking(true);
      const time = timeFromClientX(e.clientX);
      if (time !== undefined) setSeekPreview(time);

      const onMove = (ev: MouseEvent) => {
        const t = timeFromClientX(ev.clientX);
        if (t !== undefined) setSeekPreview(t);
      };
      const onUp = (ev: MouseEvent) => {
        const t = timeFromClientX(ev.clientX);
        if (t !== undefined) seekTo(t);
        setIsSeeking(false);
        setSeekPreview(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [timeFromClientX, seekTo]
  );

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const progressRatio = duration ? (seekPreview ?? currentTime) / duration : 0;

  /* ─── Render ─────────────────────────────────── */

  if (apiError) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-black text-center">
        <AlertTriangle className="h-8 w-8 text-orange" />
        <p className="text-sm font-medium text-text">Nie udało się załadować odtwarzacza YouTube</p>
        <p className="text-xs text-muted">Sprawdź połączenie lub blokadę skryptów w przeglądarce</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Iframe YouTube — przykryty warstwą przechwytującą kliknięcia,
          żeby klik w obraz sterował naszym odtwarzaczem, a nie YouTube */}
      <div ref={mountRef} className="h-full w-full" />
      <div className="absolute inset-0 cursor-pointer" onClick={togglePlay} />

      {poster && !ready && (
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {(buffering || !ready) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-lime/30 border-t-lime" />
        </div>
      )}

      {ready && !playing && !buffering && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
          onClick={togglePlay}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/20 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-lime" fill="currentColor" />
          </div>
        </div>
      )}

      {instantReplayActive && (
        <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-lg bg-lime/20 px-3 py-1.5 text-xs font-bold text-lime backdrop-blur-sm">
          <RotateCcw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "2s" }} />
          POWTÓRKA {playbackRate}x
        </div>
      )}

      {hoveredMarker && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg bg-bg2/90 px-3 py-1.5 text-xs font-medium text-text shadow-lg backdrop-blur-sm">
          {hoveredMarker.label}
        </div>
      )}

      {/* Kontrolki */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300",
          showControls || !playing ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="mb-2 px-0.5">
          <div
            ref={seekBarRef}
            className="group/seek relative h-1 cursor-pointer rounded-full bg-white/20 transition-all hover:h-1.5"
            onMouseDown={handleSeekStart}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-white/20"
              style={{ width: `${bufferedRatio * 100}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-lime"
              style={{ width: `${progressRatio * 100}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime opacity-0 shadow transition-opacity group-hover/seek:opacity-100"
              style={{ left: `${progressRatio * 100}%` }}
            />

            {markers.map((marker, i) => {
              const ratio = duration ? marker.time / duration : 0;
              if (ratio <= 0 || ratio >= 1) return null;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 transition-transform hover:scale-150"
                  style={{ left: `${ratio * 100}%`, backgroundColor: marker.color }}
                  title={marker.label}
                  onMouseEnter={() => setHoveredMarker(marker)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    seekTo(marker.time);
                  }}
                />
              );
            })}
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] text-white/60">
            {isLive ? (
              <>
                <span>{isAtLiveEdge ? "" : `-${formatTime(dvrOffset)}`}</span>
                <span />
              </>
            ) : (
              <>
                <span>{formatTime(seekPreview ?? currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white transition-colors hover:text-lime">
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => skipBack(15)}
            className="text-white transition-colors hover:text-lime"
            title="Cofnij 15s"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={() => skipBack(30)}
            className="relative text-white transition-colors hover:text-lime"
            title="Cofnij 30s"
          >
            <SkipBack className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 text-[8px] font-bold">30</span>
          </button>

          {isLive && (
            <button
              onClick={instantReplay}
              className={cn(
                "flex items-center gap-1 transition-colors",
                instantReplayActive ? "text-lime" : "text-white hover:text-lime"
              )}
              title="Powtórka (slow-mo)"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden text-[10px] sm:inline">Powtórka</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className={cn(
                "flex items-center gap-1 transition-colors",
                playbackRate !== 1 ? "text-lime" : "text-white hover:text-lime"
              )}
              title="Prędkość odtwarzania"
            >
              <Gauge className="h-4 w-4" />
              {playbackRate !== 1 && <span className="text-[10px] font-bold">{playbackRate}x</span>}
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-8 left-0 min-w-[100px] rounded-lg border border-border bg-bg3 py-1 shadow-xl">
                {[0.25, 0.5, 0.75, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                      playbackRate === rate ? "text-lime" : "text-text hover:bg-bg4"
                    )}
                  >
                    {rate}x{rate === 1 && " (normalnie)"}
                    {rate === 0.5 && " (slow-mo)"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={toggleMute} className="text-white transition-colors hover:text-lime">
              {muted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-lime [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lime"
            />
          </div>

          {isLive && (
            <button
              onClick={jumpToLive}
              className={cn(
                "ml-1 flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold uppercase transition-all",
                isAtLiveEdge
                  ? "cursor-default bg-transparent text-live"
                  : "bg-live/20 text-live hover:bg-live/30"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isAtLiveEdge ? "animate-live-pulse bg-live" : "bg-white/40"
                )}
              />
              {isAtLiveEdge ? "Na żywo" : "Wróć na żywo"}
            </button>
          )}

          <div className="flex-1" />

          {onClipRequest && (
            <button
              onClick={() => onClipRequest(currentTime)}
              className="flex items-center gap-1 text-white transition-colors hover:text-lime"
              title="Utwórz klip"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden text-xs sm:inline">Klip</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="text-white transition-colors hover:text-lime"
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
