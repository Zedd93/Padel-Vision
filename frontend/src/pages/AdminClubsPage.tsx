import { useState, useRef, useEffect } from "react";
import {
  Search,
  Building2,
  Radio,
  MoreHorizontal,
  MapPin,
  Users,
  Eye,
  Crown,
  Mail,
  Ban,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Download,
  AlertTriangle,
  Settings,
  BarChart3,
  Tv,
  CreditCard,
  Globe,
  Zap,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Link } from "react-router-dom";

/* ─── Data ───────────────────────────────────────────── */

interface ClubData {
  id: string;
  name: string;
  slug: string;
  city: string;
  plan: string;
  courts: number;
  subs: number;
  streams: number;
  revenue: string;
  revenueNum: number;
  isLive: boolean;
  status: string;
  email: string;
  joined: string;
  owner: string;
}

const INITIAL_CLUBS: ClubData[] = [
  { id: "1", name: "Racket Club Katowice", slug: "racket-club", city: "Katowice", plan: "PRO", courts: 6, subs: 156, streams: 24, revenue: "8 420 zł", revenueNum: 8420, isLive: true, status: "active", email: "kontakt@racketclub.pl", joined: "2024-01-15", owner: "Tomasz Kowalski" },
  { id: "2", name: "Padel Kraków", slug: "padel-krakow", city: "Kraków", plan: "PRO", courts: 4, subs: 89, streams: 18, revenue: "5 230 zł", revenueNum: 5230, isLive: true, status: "active", email: "info@padelkrakow.pl", joined: "2024-02-20", owner: "Anna Wiśniewska" },
  { id: "3", name: "Smash Arena Warszawa", slug: "smash-arena", city: "Warszawa", plan: "ENTERPRISE", courts: 8, subs: 72, streams: 15, revenue: "4 890 zł", revenueNum: 4890, isLive: false, status: "active", email: "hello@smasharena.pl", joined: "2024-03-10", owner: "Michał Nowak" },
  { id: "4", name: "Court Masters Gdańsk", slug: "court-masters", city: "Gdańsk", plan: "STARTER", courts: 3, subs: 45, streams: 8, revenue: "2 340 zł", revenueNum: 2340, isLive: false, status: "active", email: "biuro@courtmasters.pl", joined: "2024-05-01", owner: "Piotr Zieliński" },
  { id: "5", name: "Viva Padel Poznań", slug: "viva-padel", city: "Poznań", plan: "PRO", courts: 5, subs: 31, streams: 6, revenue: "1 870 zł", revenueNum: 1870, isLive: false, status: "active", email: "info@vivapadel.pl", joined: "2024-06-18", owner: "Karolina Lewandowska" },
  { id: "6", name: "Padel Wrocław", slug: "padel-wroclaw", city: "Wrocław", plan: "STARTER", courts: 4, subs: 22, streams: 4, revenue: "980 zł", revenueNum: 980, isLive: false, status: "active", email: "kontakt@padelwroclaw.pl", joined: "2024-08-05", owner: "Jakub Kamiński" },
  { id: "7", name: "Ace Padel Łódź", slug: "ace-padel", city: "Łódź", plan: "STARTER", courts: 3, subs: 15, streams: 3, revenue: "650 zł", revenueNum: 650, isLive: false, status: "pending", email: "ace@padellodz.pl", joined: "2024-10-12", owner: "Ewa Dąbrowska" },
];

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  STARTER: { label: "Starter", color: "text-muted" },
  PRO: { label: "Pro", color: "text-lime" },
  ENTERPRISE: { label: "Enterprise", color: "text-orange" },
};

const ALL_PLANS = ["STARTER", "PRO", "ENTERPRISE"];

type SortField = "name" | "plan" | "courts" | "subs" | "streams" | "revenueNum" | "status";
type SortDir = "asc" | "desc";

