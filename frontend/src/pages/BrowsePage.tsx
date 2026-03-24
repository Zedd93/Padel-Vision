import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  Clock,
  TrendingUp,
  X,
  Radio,
  Trophy,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { FeaturedCarousel } from "@/components/browse/FeaturedCarousel";
import { ClubSpotlight } from "@/components/browse/ClubSpotlight";

/* ─── Types ────────────────────────────────────── */

type StreamStatus = "live" | "upcoming" | "vod";
type Category = "OPEN" | "KOBIETY" | "MIXT" | "JUNIORZY";
type SortBy = "viewers" | "newest" | "trending";
type FilterTab = "all" | "live" | "tournaments" | "vod" | Category;

interface StreamItem {
  id: string;
  title: string;
  club: string;
  clubSlug: string;
  thumbnail: string;
  status: StreamStatus;
  category: Category;
  viewers: number;
  startedAt: string;
  isTournament: boolean;
  tags: string[];
}

/* ─── Mock data ────────────────────────────────── */

const MOCK_STREAMS: StreamItem[] = [
  {
    id: "1",
    title: "Liga Padel Warszawa — Finał OPEN",
    club: "Padel Arena Mokotów",
    clubSlug: "padel-arena-mokotow",
    thumbnail: "",
    status: "live",
    category: "OPEN",
    viewers: 1247,
    startedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    isTournament: true,
    tags: ["liga", "finał"],
  },
  {
    id: "2",
    title: "Trening sparingowy — kort 3",
    club: "PadelShot Kraków",
    clubSlug: "padelshot-krakow",
    thumbnail: "",
    status: "live",
    category: "OPEN",
    viewers: 89,
    startedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    isTournament: false,
    tags: ["trening"],
  },
  {
    id: "3",
    title: "Turniej Kobiet — Półfinał",
    club: "Smash Padel Wrocław",
    clubSlug: "smash-padel-wroclaw",
    thumbnail: "",
    status: "live",
    category: "KOBIETY",
    viewers: 534,
    startedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    isTournament: true,
    tags: ["turniej", "kobiety"],
  },
  {
    id: "4",
    title: "Turniej MIXT — Runda kwalifikacyjna",
    club: "Padel Zone Gdańsk",
    clubSlug: "padel-zone-gdansk",
    thumbnail: "",
    status: "upcoming",
    category: "MIXT",
    viewers: 0,
    startedAt: new Date(Date.now() + 3 * 3600000).toISOString(),
    isTournament: true,
    tags: ["turniej", "mixt"],
  },
  {
    id: "5",
    title: "Liga Juniorów U18 — Grupa A",
    club: "Just Padel Poznań",
    clubSlug: "just-padel-poznan",
    thumbnail: "",
    status: "upcoming",
    category: "JUNIORZY",
    viewers: 0,
    startedAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    isTournament: true,
    tags: ["juniorzy", "liga"],
  },
  {
    id: "6",
    title: "Finał Ligi OPEN — Sezon Zimowy 2026",
    club: "Padel Arena Mokotów",
    clubSlug: "padel-arena-mokotow",
    thumbnail: "",
    status: "vod",
    category: "OPEN",
    viewers: 3420,
    startedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    isTournament: true,
    tags: ["finał", "liga"],
  },
  {
    id: "7",
    title: "Turniej Charytatywny MIXT",
    club: "Smash Padel Wrocław",
    clubSlug: "smash-padel-wroclaw",
    thumbnail: "",
    status: "vod",
    category: "MIXT",
    viewers: 1890,
    startedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    isTournament: true,
    tags: ["charytatywny", "mixt"],
  },
  {
    id: "8",
    title: "Mecz pokazowy — Top 4 Polska",
    club: "PadelShot Kraków",
    clubSlug: "padelshot-krakow",
    thumbnail: "",
    status: "vod",
    category: "OPEN",
    viewers: 5612,
    startedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    isTournament: false,
    tags: ["pokazowy"],
  },
  {
    id: "9",
    title: "Sparingi Kobiet — Przygotowanie do turnieju",
    club: "Padel Zone Gdańsk",
    clubSlug: "padel-zone-gdansk",
    thumbnail: "",
    status: "live",
    category: "KOBIETY",
    viewers: 215,
    startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    isTournament: false,
    tags: ["trening", "kobiety"],
  },
  {
    id: "10",
    title: "Akademia Juniorów — Sesja treningowa",
    club: "Just Padel Poznań",
    clubSlug: "just-padel-poznan",
    thumbnail: "",
    status: "vod",
    category: "JUNIORZY",
    viewers: 780,
    startedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    isTournament: false,
    tags: ["juniorzy", "akademia"],
  },
  {
    id: "11",
    title: "Kwalifikacje OPEN — Grupa B",
    club: "Padel Arena Mokotów",
    clubSlug: "padel-arena-mokotow",
    thumbnail: "",
    status: "live",
    category: "OPEN",
    viewers: 367,
    startedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    isTournament: true,
    tags: ["kwalifikacje"],
  },
  {
    id: "12",
    title: "Turniej Weekendowy OPEN",
    club: "PadelShot Kraków",
    clubSlug: "padelshot-krakow",
    thumbnail: "",
    status: "upcoming",
    category: "OPEN",
    viewers: 0,
    startedAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    isTournament: true,
    tags: ["turniej", "weekend"],
  },
];

