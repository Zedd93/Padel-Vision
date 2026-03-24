import { useState, useEffect, useCallback, useRef } from "react";

import { useUiStore } from "@/store/uiStore";

// Toast helper using global UI store
function toast(message: string, type: "success" | "error" | "info" = "info") {
  useUiStore.getState().addToast(message, type);
}
import {
  Upload,
  Globe,
  MessageSquare,
  Link2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Unlink,
  Loader2,
  HelpCircle,
  ExternalLink,
  Users,
  Calendar,
  AlertCircle,
  Facebook,
  Instagram,
  Youtube,
  Music,
  Share2,
  Radio,
  Wifi,
  Shield,
  Bell,
  CreditCard,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  Settings,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  Ban,
  AlertTriangle,
  Crown,
  Star,
  BarChart3,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePlaytomicStore } from "@/lib/stores/playtomic-store";

const CLUB_ID = "demo-club-1";

/* ─── Tabs ───────────────────────────────────────── */

const TABS = [
  { key: "profile", label: "Profil", icon: Globe },
  { key: "streaming", label: "Streaming", icon: Radio },
  { key: "chat", label: "Czat", icon: MessageSquare },
  { key: "notifications", label: "Powiadomienia", icon: Bell },
  { key: "integrations", label: "Integracje", icon: Link2 },
  { key: "plan", label: "Plan", icon: Crown },
];

/* ─── Toast ──────────────────────────────────────── */

function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-border bg-bg2 px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-4">
      {type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
      {type === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
      {type === "info" && <Check className="h-4 w-4 text-lime" />}
      <span className="text-sm text-text">{message}</span>
      <button onClick={onClose} className="ml-2 text-muted hover:text-text">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Toggle Switch ──────────────────────────────── */

function Toggle({ enabled, onChange, size = "md" }: { enabled: boolean; onChange: () => void; size?: "sm" | "md" }) {
  const w = size === "sm" ? "w-8" : "w-10";
  const h = size === "sm" ? "h-4" : "h-5";
  const dot = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const off = size === "sm" ? "left-0.5" : "left-0.5";
  const on = size === "sm" ? "left-[16px]" : "left-[22px]";

  return (
    <button
      onClick={onChange}
      className={cn("relative rounded-full transition-colors", w, h, enabled ? "bg-lime" : "bg-bg4")}
    >
      <div className={cn("absolute top-0.5 rounded-full bg-white transition-all", dot, enabled ? on : off)} />
    </button>
  );
}

/* ─── Profile Tab ────────────────────────────────── */

function ProfileTab({ clubData, update, onSave, isSaving }: any) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Dozwolone tylko pliki graficzne (PNG, JPG)", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Plik jest za duży. Maksymalny rozmiar to 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
      toast("Logo zaktualizowane", "success");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <Globe className="h-4 w-4 text-lime" />
          Profil klubu
        </h2>

        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-bg4 text-display text-2xl text-lime">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo klubu" className="h-full w-full object-cover" />
            ) : (
              "RC"
            )}
          </div>
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleLogoChange}
            />
            <button className="btn-secondary py-2 text-xs" onClick={() => logoInputRef.current?.click()}>
              <Upload className="mr-1.5 h-3 w-3" />
              Zmień logo
            </button>
            <p className="mt-1 text-[10px] text-muted">PNG lub JPG, max 2MB</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Nazwa klubu</label>
            <input type="text" value={clubData.name} onChange={update("name")} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">URL kanału</label>
            <div className="flex items-center rounded-lg border border-border bg-bg3">
              <span className="px-3 text-xs text-muted">padelvision.tv/club/</span>
              <input type="text" value={clubData.slug} onChange={update("slug")} className="flex-1 border-l border-border bg-transparent px-3 py-2 text-sm text-text focus:outline-none" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Miasto</label>
              <input type="text" value={clubData.city} onChange={update("city")} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Liczba kortów</label>
              <input type="number" value={clubData.courtCount} onChange={update("courtCount")} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Opis</label>
            <textarea rows={3} value={clubData.description} onChange={update("description")} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
            <p className="mt-1 text-[10px] text-muted">{clubData.description.length}/300 znaków</p>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <MessageSquare className="h-4 w-4 text-lime" />
          Linki społecznościowe
        </h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Strona www</label>
            <input type="url" value={clubData.website} onChange={update("website")} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Instagram</label>
              <input type="text" value={clubData.instagram} onChange={update("instagram")} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Facebook</label>
              <input type="text" value={clubData.facebook} onChange={update("facebook")} className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text">Banner kanału</h2>
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-bg3 transition-colors hover:border-lime/40 hover:bg-bg3/80 cursor-pointer">
          <div className="text-center">
            <Upload className="mx-auto mb-1 h-6 w-6 text-muted" />
            <p className="text-xs text-muted">Przeciągnij lub kliknij — 1920×480px</p>
          </div>
        </div>
      </div>

      <button onClick={onSave} disabled={isSaving} className="btn-primary w-full disabled:opacity-50">
        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" />Zapisywanie...</> : "Zapisz profil"}
      </button>
    </div>
  );
}