/* ─── Component ──────────────────────────────────────── */

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<ClubData[]>(INITIAL_CLUBS);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("revenueNum");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    clubId: string;
    action: "suspend" | "activate" | "delete";
  } | null>(null);
  const [showClubDetail, setShowClubDetail] = useState<string | null>(null);

  const menuRef = useRef<HTMLTableCellElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // API calls for persistence (fire-and-forget with optimistic UI)
  const apiAction = async (clubId: string, action: string, value?: string) => {
    try {
      await fetch("/api/admin/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, action, value }),
      });
    } catch {
      // API call failed — optimistic UI already updated
    }
  };

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  /* ─── Sorting ──────────────────────────────────── */

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  /* ─── Filtering & Sorting ──────────────────────── */

  const filtered = clubs
    .filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.city.toLowerCase().includes(search.toLowerCase())) return false;
      if (planFilter !== "all" && c.plan !== planFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter]);

  /* ─── Actions ──────────────────────────────────── */

  const showToastMsg = (msg: string) => setToast(msg);

  const handleChangePlan = (clubId: string, newPlan: string) => {
    setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, plan: newPlan } : c)));
    const club = clubs.find((c) => c.id === clubId);
    showToastMsg(`Zmieniono plan ${club?.name} na ${PLAN_BADGE[newPlan]?.label || newPlan}`);
    setShowPlanModal(null);
    apiAction(clubId, "changePlan", newPlan);
  };

  const handleToggleStatus = (clubId: string) => {
    const club = clubs.find((c) => c.id === clubId);
    const wasSuspended = club?.status !== "active";
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== clubId) return c;
        const newStatus = c.status === "active" ? "suspended" : "active";
        return { ...c, status: newStatus };
      })
    );
    showToastMsg(wasSuspended ? `Aktywowano ${club?.name}` : `Zawieszono ${club?.name}`);
    setShowConfirmModal(null);
    apiAction(clubId, wasSuspended ? "activate" : "suspend");
  };

  const handleDelete = (clubId: string) => {
    const club = clubs.find((c) => c.id === clubId);
    setClubs((prev) => prev.filter((c) => c.id !== clubId));
    showToastMsg(`Usunięto klub ${club?.name}`);
    setShowConfirmModal(null);
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      next.delete(clubId);
      return next;
    });
    apiAction(clubId, "delete");
  };

  const handleSelectAll = () => {
    if (selectedClubs.size === filtered.length) {
      setSelectedClubs(new Set());
    } else {
      setSelectedClubs(new Set(filtered.map((c) => c.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkSuspend = () => {
    setClubs((prev) =>
      prev.map((c) => (selectedClubs.has(c.id) ? { ...c, status: "suspended" } : c))
    );
    showToastMsg(`Zawieszono ${selectedClubs.size} klubów`);
    setSelectedClubs(new Set());
  };

  const handleExportCSV = () => {
    const headers = "Nazwa,Miasto,Plan,Korty,Subskrybenci,Streamy,Przychód,Status,Email,Właściciel\n";
    const rows = filtered
      .map((c) => `"${c.name}",${c.city},${c.plan},${c.courts},${c.subs},${c.streams},"${c.revenue}",${c.status},${c.email},${c.owner}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "padelvision-clubs.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToastMsg("Wyeksportowano CSV");
  };

  /* ─── Sort Header Helper ───────────────────────── */

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="cursor-pointer px-4 py-3 font-medium select-none transition-colors hover:text-lime"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-lime" />
          ) : (
            <ChevronDown className="h-3 w-3 text-lime" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );

  /* ─── Render ───────────────────────────────────── */

  const detailClub = showClubDetail ? clubs.find((c) => c.id === showClubDetail) : null;

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-20 z-50 animate-in slide-in-from-right rounded-lg border border-lime/30 bg-bg2 px-4 py-3 text-sm text-lime shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display text-2xl">Kluby</h1>
          <p className="text-xs text-muted">
            {clubs.length} zarejestrowanych · {clubs.filter((c) => c.status === "active").length} aktywnych ·{" "}
            {clubs.filter((c) => c.status === "suspended").length} zawieszonych ·{" "}
            {clubs.filter((c) => c.status === "pending").length} oczekujących
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedClubs.size > 0 && (
            <button
              onClick={handleBulkSuspend}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/30"
            >
              <Ban className="h-3.5 w-3.5" />
              Zawieś zaznaczone ({selectedClubs.size})
            </button>
          )}
          <span className="flex items-center gap-1 rounded-full bg-live/20 px-2.5 py-1 text-xs font-semibold text-live">
            <Radio className="h-3 w-3 animate-pulse" />
            {clubs.filter((c) => c.isLive).length} live
          </span>
          <button
            onClick={handleExportCSV}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-bg3 px-3 text-[11px] font-medium text-muted transition-colors hover:bg-bg4 hover:text-text"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Szukaj klubu lub miasta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg3 py-2 pl-10 pr-4 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {["all", ...ALL_PLANS].map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                planFilter === p
                  ? "bg-lime/20 text-lime"
                  : "bg-bg3 text-muted hover:text-text"
              )}
            >
              {p === "all" ? "Wszystkie" : PLAN_BADGE[p]?.label || p}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="mb-3 text-xs text-muted">
          Znaleziono {filtered.length} {filtered.length === 1 ? "wynik" : "wyników"} dla &quot;{search}&quot;
        </p>
      )}

      {/* Club Table */}
      <div className="glass-card overflow-visible">
        <div className="overflow-x-auto" style={{ overflow: "visible" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedClubs.size === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 rounded border-border bg-bg3 accent-lime"
                  />
                </th>
                <SortHeader field="name">Klub</SortHeader>
                <SortHeader field="plan">Plan</SortHeader>
                <SortHeader field="courts">Korty</SortHeader>
                <SortHeader field="subs">Suby</SortHeader>
                <SortHeader field="streams">Streamy</SortHeader>
                <SortHeader field="revenueNum">Przychód</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <th className="px-4 py-3 font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((club) => {
                const plan = PLAN_BADGE[club.plan] || PLAN_BADGE.STARTER;
                const isSelected = selectedClubs.has(club.id);
                return (
                  <tr
                    key={club.id}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-lime/5" : "hover:bg-bg3/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(club.id)}
                        className="h-3.5 w-3.5 rounded border-border bg-bg3 accent-lime"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowClubDetail(club.id)}
                        className="flex items-center gap-2 text-left transition-colors hover:text-lime"
                      >
                        {club.isLive && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-live animate-pulse" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-text">{club.name}</p>
                          <p className="flex items-center gap-1 text-[10px] text-muted">
                            <MapPin className="h-2.5 w-2.5" />
                            {club.city}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowPlanModal(club.id)}
                        className={cn("text-xs font-semibold transition-all hover:underline", plan.color)}
                        title="Kliknij aby zmienić plan"
                      >
                        {plan.label}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text">{club.courts}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text">{club.subs}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text">{club.streams}</td>
                    <td className="px-4 py-3 font-mono text-xs text-lime">{club.revenue}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setShowConfirmModal({
                            clubId: club.id,
                            action: club.status === "active" ? "suspend" : "activate",
                          })
                        }
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all hover:ring-1",
                          club.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400 hover:ring-emerald-500/30"
                            : club.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 hover:ring-yellow-500/30"
                            : "bg-red-500/20 text-red-400 hover:ring-red-500/30"
                        )}
                        title={club.status === "active" ? "Kliknij aby zawiesić" : "Kliknij aby aktywować"}
                      >
                        {club.status === "active" ? "Aktywny" : club.status === "pending" ? "Oczekuje" : "Zawieszony"}
                      </button>
                    </td>
                    <td className="relative px-4 py-3" ref={openMenu === club.id ? menuRef : undefined}>
                      <button
                        onClick={() => setOpenMenu(openMenu === club.id ? null : club.id)}
                        className={cn(
                          "rounded p-1 transition-colors",
                          openMenu === club.id
                            ? "bg-bg4 text-lime"
                            : "text-muted hover:bg-bg4 hover:text-text"
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenu === club.id && (
                        <div className="absolute right-4 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-[#0B0C10] shadow-xl">
                          <button
                            onClick={() => {
                              setShowClubDetail(club.id);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted" />
                            Zobacz szczegóły
                          </button>
                          <Link
                            to={`/club/${club.slug}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Globe className="h-3.5 w-3.5 text-muted" />
                            Otwórz profil klubu
                          </Link>
                          <button
                            onClick={() => {
                              setShowPlanModal(club.id);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Crown className="h-3.5 w-3.5 text-muted" />
                            Zmień plan
                          </button>
                          <button
                            onClick={() => {
                              window.location.href = `mailto:${club.email}`;
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Mail className="h-3.5 w-3.5 text-muted" />
                            Wyślij email
                          </button>
                          <div className="border-t border-border" />
                          <button
                            onClick={() => {
                              setShowConfirmModal({
                                clubId: club.id,
                                action: club.status === "active" ? "suspend" : "activate",
                              });
                              setOpenMenu(null);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-bg3",
                              club.status === "active" ? "text-orange" : "text-emerald-400"
                            )}
                          >
                            {club.status === "active" ? (
                              <>
                                <Ban className="h-3.5 w-3.5" />
                                Zawieś klub
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Aktywuj klub
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowConfirmModal({ clubId: club.id, action: "delete" });
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Usuń klub
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted">
                    Nie znaleziono klubów
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted">
            Wyświetlanie {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} z {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-border bg-bg3 px-3 py-1.5 text-xs text-muted transition-colors hover:bg-bg4 hover:text-text disabled:opacity-40"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  currentPage === p
                    ? "bg-lime/20 text-lime"
                    : "border border-border bg-bg3 text-muted hover:bg-bg4 hover:text-text"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-border bg-bg3 px-3 py-1.5 text-xs text-muted transition-colors hover:bg-bg4 hover:text-text disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* ─── Plan Change Modal ───────────────────── */}
      {showPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowPlanModal(null)}
        >
          <div
            className="w-80 rounded-xl border border-border bg-[#0B0C10] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-display text-lg">Zmień plan</h3>
            <p className="mt-1 text-xs text-muted">
              {clubs.find((c) => c.id === showPlanModal)?.name}
            </p>
            <div className="mt-4 space-y-2">
              {ALL_PLANS.map((p) => {
                const badge = PLAN_BADGE[p];
                const isCurrent = clubs.find((c) => c.id === showPlanModal)?.plan === p;
                return (
                  <button
                    key={p}
                    onClick={() => handleChangePlan(showPlanModal, p)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all",
                      isCurrent
                        ? "border-lime bg-lime/10"
                        : "border-border bg-bg3 hover:border-lime/30"
                    )}
                  >
                    <span className={cn("font-semibold", badge?.color)}>
                      {badge?.label || p}
                    </span>
                    {isCurrent && <CheckCircle2 className="h-4 w-4 text-lime" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowPlanModal(null)}
              className="btn-secondary mt-4 w-full py-2 text-sm"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* ─── Confirm Modal (Suspend/Activate/Delete) ────── */}
      {showConfirmModal && (() => {
        const club = clubs.find((c) => c.id === showConfirmModal.clubId);
        if (!club) return null;
        const isSuspend = showConfirmModal.action === "suspend";
        const isActivate = showConfirmModal.action === "activate";
        const isDelete = showConfirmModal.action === "delete";
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowConfirmModal(null)}
          >
            <div
              className="w-96 rounded-xl border border-border bg-[#0B0C10] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isDelete ? "bg-red-500/20" : isSuspend ? "bg-orange/20" : "bg-emerald-500/20"
                  )}
                >
                  {isDelete ? (
                    <Trash2 className="h-5 w-5 text-red-400" />
                  ) : isSuspend ? (
                    <Ban className="h-5 w-5 text-orange" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-display text-lg">
                    {isDelete ? "Usuń klub" : isSuspend ? "Zawieś klub" : "Aktywuj klub"}
                  </h3>
                  <p className="text-xs text-muted">{club.name} · {club.city}</p>
                </div>
              </div>
              <p className="text-sm text-muted">
                {isDelete
                  ? "Czy na pewno chcesz usunąć ten klub? Ta akcja jest nieodwracalna. Wszystkie dane, streamy i subskrypcje zostaną usunięte."
                  : isSuspend
                  ? "Klub straci dostęp do streamowania i panelu klubu. Subskrybenci nie będą mogli oglądać treści."
                  : "Klub odzyska pełen dostęp do platformy i możliwość streamowania."}
              </p>
              {isDelete && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Wszystkie dane klubu, VODy i statystyki zostaną usunięte
                </div>
              )}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    if (isDelete) handleDelete(club.id);
                    else handleToggleStatus(club.id);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                    isDelete
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : isSuspend
                      ? "bg-orange text-black hover:bg-orange/80"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  )}
                >
                  {isDelete ? "Usuń" : isSuspend ? "Zawieś" : "Aktywuj"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Club Detail Modal ───────────────────── */}
      {showClubDetail && detailClub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowClubDetail(null)}
        >
          <div
            className="w-[480px] rounded-xl border border-border bg-[#0B0C10] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-lime/10">
                <Building2 className="h-7 w-7 text-lime" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-display text-lg">{detailClub.name}</h3>
                  {detailClub.isLive && (
                    <span className="flex items-center gap-1 rounded-full bg-live/20 px-2 py-0.5 text-[10px] font-bold text-live">
                      <Radio className="h-2.5 w-2.5 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3 w-3" />
                  {detailClub.city} · {detailClub.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Plan</p>
                <p className={cn("text-sm font-semibold", PLAN_BADGE[detailClub.plan]?.color)}>
                  {PLAN_BADGE[detailClub.plan]?.label}
                </p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Korty</p>
                <p className="font-mono text-sm text-text">{detailClub.courts}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Subskrybenci</p>
                <p className="font-mono text-sm text-text">{detailClub.subs}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Streamy</p>
                <p className="font-mono text-sm text-text">{detailClub.streams}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Przychód</p>
                <p className="font-mono text-sm text-lime">{detailClub.revenue}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Status</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    detailClub.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : detailClub.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  )}
                >
                  {detailClub.status === "active" ? "Aktywny" : detailClub.status === "pending" ? "Oczekuje" : "Zawieszony"}
                </span>
              </div>
              <div className="col-span-2 rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Właściciel</p>
                <p className="text-sm text-text">{detailClub.owner}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Dołączył</p>
                <p className="text-sm text-text">{detailClub.joined}</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                to={`/club/${detailClub.slug}`}
                className="btn-secondary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs"
              >
                <Globe className="h-3.5 w-3.5" />
                Profil
              </Link>
              <button
                onClick={() => {
                  setShowClubDetail(null);
                  setShowPlanModal(detailClub.id);
                }}
                className="btn-secondary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs"
              >
                <Crown className="h-3.5 w-3.5" />
                Zmień plan
              </button>
              <button
                onClick={() => {
                  setShowClubDetail(null);
                  setShowConfirmModal({
                    clubId: detailClub.id,
                    action: detailClub.status === "active" ? "suspend" : "activate",
                  });
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors",
                  detailClub.status === "active"
                    ? "bg-orange/20 text-orange hover:bg-orange/30"
                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                )}
              >
                {detailClub.status === "active" ? (
                  <>
                    <Ban className="h-3.5 w-3.5" />
                    Zawieś
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aktywuj
                  </>
                )}
              </button>
            </div>
            <button
              onClick={() => setShowClubDetail(null)}
              className="btn-secondary mt-3 w-full py-2 text-sm"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
