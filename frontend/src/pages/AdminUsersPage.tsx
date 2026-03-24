import { useState, useRef, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  Shield,
  Ban,
  Crown,
  Eye,
  ChevronDown,
  ChevronUp,
  UserCog,
  Trash2,
  Mail,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Download,
  RefreshCw,
  User,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Data ───────────────────────────────────────────── */

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  tier: string;
  joined: string;
  status: string;
  subs: number;
  bits: number;
}

const INITIAL_USERS: UserData[] = [
  { id: "1", username: "jan_nowak", email: "jan@example.com", role: "USER", tier: "PASS", joined: "2024-08-12", status: "active", subs: 2, bits: 340 },
  { id: "2", username: "anna_k", email: "anna@example.com", role: "USER", tier: "PRO", joined: "2024-06-05", status: "active", subs: 4, bits: 1280 },
  { id: "3", username: "marcin_p", email: "marcin@example.com", role: "CLUB_ADMIN", tier: "FREE", joined: "2024-03-20", status: "active", subs: 0, bits: 50 },
  { id: "4", username: "kasia_w", email: "kasia@example.com", role: "USER", tier: "PASS", joined: "2024-11-15", status: "active", subs: 1, bits: 720 },
  { id: "5", username: "piotr_z", email: "piotr@example.com", role: "USER", tier: "FREE", joined: "2025-01-08", status: "banned", subs: 0, bits: 0 },
  { id: "6", username: "ola_m", email: "ola@example.com", role: "MOD", tier: "PRO", joined: "2024-04-22", status: "active", subs: 3, bits: 2100 },
  { id: "7", username: "tomek_l", email: "tomek@example.com", role: "USER", tier: "FREE", joined: "2025-02-14", status: "active", subs: 0, bits: 100 },
  { id: "8", username: "marta_d", email: "marta@example.com", role: "CLUB_ADMIN", tier: "PASS", joined: "2024-07-30", status: "active", subs: 1, bits: 450 },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "bg-red-500/20 text-red-400" },
  MOD: { label: "Mod", color: "bg-purple-500/20 text-purple-400" },
  CLUB_ADMIN: { label: "Klub", color: "bg-blue-500/20 text-blue-400" },
  USER: { label: "User", color: "bg-bg4 text-muted" },
};

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  FREE: { label: "Free", color: "text-muted" },
  PASS: { label: "Pass", color: "text-lime" },
  PRO: { label: "Pro", color: "text-orange" },
};

const ALL_ROLES = ["USER", "MOD", "CLUB_ADMIN", "ADMIN"];
const ALL_TIERS = ["FREE", "PASS", "PRO"];

type SortField = "username" | "role" | "tier" | "joined" | "subs" | "bits" | "status";
type SortDir = "asc" | "desc";

