import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  SkipBack,
  Radio,
  Scissors,
  RotateCcw,
  Gauge,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

export interface StreamMarker {
  time: number; // seconds from stream start
  type: "ace" | "break" | "match_point" | "golden_point" | "set_end";
  label: string;
  color: string;
}

interface VideoPlayerProps {
  hlsUrl: string;
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

const DVR_MAX_BUFFER = 300; // 5 minutes max DVR

/* ─── Component ────────────────────────────────── */

export function VideoPlayer({
  hlsUrl,
  isLive,
  poster,
  autoPlay = true,
  muted: initialMuted = false,
  markers = [],
  onClipRequest,
}: VideoPlayerProps) {
  const isMp4 = hlsUrl.endsWith(".mp4") || hlsUrl.endsWith(".webm");

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<Array<{ id: number; label: string }>>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [buffering, setBuffering] = useState(false);

  // DVR / Seekbar state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);
  const [dvrOffset, setDvrOffset] = useState(0); // how many seconds behind live
  const [hoveredMarker, setHoveredMarker] = useState<StreamMarker | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [instantReplayActive, setInstantReplayActive] = useState(false);

  // Initialize HLS or MP4
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    if (isMp4) {
      video.src = hlsUrl;
      video.muted = initialMuted;
      if (autoPlay) {
        video.play().catch(() => {
          video.muted = true;
          setMuted(true);
          video.play();
        });
      }
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        backBufferLength: isLive ? DVR_MAX_BUFFER : 30,
        maxBufferLength: isLive ? 30 : 30,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        liveDurationInfinity: isLive,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const levels = data.levels.map((level, i) => ({
          id: i,
          label: `${level.height}p`,
        }));
        setQualities([{ id: -1, label: "Auto" }, ...levels]);

        if (autoPlay) {
          video.play().catch(() => {
            video.muted = true;
            setMuted(true);
            video.play();
          });
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("[HLS] Network error, attempting recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("[HLS] Media error, attempting recovery...");
              hls.recoverMediaError();
              break;
            default:
              console.error("[HLS] Fatal error, destroying...");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      if (autoPlay) video.play();
    }
  }, [hlsUrl, isLive, autoPlay, isMp4, initialMuted]);

  // Cancel replay helper (defined early so togglePlay can use it)
  const replayReturnTimeRef = useRef<number | null>(null);

  // Video events (play, pause, buffering, time updates)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onCanPlay = () => setBuffering(false);

    const onTimeUpdate = () => {
      if (isSeeking) return;
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);

      // Update buffered end
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }

      // Auto-end instant replay when caught up
      if (replayReturnTimeRef.current !== null && video.currentTime >= replayReturnTimeRef.current) {
        video.playbackRate = 1;
        setPlaybackRate(1);
        setInstantReplayActive(false);
        replayReturnTimeRef.current = null;
      }

