import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Trash2,
  Check,
  X,
  Settings,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

type ModLevel = "off" | "lenient" | "standard" | "strict";

interface FlaggedMessage {
  id: string;
  username: string;
  content: string;
  reason: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

interface AutoModProps {
  /** Only visible to moderators/club owners */
  isModerator: boolean;
  streamId: string;
}

/* ─── Config ───────────────────────────────────── */

const MOD_LEVELS: {
  key: ModLevel;
  label: string;
  description: string;
  icon: typeof Shield;
}[] = [
  {
    key: "off",
    label: "Wyłączony",
    description: "Brak automatycznej moderacji",
    icon: EyeOff,
  },
  {
    key: "lenient",
    label: "Leniwy",
    description: "Blokuje spam i obraźliwe treści",
    icon: Shield,
  },
  {
    key: "standard",
    label: "Standardowy",
    description: "Blokuje spam, hate speech, nadmierny caps",
    icon: ShieldCheck,
  },
  {
    key: "strict",
    label: "Ścisły",
    description: "Blokuje wszystko podejrzane, moderator zatwierdza",
    icon: ShieldAlert,
  },
];

/* ─── Mock Data ────────────────────────────────── */

const MOCK_FLAGGED: FlaggedMessage[] = [
  {
    id: "flag-1",
    username: "toxic_user42",
    content: "To jest oszustwo!!!!! SCAM!!!!",
    reason: "Nadmierny caps + spam",
    severity: "medium",
    timestamp: "2 min temu",
  },
  {
    id: "flag-2",
    username: "spammer_bot",
    content: "Kliknij link w moim bio po darmowe piłki!!!",
    reason: "Podejrzany link / spam",
    severity: "high",
    timestamp: "5 min temu",
  },
  {
    id: "flag-3",
    username: "newuser123",
    content: "hahaha ten gracz jest najgorszy na świecie",
    reason: "Potencjalny hate speech",
    severity: "low",
    timestamp: "8 min temu",
  },
];

const SEVERITY_STYLE = {
  low: { color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Niskie" },
  medium: { color: "text-orange", bg: "bg-orange/10", label: "Średnie" },
  high: { color: "text-red-400", bg: "bg-red-400/10", label: "Wysokie" },
};

/* ─── Component ────────────────────────────────── */

export function AutoMod({ isModerator, streamId }: AutoModProps) {
  const [modLevel, setModLevel] = useState<ModLevel>("standard");
  const [flaggedMessages, setFlaggedMessages] =
    useState<FlaggedMessage[]>(MOCK_FLAGGED);
  const [showSettings, setShowSettings] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [rateLimitPerMin, setRateLimitPerMin] = useState(10);
  const [customRegex, setCustomRegex] = useState("");

  if (!isModerator) return null;

  const handleApprove = (id: string) => {
    setFlaggedMessages((prev) => prev.filter((m) => m.id !== id));
    // In production: POST /api/moderation/approve
  };

  const handleReject = (id: string) => {
    setFlaggedMessages((prev) => prev.filter((m) => m.id !== id));
    // In production: POST /api/moderation/reject (deletes message)
  };

  const handleBan = (id: string) => {
    setFlaggedMessages((prev) => prev.filter((m) => m.id !== id));
    // In production: POST /api/moderation/ban (timeout user)
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-lime" />
          <h3 className="text-sm font-semibold text-text">AutoMod</h3>
          {flaggedMessages.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {flaggedMessages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "rounded-lg p-1.5 text-muted transition-colors hover:text-text",
              showSettings && "bg-bg3 text-lime"
            )}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="rounded-lg p-1.5 text-muted transition-colors hover:text-text"
          >
            {showQueue ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Mod level selector */}
          <div>
            <label className="mb-2 block text-xs text-muted">
              Poziom moderacji
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {MOD_LEVELS.map((level) => {
                const LevelIcon = level.icon;
                return (
                  <button
                    key={level.key}
                    onClick={() => setModLevel(level.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                      modLevel === level.key
                        ? "bg-lime/10 border border-lime/20 text-lime"
                        : "bg-bg3 text-muted hover:bg-bg4"
                    )}
                  >
                    <LevelIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium">{level.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-muted">
              {MOD_LEVELS.find((l) => l.key === modLevel)?.description}
            </p>
          </div>

          {/* Rate limit */}
          <div>
            <label className="mb-1 block text-xs text-muted">
              Limit wiadomości / minutę
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={30}
                value={rateLimitPerMin}
                onChange={(e) => setRateLimitPerMin(Number(e.target.value))}
                className="flex-1 accent-lime"
              />
              <span className="w-8 text-right font-mono text-xs text-text">
                {rateLimitPerMin}
              </span>
            </div>
          </div>

          {/* Custom regex */}
          <div>
            <label className="mb-1 block text-xs text-muted">
              Niestandardowe reguły (regex)
            </label>
            <input
              type="text"
              value={customRegex}
              onChange={(e) => setCustomRegex(e.target.value)}
              placeholder="np. spam|link|kup teraz"
              className="w-full rounded-lg border border-border bg-bg3 px-2.5 py-1.5 text-xs text-text placeholder:text-muted/50 focus:border-lime focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Flagged Messages Queue */}
      {showQueue && (
        <div className="border-t border-border">
          {flaggedMessages.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4">
              <ShieldCheck className="h-4 w-4 text-lime" />
              <p className="text-xs text-muted">
                Brak oflagowanych wiadomości
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {flaggedMessages.map((msg) => {
                const severity = SEVERITY_STYLE[msg.severity];
                return (
                  <div key={msg.id} className="px-4 py-3">
                    {/* Header */}
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">
                          {msg.username}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                            severity.bg,
                            severity.color
                          )}
                        >
                          {severity.label}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Message content */}
                    <p className="mb-1 rounded bg-bg3 px-2 py-1.5 text-xs text-text/80">
                      {msg.content}
                    </p>

                    {/* Reason */}
                    <div className="mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-400" />
                      <span className="text-[10px] text-yellow-400">
                        {msg.reason}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApprove(msg.id)}
                        className="flex items-center gap-1 rounded-lg bg-lime/10 px-2.5 py-1 text-[10px] font-medium text-lime transition-colors hover:bg-lime/20"
                      >
                        <Check className="h-3 w-3" />
                        Zatwierdź
                      </button>
                      <button
                        onClick={() => handleReject(msg.id)}
                        className="flex items-center gap-1 rounded-lg bg-bg3 px-2.5 py-1 text-[10px] font-medium text-muted transition-colors hover:bg-bg4 hover:text-text"
                      >
                        <Trash2 className="h-3 w-3" />
                        Usuń
                      </button>
                      <button
                        onClick={() => handleBan(msg.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <X className="h-3 w-3" />
                        Ban
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
