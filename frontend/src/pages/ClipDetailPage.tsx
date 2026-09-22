import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Play,
  ThumbsUp,
  Eye,
  Copy,
  Check,
  Code,
  Share2,
  ArrowLeft,
  Scissors,
  Clock,
  Monitor,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Mock Clip Data ───────────────────────────── */

const MOCK_CLIP = {
  id: "clip-1",
  title: "Niewiarygodny smash w finale!",
  streamId: "stream-1",
  streamTitle: "SILESIA OPEN 2025 — FINAŁ OPEN A",
  clubName: "Racket Club Katowice",
  clubSlug: "racket-club-katowice",
  creatorName: "PadelFan_PL",
  duration: 28,
  views: 12400,
  votes: 342,
  format: "horizontal" as "horizontal" | "vertical",
  createdAt: "2026-03-13T14:30:00Z",
  // Klip to zakres czasu w nagraniu transmisji na YouTube — nic nie renderujemy
  youtubeVideoId: "dQw4w9WgXcQ",
  startSeconds: 1245,
};

/* ─── Helpers ──────────────────────────────────── */

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ─── Component ────────────────────────────────── */

export default function ClipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clipId = id || "clip-1";

  // In production: fetch from API
  const clip = { ...MOCK_CLIP, id: clipId };

  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(clip.votes);
  const [copied, setCopied] = useState<string | null>(null);

  const clipUrl = `${window.location.origin}/clips/${clip.id}`;

  const embedCode = `<iframe src="${clipUrl}/embed" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  const handleVote = () => {
    if (voted) {
      setVoted(false);
      setVoteCount((v) => v - 1);
    } else {
      setVoted(true);
      setVoteCount((v) => v + 1);
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/clips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId: clip.id, action: "vote" }),
    }).catch(() => {});
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Back */}
        <Link
          to="/clips"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do klipów
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Player */}
          <div className="lg:col-span-2">
            <div
              className={cn(
                "relative overflow-hidden rounded-xl bg-black",
                clip.format === "vertical"
                  ? "mx-auto aspect-[9/16] max-w-xs"
                  : "aspect-video"
              )}
            >
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${clip.youtubeVideoId}?start=${clip.startSeconds}&end=${clip.startSeconds + clip.duration}&autoplay=1&rel=0&playsinline=1`}
                title={clip.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            {/* Title & actions */}
            <div className="mt-4">
              <h1 className="text-display text-xl lg:text-2xl">{clip.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {formatViews(clip.views)} wyświetleń
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(clip.duration)}
                </span>
                <span className="flex items-center gap-1">
                  {clip.format === "vertical" ? (
                    <Smartphone className="h-3.5 w-3.5" />
                  ) : (
                    <Monitor className="h-3.5 w-3.5" />
                  )}
                  {clip.format === "vertical" ? "9:16" : "16:9"}
                </span>
                <span>{formatDate(clip.createdAt)}</span>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleVote}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    voted
                      ? "bg-lime/20 text-lime border border-lime/30"
                      : "bg-bg3 text-muted hover:text-text border border-border"
                  )}
                >
                  <ThumbsUp
                    className={cn("h-4 w-4", voted && "fill-lime")}
                  />
                  {voteCount}
                </button>

                <button
                  onClick={() => handleCopy(clipUrl, "link")}
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg3 px-4 py-2 text-sm text-muted transition-colors hover:text-text"
                >
                  {copied === "link" ? (
                    <Check className="h-4 w-4 text-lime" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "link" ? "Skopiowano!" : "Kopiuj link"}
                </button>

                <button
                  onClick={() => handleCopy(embedCode, "embed")}
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg3 px-4 py-2 text-sm text-muted transition-colors hover:text-text"
                >
                  {copied === "embed" ? (
                    <Check className="h-4 w-4 text-lime" />
                  ) : (
                    <Code className="h-4 w-4" />
                  )}
                  {copied === "embed" ? "Skopiowano!" : "Embed"}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Clip info card */}
            <div className="glass-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-text">
                Informacje o klipie
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Klub</span>
                  <Link
                    to={`/club/${clip.clubSlug}`}
                    className="text-lime hover:underline"
                  >
                    {clip.clubName}
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Stream</span>
                  <Link
                    to={`/stream/${clip.streamId}`}
                    className="flex items-center gap-1 text-text hover:text-lime"
                  >
                    Otwórz
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Autor klipu</span>
                  <span className="text-text">{clip.creatorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Czas trwania</span>
                  <span className="font-mono text-text">
                    {formatDuration(clip.duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* From this stream */}
            <div className="glass-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-text">
                Ze streamu
              </h3>
              <Link
                to={`/stream/${clip.streamId}`}
                className="block rounded-lg border border-border bg-bg3 p-3 transition-colors hover:border-lime"
              >
                <p className="truncate text-sm font-medium text-text">
                  {clip.streamTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted">{clip.clubName}</p>
              </Link>
            </div>

            {/* Share section */}
            <div className="glass-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <Share2 className="h-4 w-4 text-lime" />
                Udostępnij
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(clip.title)}&url=${encodeURIComponent(clipUrl)}`;
                    window.open(twitterUrl, "_blank");
                  }}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  Udostępnij na X/Twitter
                </button>
                <button
                  onClick={() => {
                    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(clipUrl)}`;
                    window.open(fbUrl, "_blank");
                  }}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  Udostępnij na Facebooku
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
