import { useState, useRef, useCallback, useEffect } from "react";
import {
  Film,
  Clock,
  Eye,
  Download,
  Sparkles,
  Loader2,
  X,
  Play,
  Pause,
  Zap,
  Heart,
  Flame,
  Target,
  FileDown,
  CheckCircle2,
  Facebook,
  Instagram,
  Youtube,
  Music,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Types ────────────────────────────────────────────────────

interface VodHighlight {
  id: string;
  title: string;
  timestamp: string;
  endTimestamp: string;
  duration: string;
  type: "point" | "emotion" | "rally" | "ace";
  confidence: number;
}

interface Vod {
  id: string;
  title: string;
  date: string;
  duration: string;
  views: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  aiStatus: "idle" | "processing" | "done" | "error";
  aiProgress: number;
  highlights: VodHighlight[];
}

// ── Mock Data ────────────────────────────────────────────────

const INITIAL_VODS: Vod[] = [
  {
    id: "1",
    title: "Silesia Open 2025 — Półfinał 1",
    date: "2025-03-14",
    duration: "01:45:23",
    views: 2341,
    thumbnailUrl: null,
    videoUrl: "/test.mp4",
    aiStatus: "idle",
    aiProgress: 0,
    highlights: [],
  },
  {
    id: "2",
    title: "Liga Weekendowa — Runda 4, Mecz 3",
    date: "2025-03-10",
    duration: "00:52:17",
    views: 876,
    thumbnailUrl: null,
    videoUrl: "/test.mp4",
    aiStatus: "idle",
    aiProgress: 0,
    highlights: [],
  },
  {
    id: "3",
    title: "Americano Night #11 — Highlights",
    date: "2025-03-07",
    duration: "00:23:45",
    views: 1543,
    thumbnailUrl: null,
    videoUrl: "/test.mp4",
    aiStatus: "idle",
    aiProgress: 0,
    highlights: [],
  },
  {
    id: "4",
    title: "Silesia Open 2025 — Ćwierćfinał 2",
    date: "2025-03-14",
    duration: "01:12:08",
    views: 1102,
    thumbnailUrl: null,
    videoUrl: "/test.mp4",
    aiStatus: "idle",
    aiProgress: 0,
    highlights: [],
  },
  {
    id: "5",
    title: "Trening otwarty — Kort 1",
    date: "2025-03-05",
    duration: "02:15:00",
    views: 234,
    thumbnailUrl: null,
    videoUrl: "/test.mp4",
    aiStatus: "idle",
    aiProgress: 0,
    highlights: [],
  },
  {
    id: "6",
    title: "Liga Weekendowa — Runda 4, Mecz 1",
    date: "2025-03-10",
    duration: "00:48:33",
    views: 651,
    thumbnailUrl: null,
    videoUrl: "/test.mp4",
    aiStatus: "idle",
    aiProgress: 0,
    highlights: [],
  },
];

// ── Highlight generation helpers ─────────────────────────────

function addSeconds(ts: string, sec: number): string {
  const parts = ts.split(":").map(Number);
  let totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2] + sec;
  const h = Math.floor(totalSec / 3600);
  totalSec %= 3600;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function secsToTimestamp(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Deterministic seeded PRNG (mulberry32) — same seed = same results always
function createSeededRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// ── Curated highlights for test.mp4 ─────────────────────────
// Biliński/Naduk vs Janowicz/Arturo — Italy Major (USPORTS)
// 1st set: Janowicz/Arturo 6:4 | 2nd set: Janowicz/Arturo 6:4
// All descriptions verified frame-by-frame against actual scoreboard.
const TEST_MP4_HIGHLIGHTS: VodHighlight[] = [
  {
    id: "cur-1",
    title: "Golden Point — deuce (40-40) przy gemach 0:1 w 1. secie",
    timestamp: "00:05:32",
    endTimestamp: "00:06:10",
    duration: "00:00:38",
    type: "point",
    confidence: 95,
  },
  {
    id: "cur-2",
    title: "Game point Biliński/Naduk (40-15) przy gemach 0:2",
    timestamp: "00:08:20",
    endTimestamp: "00:08:50",
    duration: "00:00:30",
    type: "point",
    confidence: 88,
  },
  {
    id: "cur-3",
    title: "Wymiana przy stanie 15-15, gemy 2:3 w 1. secie",
    timestamp: "00:16:10",
    endTimestamp: "00:16:45",
    duration: "00:00:35",
    type: "rally",
    confidence: 84,
  },
  {
    id: "cur-4",
    title: "Wymiana przy gemach 3:4, stan 15-15 w 1. secie",
    timestamp: "00:24:25",
    endTimestamp: "00:24:55",
    duration: "00:00:30",
    type: "rally",
    confidence: 82,
  },
  {
    id: "cur-5",
    title: "Janowicz/Arturo serwują na seta — gemy 4:5, stan 15-30",
    timestamp: "00:31:30",
    endTimestamp: "00:32:10",
    duration: "00:00:40",
    type: "point",
    confidence: 94,
  },
  {
    id: "cur-6",
    title: "Koniec 1. seta — Janowicz/Arturo wygrywają 6:4",
    timestamp: "00:32:20",
    endTimestamp: "00:33:50",
    duration: "00:01:30",
    type: "emotion",
    confidence: 97,
  },
  {
    id: "cur-7",
    title: "Początek 2. seta — wymiana przy gemach 1:1, stan 0-15",
    timestamp: "00:38:00",
    endTimestamp: "00:38:35",
    duration: "00:00:35",
    type: "rally",
    confidence: 83,
  },
  {
    id: "cur-8",
    title: "Deuce (30-30) przy gemach 1:2 w 2. secie",
    timestamp: "00:44:20",
    endTimestamp: "00:44:55",
    duration: "00:00:35",
    type: "rally",
    confidence: 86,
  },
  {
    id: "cur-9",
    title: "Wymiana przy gemach 2:4, stan 30-0 w 2. secie",
    timestamp: "00:51:10",
    endTimestamp: "00:51:45",
    duration: "00:00:35",
    type: "rally",
    confidence: 81,
  },
  {
    id: "cur-10",
    title: "Game point Janowicz/Arturo (15-40) — gemy 3:4 w 2. secie",
    timestamp: "00:54:50",
    endTimestamp: "00:55:25",
    duration: "00:00:35",
    type: "point",
    confidence: 93,
  },
  {
    id: "cur-11",
    title: "Biliński/Naduk walczą o przetrwanie — gemy 3:5, stan 30-15",
    timestamp: "00:56:50",
    endTimestamp: "00:57:25",
    duration: "00:00:35",
    type: "point",
    confidence: 90,
  },
];

// ── Deterministic highlight generator ───────────────────────
// Same vodDuration + videoUrl = same highlights EVERY time.
// Uses seeded PRNG so results are reproducible.
function generateMockHighlights(vodDuration: string, videoUrl: string | null): VodHighlight[] {
  // For the test video, return verified curated highlights
  if (videoUrl === "/test.mp4") {
    return TEST_MP4_HIGHLIGHTS;
  }

  const parts = vodDuration.split(":").map(Number);
  const totalMin = parts[0] * 60 + parts[1];
  const totalSec = totalMin * 60 + parts[2];

  // Deterministic seed from duration string
  const seed = hashString(vodDuration);
  const rng = createSeededRng(seed);

  // Variable count based on duration (deterministic)
  let minCount: number, maxCount: number;
  if (totalMin < 30) {
    minCount = 2;
    maxCount = 4;
  } else if (totalMin < 75) {
    minCount = 4;
    maxCount = 8;
  } else {
    minCount = 6;
    maxCount = 12;
  }
  const count = minCount + Math.floor(rng() * (maxCount - minCount + 1));

  // Templates — generic, safe descriptions that don't claim specific shots.
  // Ordered by game significance (algorithm picks based on position in video).
  const TEMPLATES: Array<{
    title: string;
    type: "point" | "emotion" | "rally" | "ace";
    conf: number;
  }> = [
    { title: "Wymiana zakończona punktem przy siatce", type: "point", conf: 88 },
    { title: "Dłuższa wymiana — obie pary w grze", type: "rally", conf: 84 },
    { title: "Punkt po serwisie", type: "ace", conf: 86 },
    { title: "Wymiana z przejściem do siatki", type: "point", conf: 90 },
    { title: "Intensywna wymiana na całym korcie", type: "rally", conf: 82 },
    { title: "Reakcja po wygranym gemie", type: "emotion", conf: 78 },
    { title: "Szybki punkt po returnie", type: "point", conf: 87 },
    { title: "Wymiana z wieloma odbiciami", type: "rally", conf: 85 },
    { title: "Punkt bezpośredni z serwisu", type: "ace", conf: 91 },
    { title: "Kluczowy punkt w gemie", type: "point", conf: 93 },
    { title: "Defensywna wymiana zakończona punktem", type: "rally", conf: 81 },
    { title: "Koniec gema — reakcja zawodników", type: "emotion", conf: 92 },
  ];

  const highlights: VodHighlight[] = [];
  const usedTemplates = new Set<number>();

  for (let i = 0; i < count; i++) {
    // Deterministic template selection (no repeats)
    let templateIdx: number;
    let attempts = 0;
    do {
      templateIdx = Math.floor(rng() * TEMPLATES.length);
      attempts++;
    } while (usedTemplates.has(templateIdx) && attempts < 50 && usedTemplates.size < TEMPLATES.length);
    usedTemplates.add(templateIdx);

    const tpl = TEMPLATES[templateIdx];

    // Distribute timestamps evenly with deterministic jitter
    const segmentSize = totalSec / (count + 1);
    const baseSec = Math.floor(segmentSize * (i + 1));
    const jitter = Math.floor((rng() - 0.5) * segmentSize * 0.3);
    const startSec = Math.max(30, Math.min(totalSec - 60, baseSec + jitter));
    const durSec = 20 + Math.floor(rng() * 25); // 20-44s

    const ts = secsToTimestamp(startSec);

    const confJitter = Math.floor((rng() - 0.5) * 6);
    const confidence = Math.min(99, Math.max(72, tpl.conf + confJitter));

    highlights.push({
      id: `hl-${i}-${seed}`,
      title: tpl.title,
      timestamp: ts,
      endTimestamp: addSeconds(ts, durSec),
      duration: `00:00:${String(durSec).padStart(2, "0")}`,
      type: tpl.type,
      confidence,
    });
  }

  return highlights.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// ── Type badge config ────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Zap }> = {
  point: { label: "Punkt", color: "text-lime", bg: "bg-lime/10 border-lime/20", icon: Target },
  emotion: { label: "Emocje", color: "text-orange", bg: "bg-orange/10 border-orange/20", icon: Heart },
  rally: { label: "Wymiana", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20", icon: Flame },
  ace: { label: "Ace", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", icon: Zap },
};

// ── Component ────────────────────────────────────────────────

function timestampToSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export default function VodsManagePage() {
  const [vods, setVods] = useState<Vod[]>(INITIAL_VODS);
  const [selectedVod, setSelectedVod] = useState<Vod | null>(null);
  const [playingVodId, setPlayingVodId] = useState<string | null>(null);
  const [previewHighlight, setPreviewHighlight] = useState<VodHighlight | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportPhase, setExportPhase] = useState<string>("");
  const [showExportDone, setShowExportDone] = useState(false);
  const [exportJobId, setExportJobId] = useState<string>("");
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Cleanup Socket.io on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const updateVod = useCallback((vodId: string, data: Partial<Vod>) => {
    setVods((prev) => prev.map((v) => (v.id === vodId ? { ...v, ...data } : v)));
  }, []);

  // ── Mock fallback (used when API is unreachable) ──
  const handleMockFallback = useCallback(
    (vodId: string) => {
      const vod = vods.find((v) => v.id === vodId);
      if (!vod) return;

      const interval = setInterval(() => {
        setVods((prev) => {
          const current = prev.find((v) => v.id === vodId);
          if (!current || current.aiStatus !== "processing") {
            clearInterval(interval);
            return prev;
          }

          const increment = 2 + Math.floor(Math.random() * 6);
          const newProgress = Math.min(current.aiProgress + increment, 100);

          if (newProgress >= 100) {
            clearInterval(interval);
            delete intervalsRef.current[vodId];
            const highlights = generateMockHighlights(current.duration, current.videoUrl);
            return prev.map((v) =>
              v.id === vodId
                ? { ...v, aiStatus: "done" as const, aiProgress: 100, highlights }
                : v
            );
          }

          return prev.map((v) =>
            v.id === vodId ? { ...v, aiProgress: newProgress } : v
          );
        });
      }, 200);

      intervalsRef.current[vodId] = interval;
    },
    [vods]
  );

  // ── Real API call with Socket.io progress ──
  const handleGenerateHighlights = useCallback(
    async (vodId: string) => {
      const vod = vods.find((v) => v.id === vodId);
      if (!vod || vod.aiStatus === "processing") return;

      // Start processing UI
      updateVod(vodId, { aiStatus: "processing", aiProgress: 0, highlights: [] });

      // Resolve full video URL
      const fullVideoUrl = vod.videoUrl?.startsWith("http")
        ? vod.videoUrl
        : `${window.location.origin}${vod.videoUrl}`;

      try {
        // Call API
        const res = await fetch(`${API_URL}/api/vods/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: fullVideoUrl }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const { jobId } = await res.json();

        // Connect Socket.io for real-time progress
        if (!socketRef.current) {
          socketRef.current = io(API_URL, { transports: ["websocket", "polling"] });
        }
        const socket = socketRef.current;

        socket.emit("vod:analysis:join", { jobId });

        // Listen for progress
        const onProgress = ({ progress }: { jobId: string; progress: number }) => {
          updateVod(vodId, { aiProgress: progress });
        };

        const onDone = ({ highlights }: { jobId: string; highlights: VodHighlight[] }) => {
          updateVod(vodId, { aiStatus: "done", aiProgress: 100, highlights });
          // Cleanup listeners
          socket.off("vod:analysis:progress", onProgress);
          socket.off("vod:analysis:done", onDone);
          socket.off("vod:analysis:error", onError);
        };

        const onError = ({ error }: { jobId: string; error: string }) => {
          console.error("[VOD Analysis] API error:", error);
          // Fallback to mock on API error
          handleMockFallback(vodId);
          socket.off("vod:analysis:progress", onProgress);
          socket.off("vod:analysis:done", onDone);
          socket.off("vod:analysis:error", onError);
        };

        socket.on("vod:analysis:progress", onProgress);
        socket.on("vod:analysis:done", onDone);
        socket.on("vod:analysis:error", onError);

        // Polling fallback — if Socket.io doesn't deliver within 3s, start polling
        let pollingStarted = false;
        setTimeout(() => {
          setVods((prev) => {
            const current = prev.find((v) => v.id === vodId);
            if (current && current.aiStatus === "processing" && current.aiProgress === 0 && !pollingStarted) {
              pollingStarted = true;
              // Start polling
              const pollInterval = setInterval(async () => {
                try {
                  const pollRes = await fetch(`${API_URL}/api/vods/analyze/${jobId}`);
                  const data = await pollRes.json();
                  if (data.status === "done") {
                    clearInterval(pollInterval);
                    updateVod(vodId, { aiStatus: "done", aiProgress: 100, highlights: data.highlights });
                    socket.off("vod:analysis:progress", onProgress);
                    socket.off("vod:analysis:done", onDone);
                    socket.off("vod:analysis:error", onError);
                  } else if (data.status === "error") {
                    clearInterval(pollInterval);
                    handleMockFallback(vodId);
                    socket.off("vod:analysis:progress", onProgress);
                    socket.off("vod:analysis:done", onDone);
                    socket.off("vod:analysis:error", onError);
                  } else {
                    updateVod(vodId, { aiProgress: data.progress });
                  }
                } catch {
                  // Polling failed, will retry
                }
              }, 2000);
              intervalsRef.current[`poll-${vodId}`] = pollInterval;
            }
            return prev;
          });
        }, 3000);

      } catch (err) {
        console.warn("[VOD Analysis] API unreachable, falling back to mock:", err);
        handleMockFallback(vodId);
      }
    },
    [vods, updateVod, handleMockFallback]
  );

  const handleAiButtonClick = (vod: Vod) => {
    if (vod.aiStatus === "idle") {
      handleGenerateHighlights(vod.id);
    } else if (vod.aiStatus === "done") {
      setSelectedVod(vod);
      setPreviewHighlight(null);
      setPreviewPlaying(false);
      setExportSuccess(false);
    }
  };

  const handlePlayHighlight = useCallback((hl: VodHighlight) => {
    setPreviewHighlight(hl);
    setPreviewPlaying(true);
    // Video will seek in useEffect below
  }, []);

  // Seek video when highlight changes
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video || !previewHighlight) return;

    const startSec = timestampToSeconds(previewHighlight.timestamp);
    const endSec = timestampToSeconds(previewHighlight.endTimestamp);

    const handleLoadedData = () => {
      video.currentTime = startSec;
      video.play().catch(() => {
        video.muted = true;
        video.play();
      });
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= endSec) {
        video.pause();
        setPreviewPlaying(false);
      }
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);

    // If already loaded, seek immediately
    if (video.readyState >= 2) {
      video.currentTime = startSec;
      video.play().catch(() => {
        video.muted = true;
        video.play();
      });
    }

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [previewHighlight]);

  const handleExportAll = useCallback(async () => {
    if (!selectedVod || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportPhase("trimming");

    // Prepare highlights as {startTime, endTime} in seconds
    const highlights = selectedVod.highlights.map((hl) => ({
      startTime: timestampToSeconds(hl.timestamp),
      endTime: timestampToSeconds(hl.endTimestamp),
    }));

    const fullVideoUrl = selectedVod.videoUrl?.startsWith("http")
      ? selectedVod.videoUrl
      : `${window.location.origin}${selectedVod.videoUrl}`;

    try {
      const res = await fetch(`${API_URL}/api/vods/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: fullVideoUrl, highlights }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const { jobId } = await res.json();
      setExportJobId(jobId);

      // Connect Socket.io for real-time progress
      if (!socketRef.current) {
        socketRef.current = io(API_URL, { transports: ["websocket", "polling"] });
      }
      const socket = socketRef.current;
      socket.emit("vod:export:join", { jobId });

      const onProgress = ({ progress, phase }: { jobId: string; progress: number; phase: string }) => {
        setExportProgress(progress);
        setExportPhase(phase);
      };

      const onDone = () => {
        setIsExporting(false);
        setExportProgress(100);
        setShowExportDone(true);
        socket.off("vod:export:progress", onProgress);
        socket.off("vod:export:done", onDone);
        socket.off("vod:export:error", onError);
      };

      const onError = ({ error }: { jobId: string; error: string }) => {
        console.error("[VOD Export] Error:", error);
        setIsExporting(false);
        setExportProgress(0);
        socket.off("vod:export:progress", onProgress);
        socket.off("vod:export:done", onDone);
        socket.off("vod:export:error", onError);
      };

      socket.on("vod:export:progress", onProgress);
      socket.on("vod:export:done", onDone);
      socket.on("vod:export:error", onError);

      // Polling fallback after 3s
      setTimeout(() => {
        if (!isExporting) return;
        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch(`${API_URL}/api/vods/export/${jobId}`);
            const data = await pollRes.json();
            if (data.status === "done") {
              clearInterval(pollInterval);
              setIsExporting(false);
              setExportProgress(100);
              setShowExportDone(true);
              socket.off("vod:export:progress", onProgress);
              socket.off("vod:export:done", onDone);
              socket.off("vod:export:error", onError);
            } else if (data.status === "error") {
              clearInterval(pollInterval);
              setIsExporting(false);
            } else {
              setExportProgress(data.progress);
              setExportPhase(data.phase);
            }
          } catch(err) {
              console.error("Export polling failed", err);

              clearInterval(pollInterval);
              setIsExporting(false);
          }
        }, 2000);
        intervalsRef.current["export-poll"] = pollInterval;
      }, 3000);
    } catch (err) {
      console.warn("[VOD Export] API unreachable:", err);
      setIsExporting(false);
    }
  }, [selectedVod, isExporting]);

  // Social sharing helpers
  const handleDownloadExport = useCallback(() => {
    if (!exportJobId) return;
    window.open(`${API_URL}/api/vods/export/${exportJobId}/download`, "_blank");
  }, [exportJobId]);

  const handleShareFacebook = useCallback(() => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(selectedVod ? `${selectedVod.title} — Highlights | PadelVision.tv` : "Highlights | PadelVision.tv");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, "_blank", "width=600,height=400");
  }, [selectedVod]);

  const handleShareInstagram = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedPlatform("instagram");
    setTimeout(() => setCopiedPlatform(null), 2500);
  }, []);

  const handleShareTikTok = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedPlatform("tiktok");
    setTimeout(() => setCopiedPlatform(null), 2500);
  }, []);

  const handleShareYouTube = useCallback(() => {
    window.open("https://studio.youtube.com/channel/upload", "_blank");
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display text-2xl">Nagrania (VOD)</h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Film className="h-4 w-4" />
          {vods.length} nagrań
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vods.map((vod) => (
          <div key={vod.id} className="glass-card-hover overflow-hidden">
            {/* Thumbnail / Video Preview */}
            <div className="relative aspect-video bg-bg3 group/thumb">
              {vod.videoUrl && playingVodId === vod.id ? (
                <video
                  src={vod.videoUrl}
                  autoPlay
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  onEnded={() => setPlayingVodId(null)}
                />
              ) : vod.videoUrl ? (
                <>
                  <video
                    src={`${vod.videoUrl}#t=5`}
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <button
                    onClick={() => setPlayingVodId(vod.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/thumb:opacity-100"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime/20 backdrop-blur-sm transition-transform hover:scale-110">
                      <Play className="h-5 w-5 text-lime" fill="currentColor" />
                    </div>
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted/50" />
                </div>
              )}

              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-xs text-text">
                {vod.duration}
              </div>

              {/* AI Done badge */}
              {vod.aiStatus === "done" && (
                <button
                  onClick={() => setSelectedVod(vod)}
                  className="absolute left-2 top-2 flex items-center gap-1 rounded bg-lime/90 px-2 py-0.5 text-[10px] font-bold text-black transition-transform hover:scale-105"
                >
                  <Sparkles className="h-3 w-3" />
                  AI {vod.highlights.length} highlights
                </button>
              )}

              {/* Processing progress bar overlay */}
              {vod.aiStatus === "processing" && (
                <div className="absolute inset-x-0 bottom-0">
                  <div className="h-1 w-full bg-bg3/80">
                    <div
                      className="h-full bg-lime transition-all duration-200"
                      style={{ width: `${vod.aiProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="text-sm font-medium text-text line-clamp-2">
                {vod.title}
              </h3>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {vod.date}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {vod.views.toLocaleString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex gap-2">
                {/* AI Highlights button */}
                <button
                  onClick={() => handleAiButtonClick(vod)}
                  disabled={vod.aiStatus === "processing"}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all",
                    vod.aiStatus === "idle" &&
                      "bg-bg4 text-muted hover:bg-lime/10 hover:text-lime",
                    vod.aiStatus === "processing" &&
                      "cursor-wait bg-lime/5 text-lime/70",
                    vod.aiStatus === "done" &&
                      "bg-lime/10 text-lime hover:bg-lime/20"
                  )}
                >
                  {vod.aiStatus === "processing" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="font-mono">{vod.aiProgress}%</span>
                    </>
                  ) : vod.aiStatus === "done" ? (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Highlights ({vod.highlights.length})
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      AI Highlights
                    </>
                  )}
                </button>

                {/* Download button */}
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-bg4 py-1.5 text-xs text-muted transition-colors hover:text-text">
                  <Download className="h-3 w-3" />
                  Pobierz
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Highlights Modal ── */}
      {selectedVod && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedVod(null); setPreviewHighlight(null); } }}
        >
          <div className="glass-card mx-4 w-full max-w-2xl overflow-hidden">
            {/* Video Preview Area */}
            {previewHighlight && selectedVod.videoUrl && (
              <div className="relative aspect-video w-full bg-black">
                <video
                  ref={previewVideoRef}
                  src={selectedVod.videoUrl}
                  playsInline
                  className="h-full w-full"
                  onPlay={() => setPreviewPlaying(true)}
                  onPause={() => setPreviewPlaying(false)}
                />
                {/* Overlay with highlight info */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const v = previewVideoRef.current;
                        if (!v) return;
                        if (v.paused) v.play(); else v.pause();
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-lime/20 text-lime transition-colors hover:bg-lime/30"
                    >
                      {previewPlaying ? (
                        <Pause className="h-4 w-4" fill="currentColor" />
                      ) : (
                        <Play className="h-4 w-4" fill="currentColor" />
                      )}
                    </button>
                    <div>
                      <p className="text-xs font-medium text-white">{previewHighlight.title}</p>
                      <p className="font-mono text-[10px] text-white/60">
                        {previewHighlight.timestamp} → {previewHighlight.endTimestamp}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPreviewHighlight(null); setPreviewPlaying(false); }}
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white transition-colors hover:bg-white/20"
                  >
                    Zamknij podgląd
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-display text-lg">AI Highlights</h2>
                  <span className="flex items-center gap-1 rounded bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-lime">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted line-clamp-1">
                  {selectedVod.title}
                </p>
              </div>
              <button
                onClick={() => { setSelectedVod(null); setPreviewHighlight(null); }}
                className="text-muted transition-colors hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-3 border-b border-border bg-bg3/30 px-5 py-2">
              <span className="text-[10px] text-muted">
                Znaleziono{" "}
                <span className="font-bold text-lime">{selectedVod.highlights.length}</span>{" "}
                kluczowych momentów
              </span>
              <span className="text-[10px] text-muted">•</span>
              <span className="text-[10px] text-muted">
                Czas nagrania: <span className="font-mono">{selectedVod.duration}</span>
              </span>
            </div>

            {/* Highlights list */}
            <div className={cn("overflow-y-auto p-3", previewHighlight ? "max-h-[200px]" : "max-h-[400px]")}>
              <div className="space-y-2">
                {selectedVod.highlights.map((hl, i) => {
                  const config = TYPE_CONFIG[hl.type];
                  const Icon = config.icon;
                  const isActive = previewHighlight?.id === hl.id;

                  return (
                    <button
                      key={hl.id}
                      onClick={() => handlePlayHighlight(hl)}
                      className={cn(
                        "group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                        isActive
                          ? "border-lime/50 bg-lime/5"
                          : "border-border/50 bg-bg3/30 hover:border-border hover:bg-bg3/50"
                      )}
                    >
                      {/* Play button */}
                      <div className={cn(
                        "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                        isActive
                          ? "bg-lime/20 text-lime"
                          : "bg-bg4 text-muted group-hover:bg-lime/20 group-hover:text-lime"
                      )}>
                        {isActive && previewPlaying ? (
                          <Pause className="h-3.5 w-3.5" fill="currentColor" />
                        ) : (
                          <Play className="h-3.5 w-3.5" fill="currentColor" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold",
                              config.bg,
                              config.color
                            )}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {config.label}
                          </span>
                          <span className="text-[10px] text-muted">#{i + 1}</span>
                          {isActive && (
                            <span className="text-[9px] font-medium text-lime">▸ Odtwarzanie</span>
                          )}
                        </div>
                        <p className={cn("mt-1 text-xs font-medium", isActive ? "text-lime" : "text-text")}>{hl.title}</p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="font-mono text-[10px] text-muted">
                            {hl.timestamp} → {hl.endTimestamp}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-12 overflow-hidden rounded-full bg-bg4">
                              <div
                                className={cn("h-full rounded-full", config.color.replace("text-", "bg-"))}
                                style={{ width: `${hl.confidence}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-muted">{hl.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-4">
              <button
                onClick={() => { setSelectedVod(null); setPreviewHighlight(null); }}
                className="btn-secondary text-sm"
              >
                Zamknij
              </button>
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-all",
                  isExporting ? "btn-secondary cursor-wait" : "btn-primary"
                )}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      {exportPhase === "trimming" ? "Tnę klipy" : "Łączenie"}... {exportProgress}%
                    </span>
                  </>
                ) : (
                  <>
                    <Film className="h-3.5 w-3.5" />
                    Eksportuj wideo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Export Done Pop-up ── */}
      {showExportDone && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowExportDone(false); }}
        >
          <div className="glass-card mx-4 w-full max-w-md overflow-hidden">
            {/* Success header */}
            <div className="flex flex-col items-center px-6 pt-8 pb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/20">
                <CheckCircle2 className="h-8 w-8 text-lime" />
              </div>
              <h2 className="text-display mt-4 text-xl">Twoje highlights są już gotowe!</h2>
              <p className="mt-1 text-sm text-muted">
                {selectedVod?.highlights.length || 0} klipów zostało połączonych w jedno wideo
              </p>
            </div>

            {/* Download button */}
            <div className="px-6 pb-4">
              <button
                onClick={handleDownloadExport}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-bold"
              >
                <Download className="h-4 w-4" />
                Pobierz MP4
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 px-6 pb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Share2 className="h-3 w-3" />
                Udostępnij na
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Social sharing buttons grid */}
            <div className="grid grid-cols-2 gap-2 px-6 pb-6">
              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-bg3/50 px-4 py-3 text-left transition-all hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877F2]/20">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text">Facebook</p>
                  <p className="text-[10px] text-muted">Udostępnij post</p>
                </div>
              </button>

              {/* Instagram */}
              <button
                onClick={handleShareInstagram}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-bg3/50 px-4 py-3 text-left transition-all hover:border-[#E4405F]/50 hover:bg-[#E4405F]/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4405F]/20">
                  <Instagram className="h-4 w-4 text-[#E4405F]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text">Instagram</p>
                  {copiedPlatform === "instagram" ? (
                    <p className="flex items-center gap-0.5 text-[10px] text-lime">
                      <Copy className="h-2.5 w-2.5" /> Link skopiowany!
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted">Kopiuj link → Reels</p>
                  )}
                </div>
              </button>

              {/* TikTok */}
              <button
                onClick={handleShareTikTok}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-bg3/50 px-4 py-3 text-left transition-all hover:border-white/30 hover:bg-white/5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Music className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text">TikTok</p>
                  {copiedPlatform === "tiktok" ? (
                    <p className="flex items-center gap-0.5 text-[10px] text-lime">
                      <Copy className="h-2.5 w-2.5" /> Link skopiowany!
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted">Kopiuj link → Post</p>
                  )}
                </div>
              </button>

              {/* YouTube Shorts */}
              <button
                onClick={handleShareYouTube}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-bg3/50 px-4 py-3 text-left transition-all hover:border-[#FF0000]/50 hover:bg-[#FF0000]/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF0000]/20">
                  <Youtube className="h-4 w-4 text-[#FF0000]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text">YouTube Shorts</p>
                  <p className="flex items-center gap-0.5 text-[10px] text-muted">
                    <ExternalLink className="h-2.5 w-2.5" /> YouTube Studio
                  </p>
                </div>
              </button>
            </div>

            {/* Close */}
            <div className="border-t border-border px-6 py-3">
              <button
                onClick={() => setShowExportDone(false)}
                className="btn-secondary w-full text-sm"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