/* ─── Streaming Tab ──────────────────────────────── */

function StreamingTab({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [showKey, setShowKey] = useState(false);
  const [streamKey] = useState("live_rck_a8f3e2d1b9c7456e");
  const [rtmpUrl] = useState("rtmp://ingest.padelvision.tv/live");

  const [quality, setQuality] = useState("auto");
  const [latency, setLatency] = useState("normal");
  const [recording, setRecording] = useState(true);
  const [autoVOD, setAutoVOD] = useState(true);
  const [multistream, setMultistream] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`Skopiowano ${label}`, "info");
  };

  return (
    <div className="space-y-6">
      {/* RTMP Config */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <Radio className="h-4 w-4 text-lime" />
          Konfiguracja RTMP
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Serwer RTMP</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-2.5 font-mono text-sm text-text">
                {rtmpUrl}
              </div>
              <button onClick={() => copyToClipboard(rtmpUrl, "URL serwera")} className="btn-secondary p-2.5">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Klucz transmisji</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-2.5 font-mono text-sm text-text">
                {showKey ? streamKey : "••••••••••••••••••••••••"}
              </div>
              <button onClick={() => setShowKey(!showKey)} className="btn-secondary p-2.5" title={showKey ? "Ukryj" : "Pokaż"}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => copyToClipboard(streamKey, "klucz")} className="btn-secondary p-2.5">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted">
              Nigdy nie udostępniaj klucza — pozwala na nadawanie na Twoim kanale
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-orange hover:underline">
            <RefreshCw className="h-3 w-3" />
            Wygeneruj nowy klucz
          </button>
        </div>
      </div>

      {/* Quality & Latency */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <Wifi className="h-4 w-4 text-lime" />
          Jakość i opóźnienie
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-xs text-muted">Profil jakości wyjściowej</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "720p", label: "720p", desc: "HD — stabilne" },
              { key: "1080p", label: "1080p", desc: "Full HD — zalecane" },
              { key: "auto", label: "Auto", desc: "Adaptive bitrate" },
            ].map((q) => (
              <button
                key={q.key}
                onClick={() => setQuality(q.key)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  quality === q.key
                    ? "border-lime bg-lime/10"
                    : "border-border bg-bg3 hover:border-border/80"
                )}
              >
                <p className={cn("text-sm font-semibold", quality === q.key ? "text-lime" : "text-text")}>{q.label}</p>
                <p className="text-[10px] text-muted">{q.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs text-muted">Tryb opóźnienia</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "low", label: "Niskie", desc: "~2-3s — interaktywne", icon: Zap },
              { key: "normal", label: "Normalne", desc: "~5-8s — zalecane", icon: Wifi },
              { key: "high", label: "Wysokie", desc: "~15-20s — stabilne", icon: Shield },
            ].map((l) => {
              const Icon = l.icon;
              return (
                <button
                  key={l.key}
                  onClick={() => setLatency(l.key)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-all",
                    latency === l.key
                      ? "border-lime bg-lime/10"
                      : "border-border bg-bg3 hover:border-border/80"
                  )}
                >
                  <Icon className={cn("mb-1 h-4 w-4", latency === l.key ? "text-lime" : "text-muted")} />
                  <p className={cn("text-sm font-semibold", latency === l.key ? "text-lime" : "text-text")}>{l.label}</p>
                  <p className="text-[10px] text-muted">{l.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recording & VOD */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <Settings className="h-4 w-4 text-lime" />
          Nagrywanie i VOD
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <div>
              <p className="text-sm text-text">Automatyczne nagrywanie</p>
              <p className="text-[10px] text-muted">Każda transmisja jest automatycznie nagrywana</p>
            </div>
            <Toggle enabled={recording} onChange={() => setRecording(!recording)} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <div>
              <p className="text-sm text-text">Automatyczny VOD</p>
              <p className="text-[10px] text-muted">Po zakończeniu streamu publikuj VOD automatycznie</p>
            </div>
            <Toggle enabled={autoVOD} onChange={() => setAutoVOD(!autoVOD)} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <div>
              <p className="text-sm text-text">Multistream</p>
              <p className="text-[10px] text-muted">Nadawaj jednocześnie na YouTube i Facebook</p>
            </div>
            <Toggle enabled={multistream} onChange={() => setMultistream(!multistream)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chat Tab ───────────────────────────────────── */

function ChatTab({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [modLevel, setModLevel] = useState(1); // 0=off, 1=lenient, 2=standard, 3=strict
  const [slowMode, setSlowMode] = useState(0); // seconds
  const [subsOnly, setSubsOnly] = useState(false);
  const [emoteOnly, setEmoteOnly] = useState(false);
  const [linksBlocked, setLinksBlocked] = useState(true);
  const [bannedWords, setBannedWords] = useState("spam, scam, hack");
  const [welcomeMsg, setWelcomeMsg] = useState("Witaj na czacie Racket Club! 🏸 Bądź miły i wspieraj graczy.");

  const modLevels = [
    { label: "Wyłączona", desc: "Brak automatycznej moderacji", color: "text-muted" },
    { label: "Łagodna", desc: "Spam i powtórzenia", color: "text-emerald-400" },
    { label: "Standardowa", desc: "Spam + wulgaryzmy + caps", color: "text-lime" },
    { label: "Ścisła", desc: "Wszystko + podejrzane linki", color: "text-orange" },
  ];

  const slowModeOptions = [0, 3, 5, 10, 30, 60];

  return (
    <div className="space-y-6">
      {/* Auto-moderation */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <Shield className="h-4 w-4 text-lime" />
          Automatyczna moderacja
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-xs text-muted">Poziom moderacji</label>
          <div className="grid grid-cols-4 gap-2">
            {modLevels.map((level, i) => (
              <button
                key={i}
                onClick={() => setModLevel(i)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  modLevel === i ? "border-lime bg-lime/10" : "border-border bg-bg3 hover:border-border/80"
                )}
              >
                <p className={cn("text-xs font-semibold", modLevel === i ? "text-lime" : level.color)}>{level.label}</p>
                <p className="mt-0.5 text-[9px] text-muted">{level.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">Zbanowane słowa (oddzielone przecinkami)</label>
          <textarea
            rows={2}
            value={bannedWords}
            onChange={(e) => setBannedWords(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none"
            placeholder="słowo1, słowo2, słowo3"
          />
          <p className="mt-1 text-[10px] text-muted">Wiadomości zawierające te słowa zostaną automatycznie ukryte</p>
        </div>
      </div>

      {/* Chat restrictions */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <MessageSquare className="h-4 w-4 text-lime" />
          Ograniczenia czatu
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-muted">Slow mode (opóźnienie między wiadomościami)</label>
            <div className="flex flex-wrap gap-2">
              {slowModeOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlowMode(s)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    slowMode === s ? "border-lime bg-lime/10 text-lime" : "border-border bg-bg3 text-muted hover:text-text"
                  )}
                >
                  {s === 0 ? "Wyłączony" : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <div>
              <p className="text-sm text-text">Tylko subskrybenci</p>
              <p className="text-[10px] text-muted">Tylko subskrybenci mogą pisać na czacie</p>
            </div>
            <Toggle enabled={subsOnly} onChange={() => setSubsOnly(!subsOnly)} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <div>
              <p className="text-sm text-text">Tryb emotek</p>
              <p className="text-[10px] text-muted">Tylko emotki — bez tekstu</p>
            </div>
            <Toggle enabled={emoteOnly} onChange={() => setEmoteOnly(!emoteOnly)} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <div>
              <p className="text-sm text-text">Blokuj linki</p>
              <p className="text-[10px] text-muted">Automatycznie usuwaj wiadomości z linkami</p>
            </div>
            <Toggle enabled={linksBlocked} onChange={() => setLinksBlocked(!linksBlocked)} />
          </div>
        </div>
      </div>

      {/* Welcome message */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text">Wiadomość powitalna</h2>
        <textarea
          rows={2}
          value={welcomeMsg}
          onChange={(e) => setWelcomeMsg(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none"
        />
        <p className="mt-1 text-[10px] text-muted">Wyświetlana każdemu widzowi po dołączeniu do czatu</p>
      </div>

      <button onClick={() => toast("Ustawienia czatu zapisane", "success")} className="btn-primary w-full">
        Zapisz ustawienia czatu
      </button>
    </div>
  );
}

/* ─── Notifications Tab ──────────────────────────── */

function NotificationsTab({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [notifs, setNotifs] = useState({
    streamStart: { email: true, push: true },
    streamEnd: { email: false, push: false },
    newSub: { email: true, push: true },
    donation: { email: false, push: true },
    chatReport: { email: true, push: true },
    weeklyDigest: { email: true, push: false },
    payoutComplete: { email: true, push: true },
    tournamentSignup: { email: true, push: true },
  });

  const toggleNotif = (key: string, channel: "email" | "push") => {
    setNotifs((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  };

  const items = [
    { key: "streamStart", label: "Start transmisji", desc: "Powiadomienie o rozpoczęciu streamu", icon: Radio },
    { key: "streamEnd", label: "Koniec transmisji", desc: "Raport po zakończeniu streamu", icon: Clock },
    { key: "newSub", label: "Nowa subskrypcja", desc: "Gdy ktoś subskrybuje kanał", icon: Users },
    { key: "donation", label: "Donacja (Piłki)", desc: "Gdy ktoś wyśle Piłki", icon: Zap },
    { key: "chatReport", label: "Zgłoszenie czatu", desc: "Gdy widz zgłosi wiadomość", icon: AlertTriangle },
    { key: "weeklyDigest", label: "Tygodniowe podsumowanie", desc: "Podsumowanie statystyk co tydzień", icon: Calendar },
    { key: "payoutComplete", label: "Wypłata zrealizowana", desc: "Gdy wypłata trafi na konto", icon: CreditCard },
    { key: "tournamentSignup", label: "Zapisy na turniej", desc: "Gdy ktoś zapisze się na turniej", icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
            <Bell className="h-4 w-4 text-lime" />
            Preferencje powiadomień
          </h2>
          <div className="flex gap-6 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <span className="w-12 text-center">Email</span>
            <span className="w-12 text-center">Push</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {items.map((item) => {
            const Icon = item.icon;
            const state = (notifs as any)[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-sm text-text">{item.label}</p>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex w-12 justify-center">
                    <Toggle enabled={state.email} onChange={() => toggleNotif(item.key, "email")} size="sm" />
                  </div>
                  <div className="flex w-12 justify-center">
                    <Toggle enabled={state.push} onChange={() => toggleNotif(item.key, "push")} size="sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => toast("Preferencje powiadomień zapisane", "success")} className="btn-primary w-full">
        Zapisz preferencje
      </button>
    </div>
  );
}

/* ─── Integrations Tab ───────────────────────────── */

function IntegrationsTab() {
  const playtomic = usePlaytomicStore();
  const [ptCredentials, setPtCredentials] = useState({ clientId: "", clientSecret: "", tenantId: "" });
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  interface SocialPlatform { connected: boolean; accountName: string; enabled: boolean; }
  const SOCIAL_STORAGE_KEY = "padelvision-social-integrations";

  const [socialPlatforms, setSocialPlatforms] = useState<Record<string, SocialPlatform>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SOCIAL_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      facebook: { connected: false, accountName: "", enabled: true },
      instagram: { connected: false, accountName: "", enabled: true },
      tiktok: { connected: false, accountName: "", enabled: true },
      youtube: { connected: false, accountName: "", enabled: true },
    };
  });

  useEffect(() => {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(socialPlatforms));
  }, [socialPlatforms]);

  useEffect(() => { playtomic.fetchStatus(CLUB_ID); }, []);

  const toggleSocialConnect = (platform: string) => {
    setSocialPlatforms((prev) => {
      const current = prev[platform];
      if (current.connected) return { ...prev, [platform]: { connected: false, accountName: "", enabled: true } };
      const mockNames: Record<string, string> = { facebook: "Racket Club Katowice", instagram: "@racketclub_ktw", tiktok: "@racketclub.padel", youtube: "Racket Club TV" };
      return { ...prev, [platform]: { connected: true, accountName: mockNames[platform] || platform, enabled: true } };
    });
  };

  const toggleSocialEnabled = (platform: string) => {
    setSocialPlatforms((prev) => ({ ...prev, [platform]: { ...prev[platform], enabled: !prev[platform].enabled } }));
  };

  const handlePlaytomicConnect = async () => {
    if (!ptCredentials.clientId || !ptCredentials.clientSecret || !ptCredentials.tenantId) return;
    const success = await playtomic.connect(CLUB_ID, ptCredentials);
    if (success) setPtCredentials({ clientId: "", clientSecret: "", tenantId: "" });
  };

  const socialItems = [
    { key: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", desc: "Udostępniaj highlights na profilu lub stronie" },
    { key: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F", desc: "Publikuj highlights jako Reels" },
    { key: "tiktok", name: "TikTok", icon: Music, color: "#ffffff", desc: "Publikuj highlights jako filmy" },
    { key: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000", desc: "Upload highlights jako Shorts" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Playtomic */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D26A]/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#00D26A]" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Playtomic</h2>
              <p className="text-[10px] text-muted">Importuj graczy i rezerwacje</p>
            </div>
          </div>
          {playtomic.status.connected && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Połączono
            </span>
          )}
        </div>
        <div className="p-6">
          {!playtomic.status.connected ? (
            <div>
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-bg3/50 p-3">
                <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted" />
                <div>
                  <button onClick={() => setShowHelp(!showHelp)} className="text-xs font-medium text-lime hover:underline">
                    Gdzie znaleźć dane do połączenia?
                  </button>
                  {showHelp && (
                    <div className="mt-2 space-y-1 text-[11px] text-muted">
                      <p>1. Zaloguj się do <strong>Playtomic Manager</strong></p>
                      <p>2. Przejdź do <strong>Settings → Developer Tools</strong></p>
                      <p>3. Wygeneruj nowe API credentials</p>
                      <p>4. Skopiuj <strong>Client ID</strong>, <strong>Client Secret</strong></p>
                      <p>5. Twój <strong>Tenant ID</strong> to UUID klubu z URL Playtomic</p>
                      <a href="https://helpmanager.playtomic.com/hc/en-gb/articles/38836515997073" target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-lime hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        Dokumentacja Playtomic API
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Client ID</label>
                  <input type="text" value={ptCredentials.clientId} onChange={(e) => setPtCredentials((p) => ({ ...p, clientId: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:border-lime focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Client Secret</label>
                  <input type="password" value={ptCredentials.clientSecret} onChange={(e) => setPtCredentials((p) => ({ ...p, clientSecret: e.target.value }))} placeholder="••••••••••••••••" className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:border-lime focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Tenant ID</label>
                  <input type="text" value={ptCredentials.tenantId} onChange={(e) => setPtCredentials((p) => ({ ...p, tenantId: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-sm text-text placeholder:text-muted/50 focus:border-lime focus:outline-none" />
                </div>
              </div>
              {playtomic.error && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {playtomic.error}
                </div>
              )}
              <button onClick={handlePlaytomicConnect} disabled={playtomic.isLoading || !ptCredentials.clientId || !ptCredentials.clientSecret || !ptCredentials.tenantId} className="btn-primary mt-4 flex items-center gap-2 text-sm disabled:opacity-50">
                {playtomic.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Połącz z Playtomic
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-bg3 p-3">
                  <p className="text-[10px] text-muted">Tenant ID</p>
                  <p className="mt-0.5 font-mono text-xs text-text">{playtomic.status.tenantId ? `${playtomic.status.tenantId.slice(0, 8)}...${playtomic.status.tenantId.slice(-4)}` : "—"}</p>
                </div>
                <div className="rounded-lg bg-bg3 p-3">
                  <p className="text-[10px] text-muted">Ostatnia synchronizacja</p>
                  <p className="mt-0.5 text-xs text-text">{playtomic.status.lastSyncAt ? new Date(playtomic.status.lastSyncAt).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Nigdy"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => playtomic.sync(CLUB_ID)} disabled={playtomic.isLoading} className="btn-secondary flex items-center gap-1.5 text-xs">
                  {playtomic.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Synchronizuj teraz
                </button>
                {!confirmDisconnect ? (
                  <button onClick={() => setConfirmDisconnect(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted hover:bg-red-500/10 hover:text-red-400">
                    <Unlink className="h-3.5 w-3.5" />
                    Rozłącz
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Na pewno?</span>
                    <button onClick={async () => { await playtomic.disconnect(CLUB_ID); setConfirmDisconnect(false); }} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30">Tak, rozłącz</button>
                    <button onClick={() => setConfirmDisconnect(false)} className="text-xs text-muted hover:text-text">Anuluj</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Media */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime/10">
            <Share2 className="h-5 w-5 text-lime" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text">Integracje social media</h2>
            <p className="text-[10px] text-muted">Podłącz konta aby udostępniać highlights</p>
          </div>
        </div>
        <div className="space-y-3 p-6">
          {socialItems.map((platform) => {
            const state = socialPlatforms[platform.key];
            const Icon = platform.icon;
            return (
              <div key={platform.key} className={cn("flex items-center gap-4 rounded-lg border p-4 transition-all", state?.connected ? "border-border bg-bg3/30" : "border-border/50 bg-bg3/10")}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${platform.color}20` }}>
                  <Icon className="h-5 w-5" style={{ color: platform.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text">{platform.name}</p>
                    {state?.connected && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Połączono
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{state?.connected ? state.accountName : platform.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {state?.connected && <Toggle enabled={state.enabled} onChange={() => toggleSocialEnabled(platform.key)} size="sm" />}
                  <button onClick={() => toggleSocialConnect(platform.key)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", state?.connected ? "text-muted hover:bg-red-500/10 hover:text-red-400" : "bg-bg4 text-text hover:bg-lime/10 hover:text-lime")}>
                    {state?.connected ? "Odłącz" : "Podłącz"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Plan Tab ───────────────────────────────────── */

function PlanTab({ toast }: { toast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const PLANS = [
    {
      id: "starter",
      name: "Starter",
      price: "0 zł/mies.",
      features: ["3 transmisje/mies.", "720p max", "7 dni VOD", "Podstawowy czat"],
      detailedFeatures: ["3 transmisje miesięcznie", "Jakość do 720p", "VOD przechowywane 7 dni", "Podstawowy czat"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "149 zł/mies.",
      features: ["Nielimitowane transmisje", "1080p60", "VOD bez limitu", "Multistream", "Custom branding", "API access"],
      detailedFeatures: ["Nielimitowane transmisje", "6 jakości transkodowania (do 1080p60)", "VOD bez limitu czasu", "Multistream (YouTube + FB)", "Priorytetowe wsparcie", "Custom overlay i branding", "API access"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "499 zł/mies.",
      features: ["Wszystko z Pro", "4K transcoding", "Dedykowany serwer", "SLA 99.9%", "Priorytetowe wsparcie 24/7", "White-label"],
      detailedFeatures: ["Wszystko z planu Pro", "4K transcoding", "Dedykowany serwer", "SLA 99.9%", "Priorytetowe wsparcie 24/7", "White-label rozwiązanie"],
    },
  ];

  const [currentPlanId, setCurrentPlanId] = useState("pro");
  const [renewDate, setRenewDate] = useState("2026-04-13");
  const currentPlan = PLANS.find((p) => p.id === currentPlanId)!;

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [planChanging, setPlanChanging] = useState(false);

  const handlePlanChange = async (planId: string) => {
    if (planId === currentPlanId) return;
    setPlanChanging(true);
    setSelectedPlan(planId);
    await new Promise((r) => setTimeout(r, 1500));
    setCurrentPlanId(planId);
    // New billing cycle starts today, renews in 30 days
    const now = new Date();
    const renew = new Date(now);
    renew.setDate(renew.getDate() + 30);
    setRenewDate(renew.toISOString().split("T")[0]);
    setPlanChanging(false);
    setShowPlanModal(false);
    setSelectedPlan(null);
    const plan = PLANS.find((p) => p.id === planId);
    toast(`Plan zmieniony na ${plan?.name}`, "success");
  };

  const usage = [
    { label: "Transmisje w tym miesiącu", value: "12", max: "∞", pct: 0 },
    { label: "Miejsce na VOD", value: "48.2 GB", max: "500 GB", pct: 9.6 },
    { label: "Bandwidth", value: "1.2 TB", max: "5 TB", pct: 24 },
    { label: "Klipy utworzone", value: "89", max: "500", pct: 17.8 },
  ];

  /* ── Payment method state ── */
  const [editingCard, setEditingCard] = useState(false);
  const [cardData, setCardData] = useState({
    number: "**** **** **** 4242",
    expiry: "12/2027",
    brand: "Visa",
  });
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvc: "" });
  const [cardSaving, setCardSaving] = useState(false);

  const handleCardSave = async () => {
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvc) return;
    setCardSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    const last4 = cardForm.number.replace(/\s/g, "").slice(-4);
    const brand = cardForm.number.startsWith("4") ? "Visa" : cardForm.number.startsWith("5") ? "Mastercard" : "Karta";
    setCardData({ number: `**** **** **** ${last4}`, expiry: cardForm.expiry, brand });
    setCardForm({ number: "", expiry: "", cvc: "" });
    setEditingCard(false);
    setCardSaving(false);
    toast("Metoda płatności zaktualizowana", "success");
  };

  /* ── Billing address state ── */
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressData, setAddressData] = useState({
    company: "Racket Club Sp. z o.o.",
    street: "ul. Padlowa 15",
    city: "40-001 Katowice",
    nip: "PL6340012345",
  });
  const [addressForm, setAddressForm] = useState({ ...addressData });
  const [addressSaving, setAddressSaving] = useState(false);

  const handleAddressSave = async () => {
    if (!addressForm.company || !addressForm.street || !addressForm.city) return;
    setAddressSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setAddressData({ ...addressForm });
    setEditingAddress(false);
    setAddressSaving(false);
    toast("Adres rozliczeniowy zaktualizowany", "success");
  };

  const handleAddressCancel = () => {
    setAddressForm({ ...addressData });
    setEditingAddress(false);
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-lime/20 bg-lime/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime/20">
                <Crown className="h-5 w-5 text-lime" />
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
                  Plan {currentPlan.name}
                  <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-bold text-black">AKTYWNY</span>
                </h2>
                <p className="text-xs text-muted">{currentPlan.price}{currentPlanId !== "starter" ? ` • Odnowienie: ${renewDate}` : ""}</p>
              </div>
            </div>
            <button onClick={() => setShowPlanModal(true)} className="btn-secondary text-xs">Zmień plan</button>
          </div>
        </div>
        <div className="p-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted">Zawarte w planie</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {currentPlan.detailedFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-text">
                <CheckCircle2 className="h-3.5 w-3.5 text-lime flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <BarChart3 className="h-4 w-4 text-lime" />
          Wykorzystanie zasobów
        </h2>
        <div className="space-y-4">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-text">{u.label}</span>
                <span className="font-mono text-muted">{u.value} / {u.max}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg4">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(u.pct, 100)}%`,
                    background: u.pct > 80 ? "#ef4444" : u.pct > 50 ? "#f97316" : "#C8FF00",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
          <CreditCard className="h-4 w-4 text-lime" />
          Dane rozliczeniowe
        </h2>
        <div className="space-y-3">
          {/* ── Payment Method ── */}
          {!editingCard ? (
            <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/20">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-text">{cardData.brand} {cardData.number.slice(-9)}</p>
                  <p className="text-[10px] text-muted">Ważna do {cardData.expiry}</p>
                </div>
              </div>
              <button onClick={() => setEditingCard(true)} className="text-xs text-lime hover:underline">Zmień</button>
            </div>
          ) : (
            <div className="rounded-lg border border-lime/30 bg-bg3 p-4">
              <p className="mb-3 text-xs font-semibold text-text">Zmień metodę płatności</p>
              <div className="space-y-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted">Numer karty</label>
                  <input
                    type="text"
                    value={cardForm.number}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
                      setCardForm((p) => ({ ...p, number: formatted }));
                    }}
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-lg border border-border bg-bg4 px-3 py-2 font-mono text-sm text-text placeholder:text-muted/40 focus:border-lime focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] text-muted">Data ważności</label>
                    <input
                      type="text"
                      value={cardForm.expiry}
                      onChange={(e) => {
                        let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (raw.length > 2) raw = raw.slice(0, 2) + "/" + raw.slice(2);
                        setCardForm((p) => ({ ...p, expiry: raw }));
                      }}
                      placeholder="MM/RR"
                      className="w-full rounded-lg border border-border bg-bg4 px-3 py-2 font-mono text-sm text-text placeholder:text-muted/40 focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] text-muted">CVC</label>
                    <input
                      type="text"
                      value={cardForm.cvc}
                      onChange={(e) => setCardForm((p) => ({ ...p, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="123"
                      className="w-full rounded-lg border border-border bg-bg4 px-3 py-2 font-mono text-sm text-text placeholder:text-muted/40 focus:border-lime focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setEditingCard(false); setCardForm({ number: "", expiry: "", cvc: "" }); }}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCardSave}
                  disabled={!cardForm.number || !cardForm.expiry || !cardForm.cvc || cardSaving}
                  className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs disabled:opacity-50"
                >
                  {cardSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {cardSaving ? "Zapisywanie..." : "Zapisz kartę"}
                </button>
              </div>
              <p className="mt-2 text-[9px] text-muted">
                Dane karty są przetwarzane bezpiecznie przez Stripe. Padel Vision nie przechowuje numerów kart.
              </p>
            </div>
          )}

          {/* ── Billing Address ── */}
          {!editingAddress ? (
            <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
              <div>
                <p className="text-sm text-text">Adres rozliczeniowy</p>
                <p className="text-[10px] text-muted">{addressData.company}, {addressData.street}, {addressData.city}</p>
                {addressData.nip && <p className="text-[10px] text-muted">NIP: {addressData.nip}</p>}
              </div>
              <button onClick={() => { setAddressForm({ ...addressData }); setEditingAddress(true); }} className="text-xs text-lime hover:underline">Edytuj</button>
            </div>
          ) : (
            <div className="rounded-lg border border-lime/30 bg-bg3 p-4">
              <p className="mb-3 text-xs font-semibold text-text">Edytuj adres rozliczeniowy</p>
              <div className="space-y-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted">Nazwa firmy</label>
                  <input
                    type="text"
                    value={addressForm.company}
                    onChange={(e) => setAddressForm((p) => ({ ...p, company: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-bg4 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-muted">Ulica i numer</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-bg4 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] text-muted">Kod pocztowy i miasto</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-bg4 px-3 py-2 text-sm text-text focus:border-lime focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] text-muted">NIP</label>
                    <input
                      type="text"
                      value={addressForm.nip}
                      onChange={(e) => setAddressForm((p) => ({ ...p, nip: e.target.value }))}
                      placeholder="PL0000000000"
                      className="w-full rounded-lg border border-border bg-bg4 px-3 py-2 font-mono text-sm text-text placeholder:text-muted/40 focus:border-lime focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={handleAddressCancel} className="btn-secondary flex-1 py-2 text-xs">
                  Anuluj
                </button>
                <button
                  onClick={handleAddressSave}
                  disabled={!addressForm.company || !addressForm.street || !addressForm.city || addressSaving}
                  className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs disabled:opacity-50"
                >
                  {addressSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {addressSaving ? "Zapisywanie..." : "Zapisz adres"}
                </button>
              </div>
            </div>
          )}

          <button className="flex items-center gap-1.5 text-xs text-muted hover:text-text">
            <ExternalLink className="h-3 w-3" />
            Pobierz ostatnią fakturę (PDF)
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
          <AlertTriangle className="h-4 w-4" />
          Strefa niebezpieczna
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text">Dezaktywuj kanał</p>
              <p className="text-[10px] text-muted">Kanał będzie ukryty, ale dane zachowane</p>
            </div>
            <button className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
              Dezaktywuj
            </button>
          </div>
          <div className="h-px bg-red-500/20" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text">Usuń kanał na stałe</p>
              <p className="text-[10px] text-muted">Wszystkie dane, VOD i statystyki zostaną usunięte</p>
            </div>
            <button className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
              <Trash2 className="mr-1 inline h-3 w-3" />
              Usuń kanał
            </button>
          </div>
        </div>
      </div>

      {/* ── Plan Change Modal ── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => !planChanging && setShowPlanModal(false)}>
          <div className="mx-4 w-full max-w-3xl rounded-2xl border border-border bg-bg2 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text">Zmień plan</h2>
                <p className="text-xs text-muted">Obecny plan: <span className="text-lime font-semibold">{currentPlan.name}</span></p>
              </div>
              <button onClick={() => !planChanging && setShowPlanModal(false)} className="rounded-lg p-1.5 text-muted hover:bg-bg3 hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isSelecting = selectedPlan === plan.id && planChanging;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-xl border p-5 transition-all",
                      isCurrent ? "border-lime/50 bg-lime/5" : "border-border bg-bg3 hover:border-lime/30"
                    )}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-4 rounded-full bg-lime px-2.5 py-0.5 text-[10px] font-bold text-black">
                        OBECNY
                      </span>
                    )}
                    <h3 className="mb-1 text-sm font-bold text-text">{plan.name}</h3>
                    <p className="mb-4 text-lg font-bold text-lime">{plan.price}</p>
                    <ul className="mb-5 space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-lime" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={isCurrent || planChanging}
                      className={cn(
                        "w-full rounded-lg py-2 text-xs font-semibold transition-all",
                        isCurrent
                          ? "cursor-default bg-lime/10 text-lime/50"
                          : "btn-primary disabled:opacity-50"
                      )}
                    >
                      {isCurrent ? "Aktualny plan" : isSelecting ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Zmieniam...
                        </span>
                      ) : PLANS.indexOf(plan) > PLANS.findIndex((p) => p.id === currentPlanId) ? "Upgrade" : "Downgrade"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-center text-[10px] text-muted">
              Zmiana planu wchodzi w życie natychmiast. Różnica w cenie zostanie proporcjonalnie rozliczona.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────── */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [clubData, setClubData] = useState({
    name: "Racket Club Katowice",
    slug: "racket-club",
    city: "Katowice",
    description: "Najlepszy klub padlowy na Śląsku. 6 kortów, turnieje co tydzień.",
    courtCount: 6,
    website: "https://racketclub.pl",
    instagram: "@racketclub_ktw",
    facebook: "RacketClubKatowice",
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setClubData((prev) => ({ ...prev, [field]: e.target.value }));

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/clubs/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubData),
      });
      const data = await res.json();
      showToast(res.ok ? "Ustawienia zapisane pomyślnie" : (data.error || "Nie udało się zapisać"), res.ok ? "success" : "error");
    } catch {
      showToast("Błąd połączenia — spróbuj ponownie", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar tabs — desktop */}
      <div className="hidden w-48 flex-shrink-0 border-r border-border bg-bg2/50 p-3 md:block">
        <h1 className="mb-4 px-3 text-display text-lg">USTAWIENIA</h1>
        <nav className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-lime/10 text-lime"
                    : "text-muted hover:bg-bg3 hover:text-text"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-bg2 md:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors",
                activeTab === tab.key ? "text-lime" : "text-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
        <div className="mx-auto max-w-2xl">
          {/* Mobile title */}
          <h1 className="mb-4 text-display text-xl md:hidden">USTAWIENIA</h1>

          {activeTab === "profile" && (
            <ProfileTab clubData={clubData} update={update} onSave={handleSave} isSaving={isSaving} toast={toast} />
          )}
          {activeTab === "streaming" && <StreamingTab toast={showToast} />}
          {activeTab === "chat" && <ChatTab toast={showToast} />}
          {activeTab === "notifications" && <NotificationsTab toast={showToast} />}
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "plan" && <PlanTab toast={showToast} />}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
