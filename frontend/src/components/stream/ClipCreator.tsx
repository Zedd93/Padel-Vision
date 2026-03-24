import { useState, useCallback } from "react";
import {
  X,
  Scissors,
  Copy,
  Check,
  Loader2,
  Clock,
  Share2,
  Code,
  Smartphone,
  Monitor,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface ClipCreatorProps {
  streamId: string;
  streamTitle: string;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
}

const CLIP_DURATIONS = [
  { value: 10, label: "10s" },
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "60s" },
];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ClipCreator({
  streamId,
  streamTitle,
  currentTime,
  isOpen,
  onClose,
}: ClipCreatorProps) {
  const [title, setTitle] = useState(
    `Klip z ${streamTitle}`
  );
  const [clipDuration, setClipDuration] = useState(30);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [clipUrl, setClipUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"horizontal" | "vertical">("horizontal");

  const startTime = Math.max(0, currentTime - clipDuration);
  const endTime = currentTime;

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;
    setCreating(true);

    // Simulate API call — in production: POST /api/clips
    // which triggers FFmpeg trim on the server
    await new Promise((r) => setTimeout(r, 1500));

    const mockClipId = `clip-${Date.now()}`;
    setClipUrl(`${window.location.origin}/clips/${mockClipId}`);
    setCreated(true);
    setCreating(false);
  }, [title]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(clipUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [clipUrl]);

  const handleClose = useCallback(() => {
    setCreated(false);
    setCreating(false);
    setClipUrl("");
    setCopied(false);
    setTitle(`Klip z ${streamTitle}`);
    setClipDuration(30);
    onClose();
  }, [onClose, streamTitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg2 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-lime" />
            <h3 className="text-display text-lg">
              {created ? "Klip utworzony!" : "Utwórz klip"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-muted transition-colors hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {!created ? (
            <div className="space-y-4">
              {/* Preview bar */}
              <div className="rounded-lg bg-bg3 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Podgląd zakresu
                  </span>
                  <span className="font-mono">
                    {formatTime(startTime)} → {formatTime(endTime)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-bg4">
                  <div className="h-full rounded-full bg-lime" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Clip duration selector */}
              <div>
                <label className="mb-2 block text-sm text-muted">
                  Czas trwania klipu
                </label>
                <div className="flex gap-2">
                  {CLIP_DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setClipDuration(d.value)}
                      className={cn(
                        "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                        clipDuration === d.value
                          ? "bg-lime text-black"
                          : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format: horizontal / vertical */}
              <div>
                <label className="mb-2 block text-sm text-muted">
                  Format
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormat("horizontal")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                      format === "horizontal"
                        ? "bg-lime text-black"
                        : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
                    )}
                  >
                    <Monitor className="h-4 w-4" />
                    16:9
                  </button>
                  <button
                    onClick={() => setFormat("vertical")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                      format === "vertical"
                        ? "bg-lime text-black"
                        : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                    9:16 (TikTok/Reels)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-sm text-muted">
                  Tytuł klipu
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none"
                  placeholder="Nadaj tytuł klipowi..."
                />
                <p className="mt-1 text-right text-[10px] text-muted">
                  {title.length}/100
                </p>
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim()}
                className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Tworzenie klipu...
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    Utwórz klip
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success */}
              <div className="flex flex-col items-center py-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lime/10">
                  <Check className="h-6 w-6 text-lime" />
                </div>
                <p className="text-sm font-medium text-text">{title}</p>
                <p className="text-xs text-muted">
                  {clipDuration}s | {formatTime(startTime)} – {formatTime(endTime)}
                </p>
              </div>

              {/* Share options */}
              <div className="space-y-2">
                <button
                  onClick={handleCopyLink}
                  className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-lime" />
                      Skopiowano!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Kopiuj link
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const embedCode = `<iframe src="${clipUrl}/embed" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
                    navigator.clipboard.writeText(embedCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-sm"
                >
                  <Code className="h-4 w-4" />
                  Kopiuj kod embed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
