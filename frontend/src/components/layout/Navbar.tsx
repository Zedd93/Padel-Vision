import { Link, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, CreditCard, Wallet, Settings, Radio, Shield, LogOut, LogIn, UserPlus, MapPin, Trophy, PlayCircle, Users, Video } from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { NotificationCenter } from "./NotificationCenter";
import { WatchStreak } from "@/components/stream/WatchStreak";
import { cn } from "@/utils/cn";

/* ─── Search Data ────────────────────────────────── */

interface SearchResult {
  type: "club" | "stream" | "player" | "tournament";
  title: string;
  subtitle: string;
  href: string;
  isLive?: boolean;
  viewers?: number;
}

const SEARCH_DATA: SearchResult[] = [
  // Clubs
  { type: "club", title: "Racket Club Katowice", subtitle: "Katowice · 6 kortów", href: "/club/racket-club-katowice", isLive: true, viewers: 342 },
  { type: "club", title: "Padel Kraków", subtitle: "Kraków · 4 korty", href: "/club/padel-krakow", isLive: true, viewers: 187 },
  { type: "club", title: "Smash Arena Warszawa", subtitle: "Warszawa · 8 kortów", href: "/club/smash-arena" },
  { type: "club", title: "Court Masters Gdańsk", subtitle: "Gdańsk · 3 korty", href: "/club/court-masters" },
  { type: "club", title: "Viva Padel Poznań", subtitle: "Poznań · 5 kortów", href: "/club/viva-padel" },
  { type: "club", title: "Padel Wrocław", subtitle: "Wrocław · 4 korty", href: "/club/padel-wroclaw" },
  { type: "club", title: "Ace Padel Łódź", subtitle: "Łódź · 3 korty", href: "/club/ace-padel" },
  { type: "club", title: "Silesia Padel", subtitle: "Gliwice · 4 korty", href: "/club/silesia-padel" },
  { type: "club", title: "Padel Zone Lublin", subtitle: "Lublin · 2 korty", href: "/club/padel-zone" },
  { type: "club", title: "Net Point Szczecin", subtitle: "Szczecin · 3 korty", href: "/club/net-point" },
  // Streams
  { type: "stream", title: "Silesia Open 2026 — Finał OPEN A", subtitle: "Racket Club Katowice", href: "/stream/1", isLive: true, viewers: 1247 },
  { type: "stream", title: "Kraków Masters — Półfinał", subtitle: "Padel Kraków", href: "/stream/2", isLive: true, viewers: 543 },
  { type: "stream", title: "Warsaw Challenge — Ćwierćfinał", subtitle: "Smash Arena Warszawa", href: "/stream/3" },
  { type: "stream", title: "Baltic Cup — Grupa A", subtitle: "Court Masters Gdańsk", href: "/stream/4" },
  // Players
  { type: "player", title: "Jan Kowalski", subtitle: "Ranking #1 · OPEN · 87% winrate", href: "/player/jan-kowalski" },
  { type: "player", title: "Piotr Nowak", subtitle: "Ranking #2 · OPEN · 82% winrate", href: "/player/piotr-nowak" },
  { type: "player", title: "Marek Wiśniewski", subtitle: "Ranking #3 · OPEN · 80% winrate", href: "/player/marek-wisniewski" },
  { type: "player", title: "Anna Zając", subtitle: "Ranking #1 · Kobiety · 91% winrate", href: "/player/anna-zajac" },
  { type: "player", title: "Tomasz Lewandowski", subtitle: "Ranking #5 · OPEN · 76% winrate", href: "/player/tomasz-lewandowski" },
  { type: "player", title: "Katarzyna Dąbrowska", subtitle: "Ranking #2 · Kobiety · 85% winrate", href: "/player/katarzyna-dabrowska" },
  // Tournaments
  { type: "tournament", title: "Silesia Open 2026", subtitle: "Katowice · 15-17 marca · OPEN", href: "/tournament/silesia-open" },
  { type: "tournament", title: "Kraków Masters 2026", subtitle: "Kraków · 22-24 marca · OPEN", href: "/tournament/krakow-masters" },
  { type: "tournament", title: "Warsaw Challenge", subtitle: "Warszawa · 5-7 kwietnia · B1/B2", href: "/tournament/warsaw-challenge" },
  { type: "tournament", title: "Baltic Cup", subtitle: "Gdańsk · 12-14 kwietnia · OPEN", href: "/tournament/baltic-cup" },
  { type: "tournament", title: "Poznań Padel Fest", subtitle: "Poznań · 19-21 kwietnia · MIXT", href: "/tournament/poznan-padel-fest" },
];

