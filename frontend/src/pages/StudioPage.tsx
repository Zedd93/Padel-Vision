import { useState } from "react";
import {
  Radio,
  X,
  Users,
  TrendingUp,
  Coins,
  MonitorPlay,
  Youtube,
  Facebook,
  Instagram,
  Undo2,
  RotateCcw,
  Trophy,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useSearchParams } from "react-router-dom";
import { YouTubeConnectionCard } from "@/components/studio/YouTubeConnectionCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clubStreamApi } from "@/api/clubStream";

// Mock club data
const MOCK_CLUB = {
  name: "Racket Club Katowice",
};

// ── Padel Score Types & Logic ────────────────────────────────

type GamePoint = "0" | "15" | "30" | "40" | "ADV";

interface PadelMatchState {
  team1: string;
  team2: string;
  points: { team1: GamePoint; team2: GamePoint };
  games: { team1: number; team2: number };
  sets: Array<{ team1: number; team2: number }>;
  currentSet: number;
  isTiebreak: boolean;
  tiebreakPoints: { team1: number; team2: number };
  serving: 1 | 2;
}

const INITIAL_MATCH: PadelMatchState = {
  team1: "Kowalski / Nowak",
  team2: "Wiśniewski / Zając",
  points: { team1: "0", team2: "0" },
  games: { team1: 0, team2: 0 },
  sets: [],
  currentSet: 1,
  isTiebreak: false,
  tiebreakPoints: { team1: 0, team2: 0 },
  serving: 1,
};

const POINT_SEQUENCE: GamePoint[] = ["0", "15", "30", "40"];

function advancePoint(current: GamePoint): GamePoint {
  const idx = POINT_SEQUENCE.indexOf(current);
  return idx < 3 ? POINT_SEQUENCE[idx + 1] : current;
}

function getGamePointLabel(points: { team1: GamePoint; team2: GamePoint }): {
  team1: string;
  team2: string;
  isDeuce: boolean;
} {
  if (points.team1 === "40" && points.team2 === "40") {
    return { team1: "40", team2: "40", isDeuce: true };
  }
  return {
    team1: points.team1 === "ADV" ? "ADV" : points.team1,
    team2: points.team2 === "ADV" ? "ADV" : points.team2,
    isDeuce: false,
  };
}

function computePointWon(
  state: PadelMatchState,
  team: 1 | 2
): PadelMatchState {
  if (state.isTiebreak) {
    const newTb = { ...state.tiebreakPoints };
    if (team === 1) newTb.team1++;
    else newTb.team2++;
    const p1 = newTb.team1;
    const p2 = newTb.team2;
    if ((p1 >= 7 || p2 >= 7) && Math.abs(p1 - p2) >= 2) {
      const finalGames = {
        team1: team === 1 ? 7 : 6,
        team2: team === 2 ? 7 : 6,
      };
      const newSets = [...state.sets, finalGames];
      return { ...state, sets: newSets, games: { team1: 0, team2: 0 }, points: { team1: "0", team2: "0" }, currentSet: state.currentSet + 1, isTiebreak: false, tiebreakPoints: { team1: 0, team2: 0 } };
    }
    return { ...state, tiebreakPoints: newTb };
  }

  const w = team === 1 ? "team1" : "team2";
  const l = team === 1 ? "team2" : "team1";
  const wp = state.points[w];
  const lp = state.points[l];

  if (wp === "40" && lp === "40") {
    return { ...state, points: { ...state.points, [w]: "ADV" as GamePoint } };
  }
  if (wp === "ADV") return gameWon(state, team);
  if (lp === "ADV") return { ...state, points: { team1: "40", team2: "40" } };
  if (wp === "40") return gameWon(state, team);
  return { ...state, points: { ...state.points, [w]: advancePoint(wp) } };
}