const FILTER_TABS: { key: FilterTab; label: string; icon?: typeof Radio }[] = [
  { key: "all", label: "Wszystko" },
  { key: "live", label: "Na żywo", icon: Radio },
  { key: "tournaments", label: "Turnieje", icon: Trophy },
  { key: "vod", label: "VOD", icon: PlayCircle },
  { key: "OPEN", label: "OPEN" },
  { key: "KOBIETY", label: "KOBIETY" },
  { key: "MIXT", label: "MIXT" },
  { key: "JUNIORZY", label: "JUNIORZY" },
];

const SORT_OPTIONS: { key: SortBy; label: string; icon: typeof Eye }[] = [
  { key: "viewers", label: "Widzowie", icon: Eye },
  { key: "newest", label: "Najnowsze", icon: Clock },
  { key: "trending", label: "Popularne", icon: TrendingUp },
];

const PAGE_SIZE = 8;

/* ─── Helpers ──────────────────────────────────── */

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const hrs = Math.floor(-diff / 3600000);
    if (hrs < 1) return `za ${Math.floor(-diff / 60000)} min`;
    if (hrs < 24) return `za ${hrs}h`;
    return `za ${Math.floor(hrs / 24)} dni`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h temu`;
  return `${Math.floor(hrs / 24)} dni temu`;
}

/* ─── Component ────────────────────────────────── */

export default function BrowsePage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortBy>("viewers");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let items = [...MOCK_STREAMS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.club.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q))
      );
    }

    // Filter by tab
    switch (activeFilter) {
      case "live":
        items = items.filter((s) => s.status === "live");
        break;
      case "tournaments":
        items = items.filter((s) => s.isTournament);
        break;
      case "vod":
        items = items.filter((s) => s.status === "vod");
        break;
      case "OPEN":
      case "KOBIETY":
      case "MIXT":
      case "JUNIORZY":
        items = items.filter((s) => s.category === activeFilter);
        break;
      default:
        break;
    }

    // Sort
    switch (sortBy) {
      case "viewers":
        items.sort((a, b) => b.viewers - a.viewers);
        break;
      case "newest":
        items.sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
        break;
      case "trending":
        // Trending = live first, then by viewers
        items.sort((a, b) => {
          if (a.status === "live" && b.status !== "live") return -1;
          if (b.status === "live" && a.status !== "live") return 1;
          return b.viewers - a.viewers;
        });
        break;
    }

    return items;
  }, [activeFilter, sortBy, searchQuery]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoading(false);
    }, 400);
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
    setSortBy("viewers");
    setVisibleCount(PAGE_SIZE);
  };

  const activeSort = SORT_OPTIONS.find((s) => s.key === sortBy)!;

  return (
    <div className="p-4 md:p-6">
      {/* Featured Carousel */}
      <FeaturedCarousel />

      {/* Padel Vision Picks — Club Spotlight */}
      <ClubSpotlight />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-display text-2xl">Wszystkie transmisje</h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Szukaj streamów..."
              className="w-48 rounded-lg border border-border bg-bg3 py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none sm:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="btn-secondary flex items-center gap-2 py-2 text-sm"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">{activeSort.label}</span>
            </button>
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-bg2 py-1 shadow-xl">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key);
                          setShowSortMenu(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                          sortBy === opt.key
                            ? "bg-lime/10 text-lime"
                            : "text-muted hover:bg-bg3 hover:text-text"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveFilter(tab.key);
                setVisibleCount(PAGE_SIZE);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeFilter === tab.key
                  ? "bg-lime text-black"
                  : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "wynik" : "wyników"}
          {activeFilter !== "all" && (
            <span className="ml-1">
              w kategorii{" "}
              <span className="text-lime">
                {FILTER_TABS.find((t) => t.key === activeFilter)?.label}
              </span>
            </span>
          )}
          {searchQuery && (
            <span className="ml-1">
              dla &ldquo;<span className="text-text">{searchQuery}</span>&rdquo;
            </span>
          )}
        </p>
        {(activeFilter !== "all" || searchQuery) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-lime"
          >
            <X className="h-3.5 w-3.5" />
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Stream grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Search className="mb-4 h-12 w-12 text-muted/30" />
          <p className="mb-1 text-lg font-medium text-text">Brak wyników</p>
          <p className="mb-4 text-sm text-muted">
            Nie znaleziono streamów pasujących do filtrów.
          </p>
          <button
            onClick={clearFilters}
            className="btn-primary px-6 py-2 text-sm"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((stream) => (
              <Link
                key={stream.id}
                to={`/stream/${stream.id}`}
                className="glass-card-hover group overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-bg3">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Status badge */}
                  <div className="absolute left-2 top-2">
                    {stream.status === "live" && (
                      <span className="badge-live flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        NA ŻYWO
                      </span>
                    )}
                    {stream.status === "upcoming" && (
                      <span className="rounded bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        Wkrótce
                      </span>
                    )}
                    {stream.status === "vod" && (
                      <span className="rounded bg-bg4/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                        VOD
                      </span>
                    )}
                  </div>

                  {/* Category badge */}
                  <div className="absolute right-2 top-2">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
                      {stream.category}
                    </span>
                  </div>

                  {/* Viewers / Time */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    {stream.status === "live" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-white/90">
                        <Eye className="h-3 w-3" />
                        {formatViewers(stream.viewers)}
                      </span>
                    ) : stream.status === "vod" ? (
                      <span className="flex items-center gap-1 text-xs text-white/70">
                        <Eye className="h-3 w-3" />
                        {formatViewers(stream.viewers)} wyświetleń
                      </span>
                    ) : null}
                  </div>

                  {/* Tournament badge */}
                  {stream.isTournament && (
                    <div className="absolute bottom-2 right-2">
                      <Trophy className="h-3.5 w-3.5 text-yellow-400/80" />
                    </div>
                  )}

                  {/* Placeholder visual */}
                  <div className="flex h-full items-center justify-center">
                    <PlayCircle className="h-10 w-10 text-muted/20 transition-transform group-hover:scale-110" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="mb-1 line-clamp-1 text-sm font-medium text-text group-hover:text-lime transition-colors">
                    {stream.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">{stream.club}</p>
                    <p className="text-[10px] text-muted">
                      {timeAgo(stream.startedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 px-8 py-2.5 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ładowanie...
                  </>
                ) : (
                  `Pokaż więcej (${filtered.length - visibleCount} pozostałych)`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