const TYPE_ICON = {
  club: MapPin,
  stream: PlayCircle,
  player: Users,
  tournament: Trophy,
};

const TYPE_LABEL: Record<string, string> = {
  club: "Klub",
  stream: "Stream",
  player: "Gracz",
  tournament: "Turniej",
};

/* ─── SearchBar Component ──────────────────────── */

function SearchBar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return SEARCH_DATA.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  // Group results by type
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  const flatResults = results;
  const showDropdown = focused && query.trim().length > 0;

  const goTo = useCallback((href: string) => {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
    onNavigate?.();
    navigate(href);
  }, [navigate, onNavigate]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        goTo(flatResults[selectedIndex].href);
      } else if (flatResults.length > 0) {
        goTo(flatResults[0].href);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }, [showDropdown, selectedIndex, flatResults, goTo]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    if (focused) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [focused]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Szukaj klubów, turniejów, graczy..."
          className="w-full rounded-lg border border-border bg-bg3 py-2 pl-10 pr-4 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime/30"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className={cn(
          "absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-bg2 shadow-2xl",
          mobile ? "max-h-[60vh]" : "max-h-[420px]"
        )}>
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Search className="mx-auto mb-2 h-6 w-6 text-muted/50" />
              <p className="text-sm text-muted">
                Brak wyników dla &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-muted/70">
                Spróbuj wpisać nazwę klubu, gracza lub turnieju
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto py-1" style={{ maxHeight: mobile ? "55vh" : "400px" }}>
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-3 pb-1 pt-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      {TYPE_LABEL[type]}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>

                  {/* Items */}
                  {items.map((item) => {
                    const globalIdx = flatResults.indexOf(item);
                    const Icon = TYPE_ICON[item.type];
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <button
                        key={item.href}
                        onClick={() => goTo(item.href)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                          isSelected ? "bg-bg3" : "hover:bg-bg3/50"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                          item.isLive ? "bg-live/15 text-live" : "bg-bg4 text-muted"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">
                            {highlightMatch(item.title, query)}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {item.subtitle}
                          </p>
                        </div>
                        {item.isLive && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-pulse" />
                            <span className="text-[10px] font-bold text-live">
                              {item.viewers?.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Browse all link */}
              <div className="border-t border-border px-3 py-2">
                <button
                  onClick={() => goTo(`/browse?q=${encodeURIComponent(query)}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-lime transition-colors hover:bg-lime/10"
                >
                  <Search className="h-3 w-3" />
                  Szukaj &ldquo;{query}&rdquo; w Odkrywaj
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Highlight matching substring in text */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-lime font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ─── Topbar ─────────────────────────────────────── */

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <div ref={mobileMenuRef}>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-bg2 px-4">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <PadelVisionLogo />
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              to="/record"
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              <Video className="h-3.5 w-3.5" />
              Nagraj swój mecz
            </Link>
            <Link
              to="/browse"
              className="text-sm text-muted transition-colors hover:text-text"
            >
              Odkrywaj
            </Link>
            <Link
              to="/map"
              className="text-sm text-muted transition-colors hover:text-text"
            >
              Mapa
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-muted transition-colors hover:text-text"
            >
              Cennik
            </Link>
            <Link
              to="/clips"
              className="text-sm text-muted transition-colors hover:text-text"
            >
              Klipy
            </Link>
            <Link
              to="/for-clubs"
              className="text-sm text-muted transition-colors hover:text-text"
            >
              Dla klubów
            </Link>
          </nav>
        </div>

        {/* Center: Search */}
        <div className="hidden max-w-md flex-1 px-8 md:block">
          <SearchBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-bg3 hover:text-text md:hidden"
            aria-label="Menu nawigacji"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <WatchStreak />
          <NotificationCenter />
          <UserMenu />
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-bg2 px-4 py-3 md:hidden">
          {/* Mobile Search */}
          <div className="mb-3">
            <SearchBar mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
          {/* Mobile Nav Links */}
          <nav className="space-y-1">
            <Link
              to="/record"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg bg-red-600/20 px-3 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-600/30"
            >
              <Video className="h-4 w-4" />
              Nagraj swój mecz
            </Link>
            <Link
              to="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              Odkrywaj
            </Link>
            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              Mapa
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              Cennik
            </Link>
            <Link
              to="/clips"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              Klipy
            </Link>
            <Link
              to="/for-clubs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              Dla klubów
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

const TIER_LABELS: Record<string, string> = {
  FREE: "Free",
  PASS: "Pass",
  PRO: "Pro",
};

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const role = user?.role;
  const tierLabel = TIER_LABELS[user?.viewerTier ?? "FREE"] ?? "Free";

  // Build menu items based on role
  const menuItems: Array<{ href: string; label: string; icon: typeof User } | { type: "divider" }> = [
    { href: "/subscriptions", label: "Moje subskrypcje", icon: CreditCard },
    { href: "/wallet", label: "Portfel Piłek", icon: Wallet },
    { href: "/account", label: "Ustawienia konta", icon: Settings },
  ];

  if (role === "CLUB" || role === "ADMIN") {
    menuItems.push({ type: "divider" });
    menuItems.push({ href: "/studio", label: "Panel Klubu", icon: Radio });
  }

  if (role === "ADMIN") {
    menuItems.push({ href: "/admin", label: "Panel Admina", icon: Shield });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-muted transition-colors hover:bg-bg3 hover:text-text"
        aria-label="Menu użytkownika"
      >
        {isAuthenticated && user?.image ? (
          <img
            src={user.image}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-bg2 shadow-2xl">
          {isAuthenticated ? (
            <>
              {/* User info */}
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-text">
                  {user?.username || user?.name || "Użytkownik"}
                </p>
                <p className="text-xs text-muted">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-lime">
                  {tierLabel}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {menuItems.map((item, i) => {
                  if ("type" in item && item.type === "divider") {
                    return <div key={i} className="my-1 border-t border-border" />;
                  }
                  const menuItem = item as { href: string; label: string; icon: typeof User };
                  const Icon = menuItem.icon;
                  return (
                    <Link
                      key={menuItem.href}
                      to={menuItem.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
                    >
                      <Icon className="h-4 w-4" />
                      {menuItem.label}
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="border-t border-border py-1">
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-bg3"
                >
                  <LogOut className="h-4 w-4" />
                  Wyloguj się
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not logged in */}
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-text">Nie jesteś zalogowany</p>
                <p className="text-xs text-muted">Zaloguj się, aby uzyskać dostęp</p>
              </div>
              <div className="py-1">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
                >
                  <LogIn className="h-4 w-4" />
                  Zaloguj się
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-lime transition-colors hover:bg-bg3"
                >
                  <UserPlus className="h-4 w-4" />
                  Zarejestruj się
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PadelVisionLogo() {
  return (
    <div className="flex items-center gap-2">
      {/* Grid icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        className="text-lime"
      >
        <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
        <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
      </svg>
      <span className="text-display text-xl tracking-wide text-lime">
        PADEL VISION
      </span>
    </div>
  );
}
