import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { Users, Heart, Share2, Sparkles, X, Send, Copy, Check, Link2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { StreamPlayer } from "@/components/stream/StreamPlayer";
import { streamsApi } from "@/api/streams";
import type { LiveScore, StreamMarker } from "@/components/stream/types";
import ChatPanel from "@/components/stream/ChatPanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useStreamLatency } from "@/hooks/useStreamLatency";
import { useLatencyCompensatedEvents } from "@/hooks/useLatencyCompensatedEvents";

/* ─── Types ─── */

// Kontrakt wspólny ze Studiem — patrz components/stream/types.ts
type ScoreData = LiveScore;


/* ─── Demo data ─── */

const DEMO_SCORE: ScoreData = {
  team1: "Kowalski / Nowak",
  team2: "Wiśniewski / Zając",
  score1: 6,
  score2: 4,
  currentSet: 2,
  sets: [{ team1: 6, team2: 3 }],
  gameScore: { team1: "3", team2: "1" },
  elapsedTime: "01:24:07",
};

const DEMO_MARKERS: StreamMarker[] = [
  { time: 15, type: "ace", label: "As serwisowy — Kowalski", color: "#C8FF00" },
  { time: 45, type: "break", label: "Przełamanie — Wiśniewski/Zając", color: "#FB923C" },
  { time: 78, type: "set_end", label: "Koniec seta 1 — 6:3", color: "#60A5FA" },
  { time: 110, type: "match_point", label: "Piłka meczowa!", color: "#F87171" },
  { time: 135, type: "golden_point", label: "Złoty punkt!", color: "#FBBF24" },
];

const DEMO_MATCH_STATS = {
  team1Name: "Kowalski / Nowak",
  team2Name: "Wiśniewski / Zając",
  stats: [
    { label: "Asy serwisowe", team1: 8, team2: 5 },
    { label: "Podwójne błędy", team1: 2, team2: 4 },
    { label: "Winnery", team1: 15, team2: 11 },
    { label: "Błędy niewymuszone", team1: 9, team2: 14 },
    { label: "Procent 1. serwisu", team1: 72, team2: 65 },
    { label: "Punkty przy siatce", team1: 12, team2: 8 },
  ],
};

/* ─── Component ─── */

export default function LivePage() {
  const { id: streamId } = useParams<{ id: string }>();

  // Prawdziwy wynik przychodzi ze Studia; zanim nadejdzie, zakładki pokazują
  // dane demo, ale nakładka na wideo jest ukryta (patrz niżej)
  const [liveScore, setLiveScore] = useState<ScoreData | null>(null);
  const score = liveScore ?? DEMO_SCORE;
  const [activeTab, setActiveTab] = useState(0);
  // Backend nie publikuje jeszcze znaczników — zostają dane demo
  const [markers] = useState<StreamMarker[]>(DEMO_MARKERS);
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);

  // Share dropdown state
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const [sharePos, setSharePos] = useState({ top: 0, right: 0 });

  const openShare = useCallback(() => {
    if (shareBtnRef.current) {
      const rect = shareBtnRef.current.getBoundingClientRect();
      setSharePos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setShareOpen((v) => !v);
  }, []);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        shareRef.current && !shareRef.current.contains(e.target as Node) &&
        shareBtnRef.current && !shareBtnRef.current.contains(e.target as Node)
      ) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [shareOpen]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  const handleNativeShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: "Silesia Open 2025 — Finał",
        text: "Oglądaj mecz na żywo na PadelVision.tv!",
        url: window.location.href,
      });
      setShareOpen(false);
    }
  }, []);

  // Cheer/donation modal state
  const [cheerOpen, setCheerOpen] = useState(false);
  const [cheerAmount, setCheerAmount] = useState(100);
  const [cheerMessage, setCheerMessage] = useState("");
  const [cheerSent, setCheerSent] = useState(false);

  // Dane transmisji z API; demo ponizej zostaje jako fallback, dopoki
  // reszta strony (wynik, czat, statystyki) nie jest podpieta pod backend.
  const { data: stream } = useQuery({
    queryKey: ["stream", streamId],
    // axios zwraca AxiosResponse, a backend opakowuje wynik w ApiResponse
    queryFn: async () => (await streamsApi.getById(streamId!)).data.data,
    enabled: Boolean(streamId),
    retry: false,
    // liczbę widzów aktualizuje poller YouTube po stronie backendu
    refetchInterval: 30_000,
  });
  const viewerCount = stream?.viewerCount ?? 0;

  // Obraz z YouTube jest 15-30 s za rzeczywistoscia, a zdarzenia ze STOMP
  // docieraja natychmiast. Bez bufora overlay zdradzalby punkt przed akcja.
  const playerTimeRef = useRef<number | null>(null);
  const { latencyMs } = useStreamLatency({
    startedAt: stream?.startedAt,
    latencyPreference: stream?.latencyPreference,
    getPlayerTime: () => playerTimeRef.current,
    enabled: stream?.status === "LIVE",
  });

  const { push: pushScore } = useLatencyCompensatedEvents<ScoreData>(latencyMs, setLiveScore);

  // Wynik ze Studia przez STOMP (StreamService.updateScore). Idzie przez bufor
  // opóźnienia, żeby nakładka nie pokazywała punktu przed zagraniem.
  const { connected: wsConnected, subscribe } = useWebSocket();
  useEffect(() => {
    if (!wsConnected || !streamId) return;
    const subscription = subscribe(`/topic/stream.${streamId}.score`, (frame) => {
      try {
        pushScore(JSON.parse(frame.body) as ScoreData);
      } catch {
        // uszkodzona ramka — pomijamy
      }
    });
    return () => subscription?.unsubscribe();
  }, [wsConnected, streamId, subscribe, pushScore]);

  const tabs = ["O meczu", "Statystyki", "Bracket"];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Video Player */}
        <div className="relative w-full flex-shrink-0">
          <StreamPlayer
            youtubeVideoId={stream?.youtubeVideoId}
            hlsUrl={stream?.hlsUrl}
            isLive={stream?.status === "LIVE"}
            poster={stream?.thumbnailUrl ?? undefined}
            markers={markers}
            onTimeUpdate={(t) => (playerTimeRef.current = t)}
          />

          {/* Score Overlay — tylko prawdziwy wynik, nigdy dane demo */}
          {liveScore && (
          <div className="absolute right-4 top-4 z-20 rounded-lg bg-black/70 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-lime">{score.team1}</p>
                <p className="font-mono text-lg font-bold text-lime">{score.score1}</p>
              </div>
              <div className="text-muted text-xs">vs</div>
              <div>
                <p className="text-xs font-medium text-text">{score.team2}</p>
                <p className="font-mono text-lg font-bold text-text">{score.score2}</p>
              </div>
            </div>
            {score.gameScore && (
              <p className="mt-1 text-center font-mono text-[10px] text-muted">
                Gem: {score.gameScore.team1} - {score.gameScore.team2}
              </p>
            )}
          </div>
          )}

          {/* Live badge + viewers */}
          <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
            <span className="badge-live">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-live-pulse" />
              NA ŻYWO
            </span>
            <span className="flex items-center gap-1 rounded bg-bg/70 px-2 py-1 text-xs text-text backdrop-blur-sm">
              <Users className="h-3 w-3" />
              {viewerCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stream Info */}
        <div className="border-b border-border p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-display text-xl">
                Silesia Open 2025 — Finał OPEN A
              </h1>
              <p className="text-sm text-muted">Racket Club Katowice</p>
              <div className="mt-2 flex gap-2">
                {["turniej", "OPEN A", "Śląsk"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-bg4 px-2 py-0.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCheerOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-orange/20 px-3 py-2 text-xs font-bold text-orange transition-colors hover:bg-orange/30"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Wyślij Piłki
              </button>
              <div className="relative">
                <button
                  ref={shareBtnRef}
                  onClick={openShare}
                  className={cn(
                    "rounded-lg p-2 transition-colors hover:bg-bg3",
                    shareOpen ? "text-lime" : "text-muted hover:text-text"
                  )}
                  title="Udostępnij"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                {shareOpen && createPortal(
                  <div ref={shareRef} className="fixed z-[9999] w-56 overflow-hidden rounded-xl border border-border bg-bg2 shadow-2xl" style={{ top: sharePos.top, right: sharePos.right }}>
                    <button
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text transition-colors hover:bg-bg3"
                    >
                      {linkCopied ? (
                        <Check className="h-4 w-4 text-lime" />
                      ) : (
                        <Link2 className="h-4 w-4 text-muted" />
                      )}
                      {linkCopied ? "Skopiowano!" : "Kopiuj link"}
                    </button>
                    <div className="border-t border-border" />
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text transition-colors hover:bg-bg3"
                      onClick={() => setShareOpen(false)}
                    >
                      <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Oglądaj mecz na żywo na PadelVision.tv!")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text transition-colors hover:bg-bg3"
                      onClick={() => setShareOpen(false)}
                    >
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      X (Twitter)
                    </a>
                    <a
                      href={`https://www.tiktok.com/share?url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text transition-colors hover:bg-bg3"
                      onClick={() => setShareOpen(false)}
                    >
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>
                      TikTok
                    </a>
                    <a
                      href={`https://www.instagram.com/create/story/?url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text transition-colors hover:bg-bg3"
                      onClick={() => setShareOpen(false)}
                    >
                      <svg className="h-4 w-4 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      Instagram Stories
                    </a>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-6 px-4">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                  i === activeTab
                    ? "border-lime text-lime"
                    : "border-transparent text-muted hover:text-text"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Finał turnieju Silesia Open 2025 w kategorii OPEN A. Transmisja
                z Racket Club Katowice, Kort 1.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <p className="text-xs text-muted">Drużyna 1</p>
                  <p className="text-display text-lg text-lime">
                    {score.team1}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-muted">Drużyna 2</p>
                  <p className="text-display text-lg">{score.team2}</p>
                </div>
              </div>

              {/* Markers / Key moments */}
              {markers.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-text">
                    Kluczowe momenty
                  </h3>
                  <div className="space-y-1">
                    {markers.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg bg-bg3 px-3 py-2"
                      >
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                        <span className="text-xs text-muted font-mono">
                          {Math.floor(m.time / 60)}:{(m.time % 60).toString().padStart(2, "0")}
                        </span>
                        <span className="text-xs text-text">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 1 && (
            <div className="space-y-4">
              {/* Toggle stats overlay */}
              <button
                onClick={() => setShowStatsOverlay(!showStatsOverlay)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  showStatsOverlay
                    ? "bg-lime/20 text-lime"
                    : "bg-bg3 text-muted hover:text-text"
                )}
              >
                {showStatsOverlay ? "Ukryj overlay na playerze" : "Pokaż overlay na playerze"}
              </button>

              {/* Set history */}
              <div className="space-y-2">
                <h3 className="text-display text-base">Historia setów</h3>
                {score.sets?.map((set, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-lg bg-bg3 px-4 py-2"
                  >
                    <span className="text-xs text-muted">Set {i + 1}</span>
                    <span className="font-mono text-sm text-lime">
                      {set.team1}
                    </span>
                    <span className="text-muted">:</span>
                    <span className="font-mono text-sm text-text">
                      {set.team2}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-4 rounded-lg bg-bg4 px-4 py-2">
                  <span className="text-xs text-orange">
                    Set {score.currentSet} (aktywny)
                  </span>
                  <span className="font-mono text-sm text-lime">
                    {score.score1}
                  </span>
                  <span className="text-muted">:</span>
                  <span className="font-mono text-sm text-text">
                    {score.score2}
                  </span>
                </div>
              </div>

              {/* Match stats */}
              <div className="glass-card p-4">
                <h3 className="mb-3 text-display text-base">Statystyki meczu</h3>
                <div className="space-y-3">
                  {DEMO_MATCH_STATS.stats.map((stat) => (
                    <div key={stat.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span className="font-mono text-lime">{stat.team1}</span>
                        <span>{stat.label}</span>
                        <span className="font-mono text-text">{stat.team2}</span>
                      </div>
                      <div className="flex h-1.5 gap-1 rounded-full bg-bg4">
                        <div
                          className="rounded-l-full bg-lime"
                          style={{ width: `${(stat.team1 / (stat.team1 + stat.team2)) * 100}%` }}
                        />
                        <div
                          className="rounded-r-full bg-muted/30"
                          style={{ width: `${(stat.team2 / (stat.team1 + stat.team2)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 2 && (
            <div className="flex h-32 items-center justify-center rounded-lg bg-bg3">
              <p className="text-sm text-muted">
                Drabinka turnieju — dostępna wkrótce
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="h-[400px] w-full border-l border-border lg:h-auto lg:w-[340px]">
        {streamId && <ChatPanel streamId={streamId} delayMs={latencyMs} />}
      </div>

      {/* Cheer / Donation Modal */}
      {cheerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-bg2 p-6 shadow-2xl">
            <button
              onClick={() => { setCheerOpen(false); setCheerSent(false); }}
              className="absolute right-3 top-3 text-muted hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>

            {cheerSent ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <span className="text-5xl">🎾</span>
                <p className="text-display text-xl text-lime">Wysłano {cheerAmount} Piłek!</p>
                <p className="text-sm text-muted">Dziękujemy za wsparcie!</p>
                <button
                  onClick={() => { setCheerOpen(false); setCheerSent(false); }}
                  className="mt-2 rounded-lg bg-lime px-6 py-2 text-sm font-bold text-black"
                >
                  Zamknij
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-display text-lg text-text">Wyślij Piłki 🎾</h2>
                <p className="mt-1 text-xs text-muted">
                  Wesprzyj klub i pokaż efekt na streamie!
                </p>

                {/* Amount presets */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { amount: 10, label: "10", tier: "🎾" },
                    { amount: 100, label: "100", tier: "🔥" },
                    { amount: 500, label: "500", tier: "💥" },
                    { amount: 2000, label: "2000", tier: "🏆" },
                  ].map((opt) => (
                    <button
                      key={opt.amount}
                      onClick={() => setCheerAmount(opt.amount)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-bold transition-colors",
                        cheerAmount === opt.amount
                          ? "border-lime bg-lime/10 text-lime"
                          : "border-border bg-bg3 text-muted hover:border-lime/50 hover:text-text"
                      )}
                    >
                      <span className="text-lg">{opt.tier}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tier description */}
                <div className="mt-3 rounded-lg bg-bg3 p-2.5 text-center">
                  <p className={cn(
                    "text-xs font-bold",
                    cheerAmount >= 2000 ? "text-yellow-300" :
                    cheerAmount >= 500 ? "text-yellow-400" :
                    cheerAmount >= 100 ? "text-orange" : "text-lime"
                  )}>
                    {cheerAmount >= 2000 ? "MATCH POINT! 🏆 — pełnoekranowa animacja" :
                     cheerAmount >= 500 ? "SMASH! 💥 — eksplozja cząsteczek" :
                     cheerAmount >= 100 ? "ACE! 🔥 — banner na streamie" :
                     "NICE SHOT! 🎾 — piłka na ekranie"}
                  </p>
                </div>

                {/* Message */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Wiadomość (opcjonalnie)..."
                    value={cheerMessage}
                    onChange={(e) => setCheerMessage(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-xs text-text placeholder:text-muted focus:border-lime focus:outline-none"
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={() => {
                    setCheerSent(true);
                    const event = new CustomEvent("padelvision:cheer", {
                      detail: { amount: cheerAmount, message: cheerMessage, username: "PadelMaster_PL" },
                    });
                    window.dispatchEvent(event);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-lime py-3 text-sm font-bold text-black transition-colors hover:bg-lime-hover"
                >
                  <Send className="h-4 w-4" />
                  Wyślij {cheerAmount} Piłek — {(cheerAmount * 0.05).toFixed(2)} zł
                </button>

                <p className="mt-2 text-center text-[10px] text-muted">
                  1 Piłka = 0,05 zł · 70% trafia do klubu
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
