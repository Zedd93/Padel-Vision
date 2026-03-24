import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  MapPin,
  Play,
  Heart,
  Trophy,
  Calendar,
  Clock,
  Eye,
  PlayCircle,
  Globe,
  Instagram,
  Facebook,
  ExternalLink,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

type TabKey = "live" | "vods" | "tournaments" | "about";

interface VODItem {
  id: string;
  title: string;
  date: string;
  views: number;
  duration: string;
  category: string;
}

interface TournamentItem {
  id: string;
  title: string;
  date: string;
  status: "live" | "upcoming" | "past";
  category: string;
  teams: number;
  prize?: string;
}

/* ─── Mock data ────────────────────────────────── */

const MOCK_CLUB = {
  name: "Padel Arena Mokotów",
  slug: "padel-arena-mokotow",
  location: "Warszawa, Mokotów",
  followers: 2437,
  description:
    "Jeden z największych klubów padelowych w Warszawie. 6 kortów padel, profesjonalny sprzęt i świetna atmosfera. Organizujemy regularne turnieje i ligi w kategoriach OPEN, KOBIETY i MIXT.",
  courts: 6,
  hours: "Pon–Pt: 7:00–23:00 | Sob–Nd: 8:00–22:00",
  address: "ul. Puławska 152, 02-670 Warszawa",
  phone: "+48 22 123 45 67",
  website: "https://padel-arena.pl",
  socials: {
    instagram: "padel_arena_mokotow",
    facebook: "PadelArenaMokotow",
  },
  isLive: false,
  liveStream: null as null | {
    id: string;
    title: string;
    viewers: number;
    startedAt: string;
  },
};

const MOCK_VODS: VODItem[] = [
  { id: "v1", title: "Finał Ligi OPEN — Sezon Zimowy 2026", date: "2026-03-06", views: 3420, duration: "2:34:15", category: "OPEN" },
  { id: "v2", title: "Półfinał KOBIETY — Liga Wiosenna", date: "2026-03-01", views: 1890, duration: "1:48:22", category: "KOBIETY" },
  { id: "v3", title: "Mecz pokazowy — Top 4 Polska", date: "2026-02-25", views: 5612, duration: "1:15:00", category: "OPEN" },
  { id: "v4", title: "Turniej Charytatywny MIXT — Cały dzień", date: "2026-02-18", views: 2150, duration: "4:22:10", category: "MIXT" },
  { id: "v5", title: "Kwalifikacje OPEN — Grupa A i B", date: "2026-02-10", views: 980, duration: "3:05:44", category: "OPEN" },
];

const MOCK_TOURNAMENTS: TournamentItem[] = [
  { id: "t1", title: "Liga Padel Warszawa — Finał OPEN", date: "2026-03-13", status: "live", category: "OPEN", teams: 16, prize: "5 000 PLN" },
  { id: "t2", title: "Turniej Weekendowy OPEN", date: "2026-03-15", status: "upcoming", category: "OPEN", teams: 32, prize: "3 000 PLN" },
  { id: "t3", title: "Liga Kobiet — Runda 4", date: "2026-03-20", status: "upcoming", category: "KOBIETY", teams: 12 },
  { id: "t4", title: "Finał Ligi OPEN — Sezon Zimowy", date: "2026-03-06", status: "past", category: "OPEN", teams: 16, prize: "5 000 PLN" },
  { id: "t5", title: "Turniej Charytatywny MIXT", date: "2026-02-18", status: "past", category: "MIXT", teams: 24 },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "live", label: "Na żywo" },
  { key: "vods", label: "Nagrania" },
  { key: "tournaments", label: "Turnieje" },
  { key: "about", label: "O klubie" },
];

/* ─── Helpers ──────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/* ─── Component ────────────────────────────────── */