/* ─── Component ──────────────────────────────────────── */

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null);
  const [showTierModal, setShowTierModal] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    userId: string;
    action: "ban" | "unban" | "delete";
  } | null>(null);
  const [showUserDetail, setShowUserDetail] = useState<string | null>(null);

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
  const apiAction = async (userId: string, action: string, value?: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
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

  const filtered = users
    .filter((u) => {
      if (search && !u.username.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
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
  }, [search, roleFilter]);

  /* ─── Actions ──────────────────────────────────── */

  const showToast = (msg: string) => setToast(msg);

  const handleChangeRole = (userId: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    const user = users.find((u) => u.id === userId);
    showToast(`Zmieniono rolę ${user?.username} na ${ROLE_BADGE[newRole]?.label || newRole}`);
    setShowRoleModal(null);
    apiAction(userId, "changeRole", newRole);
  };

  const handleChangeTier = (userId: string, newTier: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, tier: newTier } : u)));
    const user = users.find((u) => u.id === userId);
    showToast(`Zmieniono plan ${user?.username} na ${TIER_BADGE[newTier]?.label || newTier}`);
    setShowTierModal(null);
    apiAction(userId, "changeTier", newTier);
  };

  const handleToggleBan = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    const wasBanned = user?.status === "banned";
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u
      )
    );
    showToast(wasBanned ? `Odbanowano ${user?.username}` : `Zbanowano ${user?.username}`);
    setShowConfirmModal(null);
    apiAction(userId, wasBanned ? "unban" : "ban");
  };

  const handleDelete = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`Usunięto użytkownika ${user?.username}`);
    setShowConfirmModal(null);
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    apiAction(userId, "delete");
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filtered.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filtered.map((u) => u.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkBan = () => {
    setUsers((prev) =>
      prev.map((u) => (selectedUsers.has(u.id) ? { ...u, status: "banned" } : u))
    );
    showToast(`Zbanowano ${selectedUsers.size} użytkowników`);
    setSelectedUsers(new Set());
  };

  const handleExportCSV = () => {
    const headers = "Username,Email,Rola,Plan,Suby,Piłki,Dołączył,Status\n";
    const rows = filtered
      .map((u) => `${u.username},${u.email},${u.role},${u.tier},${u.subs},${u.bits},${u.joined},${u.status}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "padelvision-users.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Wyeksportowano CSV");
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

  const detailUser = showUserDetail ? users.find((u) => u.id === showUserDetail) : null;

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
          <h1 className="text-display text-2xl">Użytkownicy</h1>
          <p className="text-xs text-muted">
            {users.length} zarejestrowanych · {users.filter((u) => u.status === "active").length} aktywnych ·{" "}
            {users.filter((u) => u.status === "banned").length} zbanowanych
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.size > 0 && (
            <button
              onClick={handleBulkBan}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/30"
            >
              <Ban className="h-3.5 w-3.5" />
              Banuj zaznaczonych ({selectedUsers.size})
            </button>
          )}
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
            placeholder="Szukaj po nazwie lub emailu..."
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
          {["all", "USER", "CLUB_ADMIN", "MOD"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                roleFilter === r
                  ? "bg-lime/20 text-lime"
                  : "bg-bg3 text-muted hover:text-text"
              )}
            >
              {r === "all" ? "Wszyscy" : ROLE_BADGE[r]?.label || r}
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

      {/* User Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 rounded border-border bg-bg3 accent-lime"
                  />
                </th>
                <SortHeader field="username">Użytkownik</SortHeader>
                <SortHeader field="role">Rola</SortHeader>
                <SortHeader field="tier">Plan</SortHeader>
                <SortHeader field="subs">Suby</SortHeader>
                <SortHeader field="bits">Piłki</SortHeader>
                <SortHeader field="joined">Dołączył</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <th className="px-4 py-3 font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((user) => {
                const role = ROLE_BADGE[user.role] || ROLE_BADGE.USER;
                const tier = TIER_BADGE[user.tier] || TIER_BADGE.FREE;
                const isSelected = selectedUsers.has(user.id);
                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-lime/5" : "hover:bg-bg3/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(user.id)}
                        className="h-3.5 w-3.5 rounded border-border bg-bg3 accent-lime"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowUserDetail(user.id)}
                        className="text-left transition-colors hover:text-lime"
                      >
                        <p className="text-sm font-medium text-text">
                          {user.username}
                        </p>
                        <p className="text-[10px] text-muted">{user.email}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowRoleModal(user.id)}
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all hover:ring-1 hover:ring-lime/30"
                        title="Kliknij aby zmienić rolę"
                      >
                        <span className={cn("rounded-full px-2 py-0.5", role.color)}>
                          {role.label}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowTierModal(user.id)}
                        className={cn("text-xs font-semibold transition-all hover:underline", tier.color)}
                        title="Kliknij aby zmienić plan"
                      >
                        {tier.label}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text">
                      {user.subs}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text">
                      {user.bits}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {user.joined}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setShowConfirmModal({
                            userId: user.id,
                            action: user.status === "banned" ? "unban" : "ban",
                          })
                        }
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all hover:ring-1",
                          user.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400 hover:ring-emerald-500/30"
                            : "bg-red-500/20 text-red-400 hover:ring-red-500/30"
                        )}
                        title={user.status === "active" ? "Kliknij aby zbanować" : "Kliknij aby odbanować"}
                      >
                        {user.status === "active" ? "Aktywny" : "Zbanowany"}
                      </button>
                    </td>
                    <td className="relative px-4 py-3" ref={openMenu === user.id ? menuRef : undefined}>
                      <button
                        onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        className={cn(
                          "rounded p-1 transition-colors",
                          openMenu === user.id
                            ? "bg-bg4 text-lime"
                            : "text-muted hover:bg-bg4 hover:text-text"
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenu === user.id && (
                        <div className="absolute right-4 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-[#0B0C10] shadow-xl">
                          <button
                            onClick={() => {
                              setShowUserDetail(user.id);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted" />
                            Zobacz profil
                          </button>
                          <button
                            onClick={() => {
                              setShowRoleModal(user.id);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <UserCog className="h-3.5 w-3.5 text-muted" />
                            Zmień rolę
                          </button>
                          <button
                            onClick={() => {
                              setShowTierModal(user.id);
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Crown className="h-3.5 w-3.5 text-muted" />
                            Zmień plan
                          </button>
                          <button
                            onClick={() => {
                              window.location.href = `mailto:${user.email}`;
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
                                userId: user.id,
                                action: user.status === "banned" ? "unban" : "ban",
                              });
                              setOpenMenu(null);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-bg3",
                              user.status === "banned" ? "text-emerald-400" : "text-orange"
                            )}
                          >
                            {user.status === "banned" ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Odbanuj
                              </>
                            ) : (
                              <>
                                <Ban className="h-3.5 w-3.5" />
                                Zbanuj
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowConfirmModal({ userId: user.id, action: "delete" });
                              setOpenMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Usuń konto
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
                    Nie znaleziono użytkowników
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

      {/* ─── Role Change Modal ───────────────────── */}
      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowRoleModal(null)}
        >
          <div
            className="w-80 rounded-xl border border-border bg-[#0B0C10] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-display text-lg">Zmień rolę</h3>
            <p className="mt-1 text-xs text-muted">
              {users.find((u) => u.id === showRoleModal)?.username}
            </p>
            <div className="mt-4 space-y-2">
              {ALL_ROLES.map((r) => {
                const badge = ROLE_BADGE[r];
                const isCurrent = users.find((u) => u.id === showRoleModal)?.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleChangeRole(showRoleModal, r)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all",
                      isCurrent
                        ? "border-lime bg-lime/10 text-lime"
                        : "border-border bg-bg3 text-text hover:border-lime/30"
                    )}
                  >
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", badge?.color)}>
                      {badge?.label || r}
                    </span>
                    {isCurrent && <CheckCircle2 className="h-4 w-4 text-lime" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowRoleModal(null)}
              className="btn-secondary mt-4 w-full py-2 text-sm"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* ─── Tier Change Modal ───────────────────── */}
      {showTierModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowTierModal(null)}
        >
          <div
            className="w-80 rounded-xl border border-border bg-[#0B0C10] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-display text-lg">Zmień plan</h3>
            <p className="mt-1 text-xs text-muted">
              {users.find((u) => u.id === showTierModal)?.username}
            </p>
            <div className="mt-4 space-y-2">
              {ALL_TIERS.map((t) => {
                const badge = TIER_BADGE[t];
                const isCurrent = users.find((u) => u.id === showTierModal)?.tier === t;
                return (
                  <button
                    key={t}
                    onClick={() => handleChangeTier(showTierModal, t)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all",
                      isCurrent
                        ? "border-lime bg-lime/10"
                        : "border-border bg-bg3 hover:border-lime/30"
                    )}
                  >
                    <span className={cn("font-semibold", badge?.color)}>
                      {badge?.label || t}
                    </span>
                    {isCurrent && <CheckCircle2 className="h-4 w-4 text-lime" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowTierModal(null)}
              className="btn-secondary mt-4 w-full py-2 text-sm"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* ─── Confirm Modal (Ban/Unban/Delete) ────── */}
      {showConfirmModal && (() => {
        const user = users.find((u) => u.id === showConfirmModal.userId);
        if (!user) return null;
        const isBan = showConfirmModal.action === "ban";
        const isUnban = showConfirmModal.action === "unban";
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
                    isDelete ? "bg-red-500/20" : isBan ? "bg-orange/20" : "bg-emerald-500/20"
                  )}
                >
                  {isDelete ? (
                    <Trash2 className="h-5 w-5 text-red-400" />
                  ) : isBan ? (
                    <Ban className="h-5 w-5 text-orange" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-display text-lg">
                    {isDelete ? "Usuń konto" : isBan ? "Zbanuj użytkownika" : "Odbanuj użytkownika"}
                  </h3>
                  <p className="text-xs text-muted">{user.username} ({user.email})</p>
                </div>
              </div>
              <p className="text-sm text-muted">
                {isDelete
                  ? "Czy na pewno chcesz usunąć to konto? Ta akcja jest nieodwracalna."
                  : isBan
                  ? "Użytkownik straci dostęp do platformy. Czy kontynuować?"
                  : "Użytkownik odzyska dostęp do platformy. Czy kontynuować?"}
              </p>
              {isDelete && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Wszystkie dane użytkownika zostaną usunięte
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
                    if (isDelete) handleDelete(user.id);
                    else handleToggleBan(user.id);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                    isDelete
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : isBan
                      ? "bg-orange text-black hover:bg-orange/80"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  )}
                >
                  {isDelete ? "Usuń" : isBan ? "Zbanuj" : "Odbanuj"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── User Detail Modal ───────────────────── */}
      {showUserDetail && detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowUserDetail(null)}
        >
          <div
            className="w-[420px] rounded-xl border border-border bg-[#0B0C10] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime/10 text-display text-xl text-lime">
                {detailUser.username[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-display text-lg">{detailUser.username}</h3>
                <p className="text-xs text-muted">{detailUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Rola</p>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ROLE_BADGE[detailUser.role]?.color)}>
                  {ROLE_BADGE[detailUser.role]?.label}
                </span>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Plan</p>
                <p className={cn("text-sm font-semibold", TIER_BADGE[detailUser.tier]?.color)}>
                  {TIER_BADGE[detailUser.tier]?.label}
                </p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Subskrypcje</p>
                <p className="font-mono text-sm text-text">{detailUser.subs}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Piłki</p>
                <p className="font-mono text-sm text-text">{detailUser.bits}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Dołączył</p>
                <p className="text-sm text-text">{detailUser.joined}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Status</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    detailUser.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}
                >
                  {detailUser.status === "active" ? "Aktywny" : "Zbanowany"}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowUserDetail(null);
                  setShowRoleModal(detailUser.id);
                }}
                className="btn-secondary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs"
              >
                <UserCog className="h-3.5 w-3.5" />
                Zmień rolę
              </button>
              <button
                onClick={() => {
                  setShowUserDetail(null);
                  setShowTierModal(detailUser.id);
                }}
                className="btn-secondary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs"
              >
                <Crown className="h-3.5 w-3.5" />
                Zmień plan
              </button>
              <button
                onClick={() => {
                  setShowUserDetail(null);
                  setShowConfirmModal({
                    userId: detailUser.id,
                    action: detailUser.status === "banned" ? "unban" : "ban",
                  });
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors",
                  detailUser.status === "banned"
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    : "bg-orange/20 text-orange hover:bg-orange/30"
                )}
              >
                {detailUser.status === "banned" ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Odbanuj
                  </>
                ) : (
                  <>
                    <Ban className="h-3.5 w-3.5" />
                    Zbanuj
                  </>
                )}
              </button>
            </div>
            <button
              onClick={() => setShowUserDetail(null)}
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