      // DVR offset calculation for live
      if (isLive && video.duration && isFinite(video.duration)) {
        const offset = video.duration - video.currentTime;
        setDvrOffset(offset);
        setIsAtLiveEdge(offset < 5);
      }
    };

    const onDurationChange = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
    };
  }, [isLive, isSeeking]);

  // Fullscreen listener
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const cancelReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 1;
    setPlaybackRate(1);
    setInstantReplayActive(false);
    replayReturnTimeRef.current = null;
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (instantReplayActive) {
      cancelReplay();
    }
    if (video.paused) video.play();
    else video.pause();
  }, [instantReplayActive, cancelReplay]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const changeVolume = useCallback((val: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setMuted(true);
    } else if (video.muted) {
      video.muted = false;
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

  const selectQuality = useCallback((id: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = id === -1 ? -1 : id;
    setCurrentQuality(id);
    setShowQualityMenu(false);
  }, []);

  // DVR: Seek to a specific time
  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
    setCurrentTime(video.currentTime);
  }, []);

  // DVR: Skip back 15 seconds
  const skipBack = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    seekTo(video.currentTime - 15);
  }, [seekTo]);

  // DVR: Skip back 30 seconds
  const skipBack30 = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    seekTo(video.currentTime - 30);
  }, [seekTo]);

  // DVR: Jump back to live edge
  const jumpToLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isFinite(video.duration)) {
      video.currentTime = video.duration;
      setIsAtLiveEdge(true);
      setDvrOffset(0);
      cancelReplay();
    }
  }, [cancelReplay]);

  // Instant replay: jump back 15s and play in slow-mo, or cancel if active
  const instantReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (instantReplayActive) {
      cancelReplay();
      return;
    }
    replayReturnTimeRef.current = video.currentTime;
    seekTo(video.currentTime - 15);
    video.playbackRate = 0.5;
    setPlaybackRate(0.5);
    setInstantReplayActive(true);
  }, [seekTo, instantReplayActive, cancelReplay]);

  // Change playback speed
  const changeSpeed = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (rate === 1) setInstantReplayActive(false);
  }, []);

  // Seekbar interaction
  const handleSeekbarInteraction = useCallback(
    (clientX: number) => {
      const bar = seekBarRef.current;
      if (!bar || !duration || !isFinite(duration)) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleSeekStart = useCallback(
    (e: React.MouseEvent) => {
      setIsSeeking(true);
      const time = handleSeekbarInteraction(e.clientX);
      if (time !== undefined) setSeekPreview(time);

      const onMove = (ev: MouseEvent) => {
        const t = handleSeekbarInteraction(ev.clientX);
        if (t !== undefined) setSeekPreview(t);
      };

      const onUp = (ev: MouseEvent) => {
        const t = handleSeekbarInteraction(ev.clientX);
        if (t !== undefined) seekTo(t);
        setIsSeeking(false);
        setSeekPreview(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [handleSeekbarInteraction, seekTo]
  );

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  // Progress ratio for seekbar
  const progressRatio = duration && isFinite(duration) ? (seekPreview ?? currentTime) / duration : 0;
  const bufferedRatio = duration && isFinite(duration) ? bufferedEnd / duration : 0;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="h-full w-full"
        poster={poster}
        playsInline
        onClick={togglePlay}
      />

      {/* Buffering Indicator */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-lime/30 border-t-lime" />
        </div>
      )}

      {/* Center Play Button (when paused) */}
      {!playing && !buffering && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
          onClick={togglePlay}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/20 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-lime" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Instant Replay Badge */}
      {instantReplayActive && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-lg bg-lime/20 px-3 py-1.5 text-xs font-bold text-lime backdrop-blur-sm">
          <RotateCcw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "2s" }} />
          POWTÓRKA {playbackRate}x
        </div>
      )}

      {/* Hovered Marker Tooltip */}
      {hoveredMarker && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-lg bg-bg2/90 px-3 py-1.5 text-xs font-medium text-text shadow-lg backdrop-blur-sm">
          {hoveredMarker.label}
        </div>
      )}

      {/* Controls Bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300",
          showControls || !playing ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Seekbar */}
        <div className="mb-2 px-0.5">
          <div
            ref={seekBarRef}
            className="group/seek relative h-1 cursor-pointer rounded-full bg-white/20 transition-all hover:h-1.5"
            onMouseDown={handleSeekStart}
          >
            {/* Buffered */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-white/20"
              style={{ width: `${bufferedRatio * 100}%` }}
            />
            {/* Progress */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-lime"
              style={{ width: `${progressRatio * 100}%` }}
            />
            {/* Seek thumb */}
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime opacity-0 shadow transition-opacity group-hover/seek:opacity-100"
              style={{ left: `${progressRatio * 100}%` }}
            />

            {/* Markers on seekbar */}
            {markers.map((marker, i) => {
              const markerRatio = duration && isFinite(duration) ? marker.time / duration : 0;
              if (markerRatio <= 0 || markerRatio >= 1) return null;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50 transition-transform hover:scale-150"
                  style={{
                    left: `${markerRatio * 100}%`,
                    backgroundColor: marker.color,
                  }}
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

          {/* Time display */}
          <div className="mt-1 flex items-center justify-between text-[10px] text-white/60">
            {isLive ? (
              <>
                <span>
                  {isAtLiveEdge
                    ? ""
                    : `-${formatTime(dvrOffset)}`}
                </span>
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
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="text-white transition-colors hover:text-lime"
          >
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5" fill="currentColor" />
            )}
          </button>

          {/* Skip Back 15s */}
          <button
            onClick={skipBack}
            className="text-white transition-colors hover:text-lime"
            title="Cofnij 15s"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          {/* Skip Back 30s */}
          <button
            onClick={skipBack30}
            className="relative text-white transition-colors hover:text-lime"
            title="Cofnij 30s"
          >
            <SkipBack className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 text-[8px] font-bold">30</span>
          </button>

          {/* Instant Replay */}
          {isLive && (
            <button
              onClick={instantReplay}
              className={cn(
                "flex items-center gap-1 transition-colors",
                instantReplayActive
                  ? "text-lime"
                  : "text-white hover:text-lime"
              )}
              title="Powtórka (slow-mo)"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden text-[10px] sm:inline">Powtórka</span>
            </button>
          )}

          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className={cn(
                "flex items-center gap-1 transition-colors",
                playbackRate !== 1
                  ? "text-lime"
                  : "text-white hover:text-lime"
              )}
              title="Prędkość odtwarzania"
            >
              <Gauge className="h-4 w-4" />
              {playbackRate !== 1 && (
                <span className="text-[10px] font-bold">{playbackRate}x</span>
              )}
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-8 left-0 min-w-[100px] rounded-lg border border-border bg-bg3 py-1 shadow-xl">
                {[0.25, 0.5, 0.75, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                      playbackRate === rate
                        ? "text-lime"
                        : "text-text hover:bg-bg4"
                    )}
                  >
                    {rate}x
                    {rate === 1 && " (normalnie)"}
                    {rate === 0.5 && " (slow-mo)"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="text-white transition-colors hover:text-lime"
            >
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

          {/* Live indicator / Back to live button */}
          {isLive && (
            <button
              onClick={jumpToLive}
              className={cn(
                "ml-1 flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold uppercase transition-all",
                isAtLiveEdge
                  ? "bg-transparent text-live cursor-default"
                  : "bg-live/20 text-live hover:bg-live/30"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isAtLiveEdge
                    ? "bg-live animate-live-pulse"
                    : "bg-white/40"
                )}
              />
              {isAtLiveEdge ? "Na żywo" : "Wróć na żywo"}
            </button>
          )}

          <div className="flex-1" />

          {/* Clip button */}
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

          {/* Quality Selector */}
          {qualities.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="flex items-center gap-1 text-white transition-colors hover:text-lime"
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs">
                  {currentQuality === -1
                    ? "Auto"
                    : qualities.find((q) => q.id === currentQuality)?.label}
                </span>
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-8 right-0 min-w-[120px] rounded-lg border border-border bg-bg3 py-1 shadow-xl">
                  {qualities.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => selectQuality(q.id)}
                      className={cn(
                        "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                        currentQuality === q.id
                          ? "text-lime"
                          : "text-text hover:bg-bg4"
                      )}
                    >
                      {q.label}
                      {q.id === -1 && currentQuality !== -1 && (
                        <span className="ml-1 text-muted">
                          ({qualities.find((qq) => qq.id === currentQuality)?.label})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white transition-colors hover:text-lime"
          >
            {fullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
