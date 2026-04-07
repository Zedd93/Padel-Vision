import { useState, useRef, useCallback, useEffect } from "react";
import {
  Pencil,
  Circle,
  ArrowUpRight,
  Type,
  Undo2,
  Trash2,
  Download,
  Bookmark,
  BookmarkPlus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

type DrawingTool = "arrow" | "circle" | "freehand" | "text";

interface DrawingElement {
  id: string;
  tool: DrawingTool;
  points: { x: number; y: number }[];
  color: string;
  text?: string;
}

interface CoachingBookmark {
  id: string;
  time: number;
  label: string;
  thumbnail?: string;
}

interface CoachingToolsProps {
  vodId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  onPlaybackRate: (rate: number) => void;
}

/* ─── Helpers ─────────────────────────────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─── Drawing Colors ─────────────────────────── */

const COLORS = [
  { value: "#C8FF00", label: "Lime" },
  { value: "#FF6B00", label: "Orange" },
  { value: "#FF3B3B", label: "Red" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#FFFFFF", label: "White" },
];

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.5, 2];

/* ─── Mock Bookmarks ─────────────────────────── */

const MOCK_BOOKMARKS: CoachingBookmark[] = [
  { id: "b1", time: 124, label: "As serwisowy — dobra pozycja" },
  { id: "b2", time: 312, label: "Defensive rally — ruch nóg" },
  { id: "b3", time: 721, label: "Złoty punkt — taktyka" },
];

/* ─── Component ────────────────────────────────── */

export function CoachingTools({
  vodId,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onPlayPause,
  onPlaybackRate,
}: CoachingToolsProps) {
  const [enabled, setEnabled] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>("arrow");
  const [activeColor, setActiveColor] = useState(COLORS[0].value);
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [bookmarks, setBookmarks] = useState<CoachingBookmark[]>(MOCK_BOOKMARKS);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showBookmarks] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentDrawingRef = useRef<DrawingElement | null>(null);

  // Redraw canvas when drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (el.tool) {
        case "freehand":{
          if (el.points.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          el.points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
          break;
        }

        case "arrow": {
          if (el.points.length < 2) break;
          const start = el.points[0];
          const end = el.points[el.points.length - 1];
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          // Arrowhead
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLen = 12;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "circle":{
          if (el.points.length < 2) break;
          const ccx = (el.points[0].x + el.points[el.points.length - 1].x) / 2;
          const ccy = (el.points[0].y + el.points[el.points.length - 1].y) / 2;
          const rx = Math.abs(el.points[el.points.length - 1].x - el.points[0].x) / 2;
          const ry = Math.abs(el.points[el.points.length - 1].y - el.points[0].y) / 2;
          ctx.beginPath();
          ctx.ellipse(ccx, ccy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case "text":{
          if (el.text && el.points.length > 0) {
            ctx.font = "bold 16px 'DM Sans', sans-serif";
            ctx.fillText(el.text, el.points[0].x, el.points[0].y);
          }
          break;
        }
      }
    });
  }, [drawings]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (activeTool === "text") {
        const text = prompt("Wpisz tekst:");
        if (text) {
          setDrawings((prev) => [
            ...prev,
            {
              id: `d-${Date.now()}`,
              tool: "text",
              points: [{ x, y }],
              color: activeColor,
              text,
            },
          ]);
        }
        return;
      }

      setIsDrawing(true);
      currentDrawingRef.current = {
        id: `d-${Date.now()}`,
        tool: activeTool,
        points: [{ x, y }],
        color: activeColor,
      };
    },
    [enabled, activeTool, activeColor]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentDrawingRef.current) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      currentDrawingRef.current.points.push({ x, y });

      // Live preview
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Redraw existing
      [...drawings, currentDrawingRef.current].forEach((el) => {
        ctx.strokeStyle = el.color;
        ctx.fillStyle = el.color;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        switch (el.tool) {
          case "freehand":{
            if (el.points.length < 2) break;
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            el.points.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.stroke();
            break;
          }
          case "arrow":{
            if (el.points.length < 2) break;
            const s = el.points[0];
            const en = el.points[el.points.length - 1];
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(en.x, en.y);
            ctx.stroke();
            const a = Math.atan2(en.y - s.y, en.x - s.x);
            ctx.beginPath();
            ctx.moveTo(en.x, en.y);
            ctx.lineTo(en.x - 12 * Math.cos(a - Math.PI / 6), en.y - 12 * Math.sin(a - Math.PI / 6));
            ctx.lineTo(en.x - 12 * Math.cos(a + Math.PI / 6), en.y - 12 * Math.sin(a + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
            break;
          }
          case "circle":{
            if (el.points.length < 2) break;
            const cccx = (el.points[0].x + el.points[el.points.length - 1].x) / 2;
            const cccy = (el.points[0].y + el.points[el.points.length - 1].y) / 2;
            const rrx = Math.abs(el.points[el.points.length - 1].x - el.points[0].x) / 2;
            const rry = Math.abs(el.points[el.points.length - 1].y - el.points[0].y) / 2;
            ctx.beginPath();
            ctx.ellipse(cccx, cccy, Math.max(1, rrx), Math.max(1, rry), 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
          case "text":{
            if (el.text && el.points.length > 0) {
              ctx.font = "bold 16px 'DM Sans', sans-serif";
              ctx.fillText(el.text, el.points[0].x, el.points[0].y);
            }
            break;
          }
        }
      });
    },
    [isDrawing, drawings]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDrawingRef.current) return;
    setIsDrawing(false);
    setDrawings((prev) => [...prev, currentDrawingRef.current!]);
    currentDrawingRef.current = null;
  }, [isDrawing]);

  const handleUndo = () => {
    setDrawings((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDrawings([]);
  };

  const handleAddBookmark = () => {
    const label = prompt("Nazwa zakładki:");
    if (!label) return;
    setBookmarks((prev) => [
      ...prev,
      { id: `b-${Date.now()}`, time: currentTime, label },
    ]);
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[nextIndex];
    setPlaybackRate(newRate);
    onPlaybackRate(newRate);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `coaching-${vodId}-${Math.floor(currentTime)}s.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const tools: { key: DrawingTool; icon: typeof Pencil; label: string }[] = [
    { key: "arrow", icon: ArrowUpRight, label: "Strzałka" },
    { key: "circle", icon: Circle, label: "Kółko" },
    { key: "freehand", icon: Pencil, label: "Odręcznie" },
    { key: "text", icon: Type, label: "Tekst" },
  ];

  return (
    <div className="space-y-4">
      {/* Toggle Coaching Mode */}
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
          enabled
            ? "bg-lime/10 border border-lime/20 text-lime"
            : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
        )}
      >
        <Pencil className="h-4 w-4" />
        {enabled ? "Tryb coachingowy aktywny" : "Włącz tryb coachingowy"}
      </button>

      {enabled && (
        <>
          {/* Drawing Canvas Overlay Area */}
          <div className="glass-card overflow-hidden">
            <div className="relative">
              {/* Placeholder for video frame */}
              <div className="flex h-64 items-center justify-center bg-bg3 text-sm text-muted sm:h-80">
                Klatka wideo — {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              {/* Canvas overlay */}
              <canvas
                ref={canvasRef}
                width={800}
                height={320}
                className="absolute inset-0 h-full w-full cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            {/* Drawing Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2">
              {/* Tools */}
              <div className="flex items-center gap-1 border-r border-border pr-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.key}
                      onClick={() => setActiveTool(tool.key)}
                      title={tool.label}
                      className={cn(
                        "rounded-lg p-2 text-xs transition-colors",
                        activeTool === tool.key
                          ? "bg-lime/10 text-lime"
                          : "text-muted hover:bg-bg3 hover:text-text"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>

              {/* Colors */}
              <div className="flex items-center gap-1 border-r border-border pr-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setActiveColor(color.value)}
                    title={color.label}
                    className={cn(
                      "h-5 w-5 rounded-full border-2 transition-all",
                      activeColor === color.value
                        ? "border-white scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={drawings.length === 0}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-bg3 hover:text-text disabled:opacity-30"
                  title="Cofnij"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClear}
                  disabled={drawings.length === 0}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-bg3 hover:text-red-400 disabled:opacity-30"
                  title="Wyczyść wszystko"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleExport}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-bg3 hover:text-lime"
                  title="Eksportuj zrzut (PNG)"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="glass-card px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Frame step back */}
                <button
                  onClick={() => onSeek(Math.max(0, currentTime - 1 / 30))}
                  className="rounded-lg p-1.5 text-muted hover:bg-bg3 hover:text-text"
                  title="Klatka wstecz"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Skip back 5s */}
                <button
                  onClick={() => onSeek(Math.max(0, currentTime - 5))}
                  className="rounded-lg p-1.5 text-muted hover:bg-bg3 hover:text-text"
                  title="-5s"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={onPlayPause}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-black"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </button>

                {/* Skip forward 5s */}
                <button
                  onClick={() => onSeek(Math.min(duration, currentTime + 5))}
                  className="rounded-lg p-1.5 text-muted hover:bg-bg3 hover:text-text"
                  title="+5s"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                {/* Frame step forward */}
                <button
                  onClick={() => onSeek(Math.min(duration, currentTime + 1 / 30))}
                  className="rounded-lg p-1.5 text-muted hover:bg-bg3 hover:text-text"
                  title="Klatka naprzód"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Playback speed */}
              <button
                onClick={cyclePlaybackRate}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-colors",
                  playbackRate !== 1
                    ? "bg-lime/10 text-lime"
                    : "bg-bg3 text-muted hover:text-text"
                )}
              >
                {playbackRate}x
              </button>

              {/* Time display */}
              <span className="font-mono text-xs text-muted">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Speed presets */}
            <div className="mt-2 flex gap-1">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    onPlaybackRate(rate);
                  }}
                  className={cn(
                    "flex-1 rounded-md py-1 text-[10px] font-mono font-bold transition-colors",
                    playbackRate === rate
                      ? "bg-lime/10 text-lime"
                      : "bg-bg3 text-muted hover:bg-bg4"
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Bookmarks */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
                <Bookmark className="h-4 w-4 text-lime" />
                Zakładki ({bookmarks.length})
              </h3>
              <button
                onClick={handleAddBookmark}
                className="flex items-center gap-1 rounded-lg bg-lime/10 px-2.5 py-1 text-[10px] font-medium text-lime transition-colors hover:bg-lime/20"
              >
                <BookmarkPlus className="h-3 w-3" />
                Dodaj
              </button>
            </div>

            {bookmarks.length === 0 ? (
              <div className="px-4 py-4 text-center text-xs text-muted">
                Brak zakładek — kliknij &quot;Dodaj&quot; aby oznaczyć moment do analizy.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {bookmarks
                  .sort((a, b) => a.time - b.time)
                  .map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg3"
                    >
                      <button
                        onClick={() => onSeek(bookmark.time)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-bg4 px-1.5 py-0.5 font-mono text-[10px] text-lime">
                            {formatTime(bookmark.time)}
                          </span>
                          <span className="text-xs text-text">
                            {bookmark.label}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleRemoveBookmark(bookmark.id)}
                        className="rounded p-1 text-muted hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
