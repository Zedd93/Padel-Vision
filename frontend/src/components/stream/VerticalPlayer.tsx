import { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  MessageSquare,
  Heart,
  Share2,
  MoreVertical,
  Radio,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Link } from "react-router-dom";

/* ─── Types ────────────────────────────────────── */

interface VerticalPlayerProps {
  streamId: string;
  clubName: string;
  clubSlug: string;
  title: string;
  score?: {
    team1: string;
    team2: string;
    sets: string;
  };
  viewers: number;
  isLive?: boolean;
  onClose?: () => void;
}

/* ─── Component ────────────────────────────────── */

export function VerticalPlayer({
  streamId,
  clubName,
  clubSlug,
  title,
  score,
  viewers,
  isLive = true,
  onClose,
}: VerticalPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [liked, setLiked] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      {/* Video Area (9:16 center-cropped) */}
      <div className="relative flex-1 overflow-hidden">
        {/* Placeholder for vertical video */}
        <div className="flex h-full items-center justify-center bg-gradient-to-b from-bg3 to-black">
          <div className="text-center">
            <Play className="mx-auto mb-2 h-12 w-12 text-muted/50" />
            <p className="text-xs text-muted/50">Vertical Stream</p>
            <p className="font-mono text-[10px] text-muted/30">{streamId}</p>
          </div>
        </div>

        {/* Top Gradient */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Bottom Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Top: Live badge + Score */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {isLive && (
            <span className="badge-live flex items-center gap-1 text-[10px]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              NA ŻYWO
            </span>
          )}
          <span className="rounded-lg bg-black/50 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-md">
            {viewers.toLocaleString("pl-PL")} widzów
          </span>
        </div>

        {/* Score Overlay (top center) */}
        {score && (
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-white">{score.team1}</span>
              <span className="font-mono text-lg font-bold text-lime">{score.sets}</span>
              <span className="font-bold text-white">{score.team2}</span>
            </div>
          </div>
        )}

        {/* Right Side: Action Buttons (TikTok-style) */}
        <div className="absolute bottom-20 right-3 flex flex-col items-center gap-5">
          <button
            onClick={() => setLiked(!liked)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                liked ? "bg-red-500" : "bg-white/10 backdrop-blur-md"
              )}
            >
              <Heart
                className={cn("h-5 w-5", liked ? "fill-white text-white" : "text-white")}
              />
            </div>
            <span className="text-[9px] text-white/70">1.2k</span>
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                showChat ? "bg-lime/20" : "bg-white/10 backdrop-blur-md"
              )}
            >
              <MessageSquare
                className={cn("h-5 w-5", showChat ? "text-lime" : "text-white")}
              />
            </div>
            <span className="text-[9px] text-white/70">Czat</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-[9px] text-white/70">Udostępnij</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <MoreVertical className="h-5 w-5 text-white" />
            </div>
          </button>
        </div>

        {/* Bottom: Club info + title */}
        <div className="absolute bottom-4 left-3 right-16">
          <Link
            to={`/club/${clubSlug}`}
            className="mb-1 flex items-center gap-1.5 text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime/20">
              <Radio className="h-4 w-4 text-lime" />
            </div>
            <span className="text-sm font-bold">{clubName}</span>
          </Link>
          <p className="text-xs text-white/80 line-clamp-2">{title}</p>
        </div>

        {/* Center: Play/Pause (tap area) */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute inset-0 flex items-center justify-center"
        >
          {!isPlaying && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
          )}
        </button>
      </div>

      {/* Bottom Chat (like TikTok Live) */}
      {showChat && (
        <div className="absolute bottom-24 left-3 right-16 max-h-40 overflow-hidden">
          <div className="space-y-1.5">
            {[
              { user: "PadelFan99", msg: "Super zagranie! 🔥" },
              { user: "SmashKing", msg: "Kowalski w formie" },
              { user: "AceHunter", msg: "Ale rally!" },
            ].map((chat, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm"
              >
                <span className="text-[10px] font-bold text-lime">{chat.user}</span>
                <span className="text-[10px] text-white/80">{chat.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-between bg-black px-3 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/70"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
        <button className="text-white/70">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