function gameWon(state: PadelMatchState, team: 1 | 2): PadelMatchState {
  const newGames = { ...state.games };
  if (team === 1) newGames.team1++;
  else newGames.team2++;
  const g1 = newGames.team1;
  const g2 = newGames.team2;

  if ((g1 >= 6 || g2 >= 6) && Math.abs(g1 - g2) >= 2) {
    const newSets = [...state.sets, { team1: g1, team2: g2 }];
    return { ...state, sets: newSets, games: { team1: 0, team2: 0 }, points: { team1: "0", team2: "0" }, currentSet: state.currentSet + 1, isTiebreak: false, tiebreakPoints: { team1: 0, team2: 0 } };
  }
  if (g1 === 6 && g2 === 6) {
    return { ...state, games: newGames, points: { team1: "0", team2: "0" }, isTiebreak: true, tiebreakPoints: { team1: 0, team2: 0 } };
  }
  return { ...state, games: newGames, points: { team1: "0", team2: "0" } };
}

// ── Component ────────────────────────────────────────────────

export default function StudioPage() {
  const [isLive, setIsLive] = useState(false);
  const [title, setTitle] = useState("Silesia Open 2025 — Finał OPEN A");
  const [description, setDescription] = useState("");

  const apiAction = async (action: string, value?: unknown) => {
    try {
      await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: "demo-club-1", action, value }),
      });
    } catch {
      // Optimistic UI — API failure is silent
    }
  };

  const [platforms, setPlatforms] = useState<{
    [key: string]: { connected: boolean; accountName: string; enabled: boolean };
  }>({
    youtube: { connected: false, accountName: "", enabled: false },
    facebook: { connected: false, accountName: "", enabled: false },
    instagram: { connected: false, accountName: "", enabled: false },
  });

  const connectPlatform = (platform: string) => {
    const mockNames: Record<string, string> = {
      youtube: "Racket Club Katowice",
      facebook: "Racket Club Katowice",
      instagram: "@racketclub_katowice",
    };
    setPlatforms((prev) => ({
      ...prev,
      [platform]: { connected: true, accountName: mockNames[platform] || "", enabled: false },
    }));
  };

  const disconnectPlatform = (platform: string) => {
    setPlatforms((prev) => ({
      ...prev,
      [platform]: { connected: false, accountName: "", enabled: false },
    }));
  };

  const togglePlatformStream = (platform: string) => {
    const newEnabled = !platforms[platform].enabled;
    setPlatforms((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], enabled: newEnabled },
    }));
    apiAction("togglePlatform", { platform, enabled: newEnabled });
  };

  const connectedCount = Object.values(platforms).filter((p) => p.connected && p.enabled).length;

  const [match, setMatch] = useState<PadelMatchState>(INITIAL_MATCH);
  const [history, setHistory] = useState<PadelMatchState[]>([]);

  const awardPoint = (team: 1 | 2) => {
    setHistory((h) => [...h, match]);
    const newState = computePointWon(match, team);
    setMatch(newState);
    apiAction("updateScore", { team, match: newState });
  };

  const undoLastAction = () => {
    if (history.length === 0) return;
    setMatch(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };

  const resetMatch = () => {
    setHistory([]);
    setMatch((prev) => ({ ...INITIAL_MATCH, team1: prev.team1, team2: prev.team2 }));
  };

  const toggleServing = () => {
    setMatch((prev) => ({ ...prev, serving: prev.serving === 1 ? 2 : 1 }));
  };

  const team1SetsWon = match.sets.filter((s) => s.team1 > s.team2).length;
  const team2SetsWon = match.sets.filter((s) => s.team2 > s.team1).length;
  const isMatchFinished = team1SetsWon === 2 || team2SetsWon === 2;
  const pointsDisplay = getGamePointLabel(match.points);

  // Transmisja tworzona po stronie YouTube; adres RTMP pojawia sie w karcie
  // polaczenia dopiero po pierwszym starcie, bo wtedy powstaje staly strumien.
  const queryClient = useQueryClient();
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const startMutation = useMutation({
    mutationFn: () => clubStreamApi.start({ title, description: description || undefined }),
    onSuccess: (stream) => {
      setActiveStreamId(stream.id);
      setStreamError(null);
      setIsLive(true);
      // ingest address/key sa czescia statusu polaczenia
      queryClient.invalidateQueries({ queryKey: ["youtube", "status"] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      setStreamError(
        error.response?.data?.message ?? "Nie udalo sie utworzyc transmisji"
      );
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => clubStreamApi.stop(activeStreamId!),
    onSuccess: () => {
      setActiveStreamId(null);
      setStreamError(null);
      setIsLive(false);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      setStreamError(
        error.response?.data?.message ?? "Nie udalo sie zakonczyc transmisji"
      );
    },
  });

  // Backend po callbacku OAuth przekierowuje tutaj z wynikiem w query
  const [searchParams, setSearchParams] = useSearchParams();
  const youtubeResult = searchParams.get("youtube");
  const youtubeDetail = searchParams.get("detail");

  const dismissYoutubeBanner = () => {
    searchParams.delete("youtube");
    searchParams.delete("detail");
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="p-6">
      {youtubeResult && (
        <div
          className={cn(
            "mb-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm",
            youtubeResult === "connected"
              ? "bg-lime/10 text-lime"
              : "bg-orange/10 text-orange"
          )}
        >
          {youtubeResult === "connected" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              {youtubeResult === "connected"
                ? `Kanal ${youtubeDetail ?? "YouTube"} zostal polaczony`
                : "Nie udalo sie polaczyc kanalu YouTube"}
            </p>
            {youtubeResult !== "connected" && youtubeDetail && (
              <p className="mt-0.5 text-xs opacity-80">{youtubeDetail}</p>
            )}
          </div>
          <button onClick={dismissYoutubeBanner} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display text-2xl">Studio</h1>
        <div className="flex items-center gap-3">
          {isLive ? (
            <button
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending || !activeStreamId}
              className="flex items-center gap-2 rounded-lg bg-live px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              <Radio className="h-4 w-4 animate-live-pulse" />
              {stopMutation.isPending ? "Kończę…" : "Zakończ transmisję"}
            </button>
          ) : (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending || !title.trim()}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Radio className="h-4 w-4" />
              {startMutation.isPending ? "Tworzę transmisję…" : "Rozpocznij stream"}
            </button>
          )}
        </div>
      </div>

      {streamError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-orange/10 px-4 py-3 text-sm text-orange">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="flex-1">{streamError}</p>
          <button onClick={() => setStreamError(null)} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Stream Preview + Info */}
        <div className="space-y-4 lg:col-span-2">
          {/* Stream Preview */}
          <div className="glass-card overflow-hidden">
            <div className="relative aspect-video bg-bg3">
              {isLive ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <MonitorPlay className="mx-auto mb-2 h-12 w-12 text-lime" />
                    <p className="text-sm text-text">Podgląd transmisji</p>
                    <p className="text-xs text-muted">Stream jest aktywny</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Radio className="mx-auto mb-2 h-12 w-12 text-muted" />
                    <p className="text-sm text-muted">Brak aktywnej transmisji</p>
                    <p className="text-xs text-muted">Połącz się przez OBS lub kamerę IP</p>
                  </div>
                </div>
              )}
              {isLive && (
                <div className="absolute left-3 top-3">
                  <span className="badge-live">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-live-pulse" />
                    NA ŻYWO
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stream Settings */}
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">Informacje o transmisji</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Tytuł</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Opis (opcjonalny)</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dodaj opis transmisji..." className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none" />
              </div>
            </div>
          </div>

          <YouTubeConnectionCard />
        </div>

        {/* Right: Stats + Score + Multistream */}
        <div className="space-y-4">
          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-lime" />
              <p className="text-display text-xl">{isLive ? "1,247" : "0"}</p>
              <p className="text-[10px] text-muted">Widzowie</p>
            </div>
            <div className="glass-card p-3 text-center">
              <TrendingUp className="mx-auto mb-1 h-5 w-5 text-orange" />
              <p className="text-display text-xl">{isLive ? "2,891" : "0"}</p>
              <p className="text-[10px] text-muted">Szczytowa</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Coins className="mx-auto mb-1 h-5 w-5 text-yellow-400" />
              <p className="text-display text-xl">{isLive ? "340" : "0"}</p>
              <p className="text-[10px] text-muted">Piłki</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Radio className="mx-auto mb-1 h-5 w-5 text-live" />
              <p className="text-display text-xl">{isLive ? "01:24" : "00:00"}</p>
              <p className="text-[10px] text-muted">Czas trwania</p>
            </div>
          </div>

          {/* ── Wynik na żywo (Padel Score Panel) ── */}
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">Wynik na żywo</h3>
            <div className="space-y-3">
              {/* Team Names */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">Drużyna 1</label>
                  <input type="text" value={match.team1} onChange={(e) => setMatch((s) => ({ ...s, team1: e.target.value }))} className="w-full rounded-lg border border-border bg-bg3 px-2.5 py-1.5 text-xs text-text focus:border-lime focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Drużyna 2</label>
                  <input type="text" value={match.team2} onChange={(e) => setMatch((s) => ({ ...s, team2: e.target.value }))} className="w-full rounded-lg border border-border bg-bg3 px-2.5 py-1.5 text-xs text-text focus:border-lime focus:outline-none" />
                </div>
              </div>

              {/* Set History */}
              {match.sets.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {match.sets.map((set, i) => (
                    <div key={i} className="rounded-md bg-bg3 px-2.5 py-1 text-center">
                      <p className="text-[9px] text-muted">Set {i + 1}</p>
                      <p className="font-mono text-xs font-bold text-text">
                        <span className={cn(set.team1 > set.team2 && "text-lime")}>{set.team1}</span>
                        <span className="text-muted">-</span>
                        <span className={cn(set.team2 > set.team1 && "text-lime")}>{set.team2}</span>
                      </p>
                    </div>
                  ))}
                  <div className="rounded-md bg-lime/10 px-2.5 py-1 text-center">
                    <p className="text-[9px] text-lime">Sety</p>
                    <p className="font-mono text-xs font-bold text-lime">{team1SetsWon}-{team2SetsWon}</p>
                  </div>
                </div>
              )}

              {/* Match Finished Banner */}
              {isMatchFinished && (
                <div className="flex items-center gap-2 rounded-lg bg-lime/10 px-3 py-2">
                  <Trophy className="h-4 w-4 text-lime" />
                  <span className="text-xs font-bold text-lime">
                    Mecz zakończony — {team1SetsWon > team2SetsWon ? match.team1 : match.team2} wygrywa!
                  </span>
                </div>
              )}

              {/* Current Set Header */}
              {!isMatchFinished && (
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-orange/20 px-2.5 py-0.5 text-[10px] font-bold text-orange">
                    {match.isTiebreak ? `TIE-BREAK (Set ${match.currentSet})` : `Set ${match.currentSet}`}
                  </span>
                  <button onClick={toggleServing} className="flex items-center gap-1 rounded-md bg-bg3 px-2 py-1 text-[10px] text-muted transition-colors hover:text-text" title="Zmień serwującego">
                    <RotateCcw className="h-3 w-3" />
                    Serwis
                  </button>
                </div>
              )}

              {/* Scoreboard */}
              {!isMatchFinished && (
                <div className="overflow-hidden rounded-lg border border-border bg-bg3">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                    <div className={cn("px-3 py-2.5 text-center", match.serving === 1 && "bg-lime/5")}>
                      <p className="mb-0.5 truncate text-[10px] text-muted">
                        {match.team1.split(" / ")[0]}
                        {match.serving === 1 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-lime" />}
                      </p>
                      <p className="text-display text-2xl text-text">{match.games.team1}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center px-2">
                      <span className="text-xs text-muted">GEMY</span>
                      <span className="text-display text-lg text-muted">:</span>
                    </div>
                    <div className={cn("px-3 py-2.5 text-center", match.serving === 2 && "bg-lime/5")}>
                      <p className="mb-0.5 truncate text-[10px] text-muted">
                        {match.team2.split(" / ")[0]}
                        {match.serving === 2 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-lime" />}
                      </p>
                      <p className="text-display text-2xl text-text">{match.games.team2}</p>
                    </div>
                  </div>
                  <div className="border-t border-border" />
                  <div className="px-3 py-2.5">
                    {match.isTiebreak ? (
                      <div className="text-center">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-orange">Tie-Break</p>
                        <div className="flex items-center justify-center gap-4">
                          <span className="font-mono text-display text-2xl text-text">{match.tiebreakPoints.team1}</span>
                          <span className="text-sm text-muted">:</span>
                          <span className="font-mono text-display text-2xl text-text">{match.tiebreakPoints.team2}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">
                          {pointsDisplay.isDeuce ? "Deuce" : "Punkty w gemie"}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <span className={cn("font-mono text-display text-2xl", match.points.team1 === "ADV" ? "text-lime" : "text-text")}>{pointsDisplay.team1}</span>
                          <span className="text-sm text-muted">:</span>
                          <span className={cn("font-mono text-display text-2xl", match.points.team2 === "ADV" ? "text-lime" : "text-text")}>{pointsDisplay.team2}</span>
                        </div>
                        {pointsDisplay.isDeuce && <p className="mt-0.5 text-[10px] text-orange">40 : 40</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Point Award Buttons */}
              {!isMatchFinished && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => awardPoint(1)} className="rounded-lg bg-lime/20 px-3 py-3 text-center text-sm font-bold text-lime transition-colors hover:bg-lime/30 active:scale-[0.98]">
                    Punkt ←
                    <span className="mt-0.5 block truncate text-[10px] font-normal opacity-70">{match.team1.split(" / ")[0]}</span>
                  </button>
                  <button onClick={() => awardPoint(2)} className="rounded-lg bg-lime/20 px-3 py-3 text-center text-sm font-bold text-lime transition-colors hover:bg-lime/30 active:scale-[0.98]">
                    Punkt →
                    <span className="mt-0.5 block truncate text-[10px] font-normal opacity-70">{match.team2.split(" / ")[0]}</span>
                  </button>
                </div>
              )}

              {/* Action Row: Undo + Reset */}
              <div className="flex gap-2">
                <button onClick={undoLastAction} disabled={history.length === 0} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs transition-colors", history.length > 0 ? "bg-bg3 text-muted hover:text-text" : "cursor-not-allowed bg-bg3/50 text-muted/30")}>
                  <Undo2 className="h-3.5 w-3.5" />
                  Cofnij ({history.length})
                </button>
                <button onClick={resetMatch} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bg3 py-2 text-xs text-muted transition-colors hover:text-red-400">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset meczu
                </button>
              </div>

              <button className="btn-primary w-full py-2.5 text-sm">Aktualizuj wynik na streamie</button>
            </div>
          </div>

          {/* Multistreaming */}
          <div className="glass-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Multistreaming</h3>
              {connectedCount > 0 && (
                <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-lime">
                  {connectedCount} aktywn{connectedCount === 1 ? "y" : "e"}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {/* YouTube */}
              {(() => {
                const p = platforms.youtube;
                return (
                  <div className="overflow-hidden rounded-lg border border-border bg-bg3">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                          <Youtube className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text">YouTube Live</p>
                          {p.connected ? (
                            <p className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="h-2.5 w-2.5" />{p.accountName}</p>
                          ) : (
                            <p className="text-[10px] text-muted">Nie połączono</p>
                          )}
                        </div>
                      </div>
                      {p.connected && (
                        <button onClick={() => togglePlatformStream("youtube")} className={cn("relative h-6 w-11 flex-shrink-0 rounded-full transition-colors", p.enabled ? "bg-lime" : "bg-bg4")}>
                          <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform", p.enabled && "translate-x-5")} />
                        </button>
                      )}
                    </div>
                    {p.connected ? (
                      <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
                        <span className="text-[10px] text-muted">{p.enabled ? "Transmisja aktywna" : "Transmisja wyłączona"}</span>
                        <button onClick={() => disconnectPlatform("youtube")} className="flex items-center gap-1 text-[10px] text-red-400 transition-colors hover:text-red-300"><Unlink className="h-2.5 w-2.5" />Rozłącz</button>
                      </div>
                    ) : (
                      <div className="border-t border-border px-3 py-2">
                        <button onClick={() => connectPlatform("youtube")} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20">
                          <LinkIcon className="h-3 w-3" />
                          Połącz konto YouTube
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Facebook */}
              {(() => {
                const p = platforms.facebook;
                return (
                  <div className="overflow-hidden rounded-lg border border-border bg-bg3">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <Facebook className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text">Facebook Live</p>
                          {p.connected ? (
                            <p className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="h-2.5 w-2.5" />{p.accountName}</p>
                          ) : (
                            <p className="text-[10px] text-muted">Nie połączono</p>
                          )}
                        </div>
                      </div>
                      {p.connected && (
                        <button onClick={() => togglePlatformStream("facebook")} className={cn("relative h-6 w-11 flex-shrink-0 rounded-full transition-colors", p.enabled ? "bg-lime" : "bg-bg4")}>
                          <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform", p.enabled && "translate-x-5")} />
                        </button>
                      )}
                    </div>
                    {p.connected ? (
                      <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
                        <span className="text-[10px] text-muted">{p.enabled ? "Transmisja aktywna" : "Transmisja wyłączona"}</span>
                        <button onClick={() => disconnectPlatform("facebook")} className="flex items-center gap-1 text-[10px] text-red-400 transition-colors hover:text-red-300"><Unlink className="h-2.5 w-2.5" />Rozłącz</button>
                      </div>
                    ) : (
                      <div className="border-t border-border px-3 py-2">
                        <button onClick={() => connectPlatform("facebook")} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20">
                          <LinkIcon className="h-3 w-3" />
                          Połącz konto Facebook
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Instagram */}
              {(() => {
                const p = platforms.instagram;
                return (
                  <div className="overflow-hidden rounded-lg border border-border bg-bg3">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
                          <Instagram className="h-4 w-4 text-pink-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text">Instagram Live</p>
                          {p.connected ? (
                            <p className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="h-2.5 w-2.5" />{p.accountName}</p>
                          ) : (
                            <p className="text-[10px] text-muted">Nie połączono</p>
                          )}
                        </div>
                      </div>
                      {p.connected && (
                        <button onClick={() => togglePlatformStream("instagram")} className={cn("relative h-6 w-11 flex-shrink-0 rounded-full transition-colors", p.enabled ? "bg-lime" : "bg-bg4")}>
                          <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform", p.enabled && "translate-x-5")} />
                        </button>
                      )}
                    </div>
                    {p.connected ? (
                      <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
                        <span className="text-[10px] text-muted">{p.enabled ? "Transmisja aktywna" : "Transmisja wyłączona"}</span>
                        <button onClick={() => disconnectPlatform("instagram")} className="flex items-center gap-1 text-[10px] text-red-400 transition-colors hover:text-red-300"><Unlink className="h-2.5 w-2.5" />Rozłącz</button>
                      </div>
                    ) : (
                      <div className="border-t border-border px-3 py-2">
                        <button onClick={() => connectPlatform("instagram")} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-pink-500/10 px-3 py-1.5 text-xs font-medium text-pink-400 transition-colors hover:bg-pink-500/20">
                          <LinkIcon className="h-3 w-3" />
                          Połącz konto Instagram
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Info */}
              <div className="flex items-start gap-2 rounded-lg bg-bg3/50 px-3 py-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted" />
                <p className="text-[10px] leading-relaxed text-muted">
                  Multistreaming wymaga planu <span className="font-semibold text-lime">Pro</span> lub wyższego.
                  Połącz konta platform, aby automatycznie retransmitować na żywo na wielu kanałach jednocześnie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
