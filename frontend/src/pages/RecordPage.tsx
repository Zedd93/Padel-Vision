import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  QrCode,
  Smartphone,
  Wifi,
  Upload,
  Share2,
  Clock,
  Eye,
  EyeOff,
  Camera,
  Play,
  Square,
  RotateCcw,
  Settings,
  ChevronRight,
  Users,
  Trophy,
  BarChart3,
  Scissors,
  Download,
  GraduationCap,
  Globe,
  Lock,
  Zap,
  CheckCircle2,
  Loader2,
  ScanLine,
  Radio,
} from 'lucide-react';

/* --- Types --- */

type RecordMode = 'phone' | 'qr' | null;
type RecordingState = 'idle' | 'connecting' | 'recording' | 'stopped';
type Visibility = 'private' | 'public' | 'unlisted';

/* --- Demo QR SVG --- */

function DemoQRCode() {
  return (
    <div className="relative mx-auto h-48 w-48 rounded-2xl bg-white p-3">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect x="5" y="5" width="25" height="25" rx="2" fill="#0B0C10" />
        <rect x="8" y="8" width="19" height="19" rx="1" fill="white" />
        <rect x="11" y="11" width="13" height="13" rx="1" fill="#0B0C10" />
        <rect x="70" y="5" width="25" height="25" rx="2" fill="#0B0C10" />
        <rect x="73" y="8" width="19" height="19" rx="1" fill="white" />
        <rect x="76" y="11" width="13" height="13" rx="1" fill="#0B0C10" />
        <rect x="5" y="70" width="25" height="25" rx="2" fill="#0B0C10" />
        <rect x="8" y="73" width="19" height="19" rx="1" fill="white" />
        <rect x="11" y="76" width="13" height="13" rx="1" fill="#0B0C10" />
        {[35,40,45,50,55,60].map(x => [35,40,45,50,55,60,65].map(y => (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" fill={(x+y) % 10 < 6 ? '#0B0C10' : 'white'} />
        )))}
        {[5,10,15,20,25,35,40,45,50,55,60,65,70].map(x => [35,40,45,50,55,60].map(y => (
          <rect key={`h-${x}-${y}`} x={x} y={y} width="4" height="4" fill={(x*y) % 7 < 4 ? '#0B0C10' : 'white'} />
        )))}
        {[70,75,80,85,90].map(x => [70,75,80,85,90].map(y => (
          <rect key={`br-${x}-${y}`} x={x} y={y} width="4" height="4" fill={(x+y) % 8 < 4 ? '#0B0C10' : 'white'} />
        )))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-lg bg-[#0B0C10] p-1.5">
          <Video className="h-5 w-5 text-lime" />
        </div>
      </div>
    </div>
  );
}

/* --- Recording Timer --- */

function RecordingTimer({ seconds }: { seconds: number }) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <span className="font-mono text-2xl font-bold tracking-wider text-white">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

/* --- Trainer Modal --- */

function TrainerModal({
  trainers,
  selected,
  onToggle,
  onClose,
  onSend,
}: {
  trainers: { id: string; name: string; cert: string; club: string; avatar: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  onSend: () => void;
}) {
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onSend();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg2 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/20">
            <GraduationCap className="h-5 w-5 text-lime" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Udostępnij trenerowi</h3>
            <p className="text-xs text-muted">Wybierz trenerów, którym chcesz wysłać nagranie</p>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          {trainers.map((t) => {
            const isSelected = selected.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => onToggle(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-lime bg-lime/10'
                    : 'border-border bg-bg3 hover:bg-bg4'
                }`}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg4 text-xs font-bold text-lime">
                  {t.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{t.name}</p>
                  <p className="text-[10px] text-muted">{t.cert} · {t.club}</p>
                </div>
                {isSelected && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-lime" />}
              </button>
            );
          })}
        </div>

        <p className="mb-4 text-[10px] text-muted">
          Trener otrzyma powiadomienie z linkiem do nagrania. Będzie mógł dodać komentarze i adnotacje.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-bg3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg4"
          >
            Anuluj
          </button>
          <button
            onClick={handleSend}
            disabled={selected.length === 0 || sending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime/90 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Wyślij ({selected.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Share Modal --- */

function ShareModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('https://padelvision.tv/vod/abc123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg2 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-sm font-semibold text-text">Udostępnij nagranie</h3>

        <div className="space-y-2">
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-3 rounded-xl bg-bg3 px-4 py-3 text-left transition-colors hover:bg-bg4"
          >
            {copied ? <CheckCircle2 className="h-5 w-5 text-lime" /> : <Share2 className="h-5 w-5 text-muted" />}
            <span className="text-sm text-text">{copied ? 'Skopiowano!' : 'Kopiuj link'}</span>
          </button>

          {[
            { name: 'Facebook', color: 'bg-[#1877F2]', href: 'https://www.facebook.com/sharer/sharer.php?u=' },
            { name: 'X (Twitter)', color: 'bg-black', href: 'https://twitter.com/intent/tweet?url=' },
            { name: 'Instagram (Relacja)', color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]', href: 'https://www.instagram.com/create/story/' },
            { name: 'TikTok', color: 'bg-black', href: 'https://www.tiktok.com/' },
          ].map((social) => (
            <a
              key={social.name}
              href={`${social.href}${encodeURIComponent('https://padelvision.tv/vod/abc123')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-xl bg-bg3 px-4 py-3 text-left transition-colors hover:bg-bg4"
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded ${social.color}`}>
                <span className="text-[8px] font-bold text-white">{social.name[0]}</span>
              </div>
              <span className="text-sm text-text">{social.name}</span>
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-border bg-bg3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg4"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
}

/* --- Toast --- */

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) {
  const colors = {
    success: 'border-lime/30 bg-lime/10 text-lime',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  };
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-pulse">
      <div className={`rounded-xl border px-5 py-3 text-sm font-medium shadow-xl backdrop-blur-md ${colors[type]}`}>
        {type === 'success' && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
        {msg}
      </div>
    </div>
  );
}

/* --- Main Page --- */

export default function RecordPage() {
  const [mode, setMode] = useState<RecordMode>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [autoScore, setAutoScore] = useState(true);
  const [quality, setQuality] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [shareToTrainer, setShareToTrainer] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TRAINERS = [
    { id: '1', name: 'Marcin Zawadzki', cert: 'WPT Coach Level 3', club: 'Racket Club Katowice', avatar: 'MZ' },
    { id: '2', name: 'Agnieszka Kowal', cert: 'FIP Trainer', club: 'Padel Kraków', avatar: 'AK' },
    { id: '3', name: 'Tomasz Bielecki', cert: 'WPT Coach Level 2', club: 'Smash Arena Warszawa', avatar: 'TB' },
    { id: '4', name: 'Paweł Górski', cert: 'FIP Trainer Level 1', club: 'Viva Padel Poznań', avatar: 'PG' },
  ];

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 5400) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => { stopTimer(); };
  }, [stopTimer]);

  const handleStartRecording = () => {
    setRecordingState('connecting');
    setTimeout(() => {
      setRecordingState('recording');
      startTimer();
    }, 2000);
  };

  const handleStopRecording = () => {
    setRecordingState('stopped');
    stopTimer();
    showToast('Nagranie zapisane na Twoim profilu', 'success');
  };

  const handleReset = () => {
    setRecordingState('idle');
    setRecordingSeconds(0);
    stopTimer();
    setMode(null);
  };

  const toggleTrainer = (id: string) => {
    setSelectedTrainers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  /* --- Mode Selection View --- */

  if (!mode) {
    return (
      <div className="min-h-screen bg-bg px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/20">
              <Video className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-display text-3xl text-text">NAGRAJ SWÓJ MECZ</h1>
            <p className="mt-2 text-sm text-muted">
              Nagrywaj i streamuj swoje mecze bezpośrednio z telefonu lub użyj kamer na korcie
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setMode('phone')}
              className="glass-card group relative overflow-hidden p-6 text-left transition-all hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-600/10 transition-transform group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-600/20">
                  <Smartphone className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="mb-2 text-display text-xl text-text">Nagraj telefonem</h2>
                <p className="mb-4 text-sm text-muted">
                  Użyj kamery swojego telefonu aby nagrać mecz lub streamować go na żywo. Ustaw telefon na statywie i graj!
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Camera className="h-3.5 w-3.5 text-lime" />
                    Nagrywaj w HD/4K
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Wifi className="h-3.5 w-3.5 text-lime" />
                    Streamuj na żywo lub nagrywaj prywatnie
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Upload className="h-3.5 w-3.5 text-lime" />
                    Automatyczny zapis na Twój profil VOD
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-red-400">
                  Rozpocznij <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('qr')}
              className="glass-card group relative overflow-hidden p-6 text-left transition-all hover:border-lime/50 hover:shadow-lg hover:shadow-lime/10"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-lime/10 transition-transform group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-lime/20">
                  <QrCode className="h-7 w-7 text-lime" />
                </div>
                <h2 className="mb-2 text-display text-xl text-text">Skanuj kod QR na korcie</h2>
                <p className="mb-4 text-sm text-muted">
                  Zeskanuj kod QR przy wejściu na kort — kamera na korcie automatycznie rozpocznie nagrywanie na Twój profil.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <ScanLine className="h-3.5 w-3.5 text-lime" />
                    Jedno skanowanie — gra się zaczyna
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Zap className="h-3.5 w-3.5 text-lime" />
                    Profesjonalna kamera na korcie
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <BarChart3 className="h-3.5 w-3.5 text-lime" />
                    Automatyczne śledzenie wyniku (AI)
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-lime">
                  Skanuj kod <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>

          <div className="mb-8">
            <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-muted">
              Co możesz zrobić z nagraniem
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { icon: GraduationCap, label: 'Udostępnij trenerowi', desc: 'Wyślij do zweryfikowanego trenera' },
                { icon: Scissors, label: 'Twórz klipy', desc: 'Wycinaj najlepsze akcje' },
                { icon: BarChart3, label: 'Analiza AI', desc: 'Statystyki i heatmapa' },
                { icon: Share2, label: 'Udostępnij', desc: 'Social media i link' },
                { icon: Trophy, label: 'Dodaj do turnieju', desc: 'Przypisz do meczu turniejowego' },
                { icon: Users, label: 'Oznacz graczy', desc: 'Taguj partnerów i rywali' },
                { icon: Download, label: 'Pobierz', desc: 'Eksportuj w HD na dysk' },
                { icon: Eye, label: 'Multi-kamera', desc: 'Łącz widoki z wielu kamer' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="glass-card flex flex-col items-center p-4 text-center">
                  <Icon className="mb-2 h-5 w-5 text-lime" />
                  <span className="text-xs font-semibold text-text">{label}</span>
                  <span className="mt-0.5 text-[10px] text-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
              <Clock className="h-4 w-4 text-muted" />
              Ostatnie nagrania
            </h3>
            <div className="space-y-3">
              {[
                { title: 'Mecz sparingowy vs. Nowak/Zając', date: '14 mar 2026', duration: '1:24:07', views: 23, visibility: 'private' as const },
                { title: 'Trening serwisu — Racket Club', date: '12 mar 2026', duration: '0:45:30', views: 0, visibility: 'private' as const },
                { title: 'Liga klubowa — runda 3', date: '10 mar 2026', duration: '1:12:45', views: 187, visibility: 'public' as const },
              ].map((rec) => (
                <div key={rec.title} className="flex items-center gap-4 rounded-xl bg-bg3 p-3 transition-colors hover:bg-bg4">
                  <div className="flex h-12 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-bg4">
                    <Video className="h-5 w-5 text-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{rec.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted">
                      <span>{rec.date}</span>
                      <span>{rec.duration}</span>
                      <span className="flex items-center gap-1">
                        {rec.visibility === 'private' ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                        {rec.visibility === 'private' ? 'Prywatne' : 'Publiczne'}
                      </span>
                      {rec.views > 0 && <span>{rec.views} wyświetleń</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowTrainerModal(true); }}
                      className="rounded-lg bg-lime/10 px-3 py-1.5 text-xs font-medium text-lime transition-colors hover:bg-lime/20"
                    >
                      <GraduationCap className="mr-1 inline h-3 w-3" />
                      Trener
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
                      className="rounded-lg bg-bg4 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
                    >
                      <Share2 className="mr-1 inline h-3 w-3" />
                      Udostępnij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showTrainerModal && (
          <TrainerModal trainers={TRAINERS} selected={selectedTrainers} onToggle={toggleTrainer} onClose={() => setShowTrainerModal(false)} onSend={() => { setShowTrainerModal(false); setSelectedTrainers([]); showToast('Nagranie wysłane do trenera', 'success'); }} />
        )}
        {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </div>
    );
  }

  /* --- Phone Recording View --- */

  if (mode === 'phone') {
    return (
      <div className="min-h-screen bg-bg px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <button onClick={handleReset} className="mb-6 flex items-center gap-2 text-sm text-muted transition-colors hover:text-text">
            <RotateCcw className="h-3.5 w-3.5" />
            Wróć do wyboru
          </button>

          <div className="glass-card mb-6 overflow-hidden">
            <div className="relative flex aspect-video items-center justify-center bg-black">
              {recordingState === 'idle' && (
                <div className="text-center">
                  <Camera className="mx-auto mb-3 h-12 w-12 text-muted/50" />
                  <p className="text-sm text-muted">Podgląd kamery pojawi się tutaj</p>
                  <p className="mt-1 text-xs text-muted/70">Ustaw telefon w pozycji {orientation === 'landscape' ? 'poziomej' : 'pionowej'}</p>
                </div>
              )}
              {recordingState === 'connecting' && (
                <div className="text-center">
                  <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin text-red-500" />
                  <p className="text-sm text-muted">Łączenie z kamerą...</p>
                </div>
              )}
              {recordingState === 'recording' && (
                <>
                  <div className="h-full w-full bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                    <div className="flex h-full items-center justify-center">
                      <span className="text-sm text-white/30">[ Podgląd z kamery ]</span>
                    </div>
                  </div>
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-red-400">REC</span>
                    <RecordingTimer seconds={recordingSeconds} />
                  </div>
                  <div className="absolute right-4 top-4 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-lime backdrop-blur-sm">
                    {quality}
                  </div>
                  {visibility === 'public' && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-red-600/90 px-3 py-1 backdrop-blur-sm">
                      <Radio className="h-3 w-3 text-white" />
                      <span className="text-xs font-bold text-white">NA ŻYWO</span>
                    </div>
                  )}
                </>
              )}
              {recordingState === 'stopped' && (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-lime" />
                  <p className="text-sm font-semibold text-text">Nagranie zapisane!</p>
                  <p className="mt-1 text-xs text-muted">Czas: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 border-t border-border bg-bg2 p-4">
              {recordingState === 'idle' && (
                <button onClick={handleStartRecording} className="flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-500">
                  <Play className="h-5 w-5" />
                  {visibility === 'public' ? 'Rozpocznij stream' : 'Rozpocznij nagrywanie'}
                </button>
              )}
              {recordingState === 'connecting' && (
                <button disabled className="flex items-center gap-2 rounded-xl bg-red-600/50 px-8 py-3 font-semibold text-white/50">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Łączenie...
                </button>
              )}
              {recordingState === 'recording' && (
                <button onClick={handleStopRecording} className="flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-500">
                  <Square className="h-5 w-5" />
                  Zatrzymaj
                </button>
              )}
              {recordingState === 'stopped' && (
                <div className="flex items-center gap-3">
                  <button onClick={handleReset} className="flex items-center gap-2 rounded-xl border border-border bg-bg3 px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-bg4">
                    <RotateCcw className="h-4 w-4" />
                    Nowe nagranie
                  </button>
                  <button onClick={() => setShowTrainerModal(true)} className="flex items-center gap-2 rounded-xl bg-lime/20 px-6 py-3 text-sm font-medium text-lime transition-colors hover:bg-lime/30">
                    <GraduationCap className="h-4 w-4" />
                    Udostępnij trenerowi
                  </button>
                  <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 rounded-xl bg-bg3 px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-bg4">
                    <Share2 className="h-4 w-4" />
                    Udostępnij
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="glass-card p-6">
            <button onClick={() => setShowSettings(!showSettings)} className="flex w-full items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
                <Settings className="h-4 w-4 text-muted" />
                Ustawienia nagrywania
              </h3>
              <ChevronRight className={`h-4 w-4 text-muted transition-transform ${showSettings ? 'rotate-90' : ''}`} />
            </button>

            {showSettings && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">Widoczność</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'private' as const, label: 'Prywatne', icon: Lock, desc: 'Tylko Ty' },
                      { value: 'public' as const, label: 'Stream na żywo', icon: Globe, desc: 'Widoczne dla wszystkich' },
                      { value: 'unlisted' as const, label: 'Ukryte', icon: EyeOff, desc: 'Tylko z linkiem' },
                    ]).map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        onClick={() => setVisibility(value)}
                        className={`flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                          visibility === value
                            ? 'border-lime bg-lime/10 text-lime'
                            : 'border-border bg-bg3 text-muted hover:border-border hover:bg-bg4'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-semibold">{label}</span>
                        <span className="text-[9px] opacity-70">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">Jakość nagrania</label>
                  <div className="flex gap-2">
                    {(['720p', '1080p', '4K'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                          quality === q
                            ? 'border-lime bg-lime/10 text-lime'
                            : 'border-border bg-bg3 text-muted hover:bg-bg4'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">Orientacja</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'landscape' as const, label: 'Pozioma (zalecane)' },
                      { value: 'portrait' as const, label: 'Pionowa' },
                    ]).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setOrientation(value)}
                        className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                          orientation === value
                            ? 'border-lime bg-lime/10 text-lime'
                            : 'border-border bg-bg3 text-muted hover:bg-bg4'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-bg3 p-3">
                  <div>
                    <p className="text-xs font-semibold text-text">Automatyczne śledzenie wyniku (AI)</p>
                    <p className="text-[10px] text-muted">AI rozpoznaje wynik na podstawie obrazu</p>
                  </div>
                  <button
                    onClick={() => setAutoScore(!autoScore)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${autoScore ? 'bg-lime' : 'bg-bg4'}`}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${autoScore ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-bg3 p-3">
                  <div>
                    <p className="text-xs font-semibold text-text">Auto-udostępnij trenerowi po meczu</p>
                    <p className="text-[10px] text-muted">Nagranie trafi automatycznie do Twojego trenera</p>
                  </div>
                  <button
                    onClick={() => setShareToTrainer(!shareToTrainer)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${shareToTrainer ? 'bg-lime' : 'bg-bg4'}`}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${shareToTrainer ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showTrainerModal && (
          <TrainerModal trainers={TRAINERS} selected={selectedTrainers} onToggle={toggleTrainer} onClose={() => setShowTrainerModal(false)} onSend={() => { setShowTrainerModal(false); setSelectedTrainers([]); showToast('Nagranie wysłane do trenera', 'success'); }} />
        )}
        {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </div>
    );
  }

  /* --- QR Scan View --- */

  if (mode === 'qr') {
    return (
      <div className="min-h-screen bg-bg px-4 py-8">
        <div className="mx-auto max-w-lg">
          <button onClick={handleReset} className="mb-6 flex items-center gap-2 text-sm text-muted transition-colors hover:text-text">
            <RotateCcw className="h-3.5 w-3.5" />
            Wróć do wyboru
          </button>

          <div className="glass-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime/20">
              <QrCode className="h-7 w-7 text-lime" />
            </div>
            <h2 className="text-display text-2xl text-text">Skanuj kod QR</h2>
            <p className="mt-2 text-sm text-muted">
              Znajdź kod QR na klatce przy wejściu na kort i zeskanuj go aparatem telefonu
            </p>

            <div className="my-8">
              <DemoQRCode />
              <p className="mt-3 text-[10px] text-muted">
                Przykładowy kod QR — na korcie znajdziesz prawdziwy
              </p>
            </div>

            <div className="mb-6 space-y-3 text-left">
              {[
                { step: 1, text: 'Podejdź do klatki kortu i znajdź naklejkę Padel Vision z kodem QR' },
                { step: 2, text: 'Zeskanuj kod aparatem telefonu lub przyciskiem poniżej' },
                { step: 3, text: 'Kamera na korcie automatycznie zacznie nagrywać na Twój profil' },
                { step: 4, text: 'Po meczu nagranie znajdziesz w swoich VODach' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3 rounded-xl bg-bg3 p-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lime/20 text-xs font-bold text-lime">
                    {step}
                  </div>
                  <p className="text-xs text-muted">{text}</p>
                </div>
              ))}
            </div>

            {recordingState === 'idle' && (
              <button
                onClick={() => {
                  setRecordingState('connecting');
                  setTimeout(() => {
                    setRecordingState('recording');
                    startTimer();
                    showToast('Połączono z kamerą na korcie!', 'success');
                  }, 2500);
                }}
                className="w-full rounded-xl bg-lime px-6 py-3 font-semibold text-black transition-colors hover:bg-lime/90"
              >
                <ScanLine className="mr-2 inline h-5 w-5" />
                Otwórz skaner QR
              </button>
            )}

            {recordingState === 'connecting' && (
              <div className="mt-6 rounded-xl bg-bg3 p-4">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-lime" />
                <p className="text-sm text-muted">Łączenie z kamerą na korcie...</p>
              </div>
            )}

            {recordingState === 'recording' && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-lime/30 bg-lime/10 p-4">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-lime" />
                  <p className="text-sm font-semibold text-lime">Nagrywanie rozpoczęte!</p>
                  <p className="mt-1 text-xs text-muted">
                    Kamera na Kort 1 — Racket Club Katowice nagrywana na Twój profil. Możesz teraz grać!
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    REC · <RecordingTimer seconds={recordingSeconds} />
                  </div>
                </div>
                <button onClick={handleStopRecording} className="w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-500">
                  <Square className="mr-2 inline h-4 w-4" />
                  Zakończ nagrywanie
                </button>
              </div>
            )}

            {recordingState === 'stopped' && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-lime/30 bg-lime/10 p-4">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-lime" />
                  <p className="text-sm font-semibold text-lime">Nagranie zapisane!</p>
                  <p className="mt-1 text-xs text-muted">
                    Czas nagrania: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')} · Kamera na korcie · Racket Club Katowice
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowTrainerModal(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime/20 px-4 py-3 text-sm font-medium text-lime transition-colors hover:bg-lime/30">
                    <GraduationCap className="h-4 w-4" />
                    Udostępnij trenerowi
                  </button>
                  <button onClick={() => setShowShareModal(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-bg3 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-bg4">
                    <Share2 className="h-4 w-4" />
                    Udostępnij
                  </button>
                </div>
                <button onClick={handleReset} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg3 px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg4">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Nowe nagranie
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { icon: Zap, label: 'Auto-tracking', desc: 'Kamera śledzi piłkę' },
              { icon: BarChart3, label: 'AI Scoring', desc: 'Automatyczny wynik' },
              { icon: Eye, label: 'Multi-angle', desc: 'Do 4 kamer na kort' },
              { icon: GraduationCap, label: 'Dla trenera', desc: 'Udostępnij jednym klikiem' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card flex items-center gap-3 p-3">
                <Icon className="h-5 w-5 flex-shrink-0 text-lime" />
                <div>
                  <p className="text-xs font-semibold text-text">{label}</p>
                  <p className="text-[10px] text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showTrainerModal && (
          <TrainerModal trainers={TRAINERS} selected={selectedTrainers} onToggle={toggleTrainer} onClose={() => setShowTrainerModal(false)} onSend={() => { setShowTrainerModal(false); setSelectedTrainers([]); showToast('Nagranie wysłane do trenera', 'success'); }} />
        )}
        {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </div>
    );
  }

  return null;
}