export default function ClubProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const clubSlug = slug || "padel-arena-mokotow";

  const [activeTab, setActiveTab] = useState<TabKey>("live");
  const [following, setFollowing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const club = {
    ...MOCK_CLUB,
    name: clubSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    slug: clubSlug,
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleFollow = () => {
    setFollowing(!following);
    showToast(
      following
        ? "Przestałeś obserwować klub"
        : "Obserwujesz klub! Otrzymasz powiadomienia."
    );
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed right-4 top-20 z-50 animate-in slide-in-from-right rounded-lg border border-lime/30 bg-bg2 px-4 py-3 text-sm text-lime shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {toastMsg}
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="relative h-48 bg-bg3 md:h-64">
        <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent" />
      </div>

      {/* Club Info */}
      <div className="relative -mt-16 px-4 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-4 border-bg bg-bg4 text-display text-2xl text-lime">
            {clubSlug.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-display text-2xl">{club.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {club.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {(club.followers + (following ? 1 : 0)).toLocaleString("pl-PL")}{" "}
                obserwujących
              </span>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <button
              onClick={handleFollow}
              className={cn(
                "flex items-center gap-2 py-2 text-sm transition-all",
                following
                  ? "btn-secondary border-lime/30 text-lime"
                  : "btn-primary"
              )}
            >
              <Heart
                className={cn("h-4 w-4", following && "fill-current")}
              />
              {following ? "Obserwujesz" : "Obserwuj"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border">
        <div className="flex gap-6 px-4 md:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "border-b-2 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-lime text-lime"
                  : "border-transparent text-muted hover:text-text"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {/* Na żywo */}
        {activeTab === "live" && (
          <div>
            {club.isLive && club.liveStream ? (
              <Link
                to={`/stream/${club.liveStream.id}`}
                className="glass-card-hover block overflow-hidden"
              >
                <div className="relative aspect-video bg-bg3">
                  <div className="absolute left-3 top-3">
                    <span className="badge-live flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      NA ŻYWO
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-sm text-white/80">
                    <Eye className="h-3.5 w-3.5" />
                    {formatViewers(club.liveStream.viewers)}
                  </div>
                  <div className="flex h-full items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-muted/20" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-text">
                    {club.liveStream.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Rozpoczęto{" "}
                    {new Date(club.liveStream.startedAt).toLocaleTimeString(
                      "pl-PL",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="glass-card flex items-center gap-4 p-8">
                <Play className="h-8 w-8 text-muted" />
                <div>
                  <p className="font-medium text-text">
                    Brak aktywnych transmisji
                  </p>
                  <p className="text-sm text-muted">
                    Obserwuj klub, żeby otrzymać powiadomienie gdy stream się
                    rozpocznie.
                  </p>
                </div>
              </div>
            )}

            {/* Upcoming streams */}
            {MOCK_TOURNAMENTS.filter((t) => t.status === "upcoming").length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-text">
                  Nadchodzące transmisje
                </h3>
                <div className="space-y-2">
                  {MOCK_TOURNAMENTS.filter((t) => t.status === "upcoming").map(
                    (t) => (
                      <div
                        key={t.id}
                        className="glass-card flex items-center justify-between p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-text">
                              {t.title}
                            </p>
                            <p className="text-xs text-muted">
                              {formatDate(t.date)}
                            </p>
                          </div>
                        </div>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                          WKRÓTCE
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nagrania (VODs) */}
        {activeTab === "vods" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_VODS.map((vod) => (
              <Link
                key={vod.id}
                to={`/stream/${vod.id}`}
                className="glass-card-hover group overflow-hidden"
              >
                <div className="relative aspect-video bg-bg3">
                  <div className="absolute right-2 top-2">
                    <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
                      {vod.category}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="rounded bg-black/70 px-1.5 py-0.5 text-xs font-mono text-white/80">
                      {vod.duration}
                    </span>
                  </div>
                  <div className="flex h-full items-center justify-center">
                    <PlayCircle className="h-10 w-10 text-muted/20 transition-transform group-hover:scale-110" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="mb-1 line-clamp-1 text-sm font-medium text-text group-hover:text-lime transition-colors">
                    {vod.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViewers(vod.views)}
                    </span>
                    <span>{formatDate(vod.date)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Turnieje */}
        {activeTab === "tournaments" && (
          <div className="space-y-3">
            {MOCK_TOURNAMENTS.map((t) => (
              <div
                key={t.id}
                className="glass-card flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      t.status === "live" && "bg-red-500/20",
                      t.status === "upcoming" && "bg-blue-500/20",
                      t.status === "past" && "bg-bg4"
                    )}
                  >
                    {t.status === "live" ? (
                      <Radio className="h-5 w-5 text-red-400" />
                    ) : t.status === "upcoming" ? (
                      <Calendar className="h-5 w-5 text-blue-400" />
                    ) : (
                      <Trophy className="h-5 w-5 text-muted" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{t.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{formatDate(t.date)}</span>
                      <span>·</span>
                      <span>{t.teams} par</span>
                      <span>·</span>
                      <span className="rounded bg-bg4 px-1.5 py-0.5 text-[10px] font-bold">
                        {t.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {t.prize && (
                    <span className="text-sm font-medium text-lime">
                      {t.prize}
                    </span>
                  )}
                  {t.status === "live" && (
                    <span className="badge-live flex items-center gap-1 text-[10px]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      LIVE
                    </span>
                  )}
                  {t.status === "upcoming" && (
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                      WKRÓTCE
                    </span>
                  )}
                  {t.status === "past" && (
                    <span className="rounded bg-bg4 px-2 py-0.5 text-[10px] font-bold text-muted">
                      ZAKOŃCZONY
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* O klubie */}
        {activeTab === "about" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Description */}
            <div className="glass-card p-6">
              <h3 className="mb-3 text-display text-lg">O klubie</h3>
              <p className="text-sm leading-relaxed text-text/80">
                {club.description}
              </p>
            </div>

            {/* Info */}
            <div className="glass-card p-6">
              <h3 className="mb-3 text-display text-lg">Informacje</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                  <div>
                    <p className="text-sm font-medium text-text">Adres</p>
                    <p className="text-xs text-muted">{club.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                  <div>
                    <p className="text-sm font-medium text-text">
                      Godziny otwarcia
                    </p>
                    <p className="text-xs text-muted">{club.hours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                  <div>
                    <p className="text-sm font-medium text-text">Korty</p>
                    <p className="text-xs text-muted">{club.courts} kortów padel</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="glass-card p-6">
              <h3 className="mb-3 text-display text-lg">Social media</h3>
              <div className="space-y-2">
                {club.socials.instagram && (
                  <a
                    href={`https://instagram.com/${club.socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
                  >
                    <Instagram className="h-4 w-4" />
                    @{club.socials.instagram}
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                )}
                {club.socials.facebook && (
                  <a
                    href={`https://facebook.com/${club.socials.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
                  >
                    <Facebook className="h-4 w-4" />
                    {club.socials.facebook}
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                )}
                {club.website && (
                  <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
                  >
                    <Globe className="h-4 w-4" />
                    {club.website.replace("https://", "")}
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="glass-card overflow-hidden">
              <div className="flex h-full min-h-[200px] items-center justify-center bg-bg3">
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-muted/30" />
                  <p className="text-sm text-muted">Mapa lokalizacji</p>
                  <p className="text-xs text-muted/60">{club.address}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
