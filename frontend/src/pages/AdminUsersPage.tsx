import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Ban,
  Crown,
  Eye,
  ChevronDown,
  ChevronUp,
  UserCog,
  Trash2,
  Mail,
  CheckCircle2,
  ArrowUpDown,
  Download,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  Button,
  Badge,
  Modal,
  FilterTabs,
  SearchInput,
  SectionHeader,
  type BadgeVariant,
  type FilterTabOption,
} from "@/components/ui";

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

const ROLE_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  ADMIN: { label: "Admin", variant: "danger" },
  MOD: { label: "Mod", variant: "purple" },
  CLUB_ADMIN: { label: "Klub", variant: "info" },
  USER: { label: "User", variant: "neutral" },
};

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  FREE: { label: "Free", color: "text-muted" },
  PASS: { label: "Pass", color: "text-lime" },
  PRO: { label: "Pro", color: "text-orange" },
};

const ALL_ROLES = ["USER", "MOD", "CLUB_ADMIN", "ADMIN"];
const ALL_TIERS = ["FREE", "PASS", "PRO"];

const ROLE_FILTER_OPTIONS: FilterTabOption[] = [
  { value: "all", label: "Wszyscy" },
  { value: "USER", label: "User" },
  { value: "CLUB_ADMIN", label: "Klub" },
  { value: "MOD", label: "Mod" },
];

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
  const confirmUser = showConfirmModal && users.find((u) => u.id === showConfirmModal.userId);
  const isBan = showConfirmModal?.action === "ban";
  const isUnban = showConfirmModal?.action === "unban";
  const isDelete = showConfirmModal?.action === "delete";
  const roleModalUser = showRoleModal ? users.find((u) => u.id === showRoleModal) : undefined;
  const tierModalUser = showTierModal ? users.find((u) => u.id === showTierModal) : undefined;

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-20 z-50 rounded-lg border border-lime/30 bg-bg2 px-4 py-3 text-sm text-lime shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <SectionHeader
        title="Użytkownicy"
        subtitle={`${users.length} zarejestrowanych · ${users.filter((u) => u.status === "active").length} aktywnych · ${users.filter((u) => u.status === "banned").length} zbanowanych`}
        actions={
          <>
            {selectedUsers.size > 0 && (
              <Button
                variant="danger"
                size="sm"
                icon={Ban}
                onClick={handleBulkBan}
              >
                Banuj zaznaczonych ({selectedUsers.size})
              </Button>
            )}
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
              CSV
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Szukaj po nazwie lub emailu..."
          containerClassName="max-w-sm flex-1"
        />
        <FilterTabs
          options={ROLE_FILTER_OPTIONS}
          value={roleFilter}
          onChange={setRoleFilter}
          variant="pills"
          size="sm"
        />
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
                const isActive = user.status === "active";
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
                        <p className="text-sm font-medium text-text">{user.username}</p>
                        <p className="text-[10px] text-muted">{user.email}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowRoleModal(user.id)}
                        title="Kliknij aby zmienić rolę"
                      >
                        <Badge variant={role.variant} size="xs">{role.label}</Badge>
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
                    <td className="px-4 py-3 font-mono text-xs text-text">{user.subs}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text">{user.bits}</td>
                    <td className="px-4 py-3 text-xs text-muted">{user.joined}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setShowConfirmModal({
                            userId: user.id,
                            action: isActive ? "ban" : "unban",
                          })
                        }
                        title={isActive ? "Kliknij aby zbanować" : "Kliknij aby odbanować"}
                      >
                        <Badge variant={isActive ? "success" : "danger"} size="xs">
                          {isActive ? "Aktywny" : "Zbanowany"}
                        </Badge>
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
                        <div className="absolute right-4 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-bg shadow-xl">
                          <button
                            onClick={() => { setShowUserDetail(user.id); setOpenMenu(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted" />
                            Zobacz profil
                          </button>
                          <button
                            onClick={() => { setShowRoleModal(user.id); setOpenMenu(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <UserCog className="h-3.5 w-3.5 text-muted" />
                            Zmień rolę
                          </button>
                          <button
                            onClick={() => { setShowTierModal(user.id); setOpenMenu(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                          >
                            <Crown className="h-3.5 w-3.5 text-muted" />
                            Zmień plan
                          </button>
                          <button
                            onClick={() => { window.location.href = `mailto:${user.email}`; setOpenMenu(null); }}
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
                                action: isActive ? "ban" : "unban",
                              });
                              setOpenMenu(null);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-bg3",
                              isActive ? "text-orange" : "text-emerald-400"
                            )}
                          >
                            {isActive ? (
                              <><Ban className="h-3.5 w-3.5" />Zbanuj</>
                            ) : (
                              <><CheckCircle2 className="h-3.5 w-3.5" />Odbanuj</>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ←
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={currentPage === p ? "primary" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              →
            </Button>
          </div>
        </div>
      )}

      {/* ─── Role Change Modal ───────────────────── */}
      <Modal
        isOpen={!!showRoleModal}
        onClose={() => setShowRoleModal(null)}
        size="sm"
        title="Zmień rolę"
        subtitle={roleModalUser ? roleModalUser.username : undefined}
        footer={
          <Button variant="secondary" fullWidth onClick={() => setShowRoleModal(null)}>
            Anuluj
          </Button>
        }
      >
        <div className="space-y-2">
          {ALL_ROLES.map((r) => {
            const badge = ROLE_BADGE[r];
            const isCurrent = roleModalUser?.role === r;
            return (
              <button
                key={r}
                onClick={() => showRoleModal && handleChangeRole(showRoleModal, r)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all",
                  isCurrent
                    ? "border-lime bg-lime/10 text-lime"
                    : "border-border bg-bg3 text-text hover:border-lime/30"
                )}
              >
                <Badge variant={badge.variant} size="xs">{badge.label}</Badge>
                {isCurrent && <CheckCircle2 className="h-4 w-4 text-lime" />}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ─── Tier Change Modal ───────────────────── */}
      <Modal
        isOpen={!!showTierModal}
        onClose={() => setShowTierModal(null)}
        size="sm"
        title="Zmień plan"
        subtitle={tierModalUser ? tierModalUser.username : undefined}
        footer={
          <Button variant="secondary" fullWidth onClick={() => setShowTierModal(null)}>
            Anuluj
          </Button>
        }
      >
        <div className="space-y-2">
          {ALL_TIERS.map((t) => {
            const badge = TIER_BADGE[t];
            const isCurrent = tierModalUser?.tier === t;
            return (
              <button
                key={t}
                onClick={() => showTierModal && handleChangeTier(showTierModal, t)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all",
                  isCurrent
                    ? "border-lime bg-lime/10"
                    : "border-border bg-bg3 hover:border-lime/30"
                )}
              >
                <span className={cn("font-semibold", badge.color)}>{badge.label}</span>
                {isCurrent && <CheckCircle2 className="h-4 w-4 text-lime" />}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ─── Confirm Modal (Ban/Unban/Delete) ────── */}
      <Modal
        isOpen={!!showConfirmModal && !!confirmUser}
        onClose={() => setShowConfirmModal(null)}
        size="sm"
        icon={isDelete ? Trash2 : isBan ? Ban : CheckCircle2}
        iconColor={isDelete ? "text-red-400" : isBan ? "text-orange" : "text-emerald-400"}
        iconBgColor={isDelete ? "bg-red-500/20" : isBan ? "bg-orange/20" : "bg-emerald-500/20"}
        title={isDelete ? "Usuń konto" : isBan ? "Zbanuj użytkownika" : "Odbanuj użytkownika"}
        subtitle={confirmUser ? `${confirmUser.username} (${confirmUser.email})` : undefined}
        footer={
          confirmUser && (
            <>
              <Button variant="secondary" onClick={() => setShowConfirmModal(null)}>
                Anuluj
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (isDelete) handleDelete(confirmUser.id);
                  else handleToggleBan(confirmUser.id);
                }}
              >
                {isDelete ? "Usuń" : isBan ? "Zbanuj" : "Odbanuj"}
              </Button>
            </>
          )
        }
      >
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
      </Modal>

      {/* ─── User Detail Modal ───────────────────── */}
      <Modal
        isOpen={!!showUserDetail && !!detailUser}
        onClose={() => setShowUserDetail(null)}
        size="sm"
        title={detailUser?.username || ""}
        subtitle={detailUser?.email}
      >
        {detailUser && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Rola</p>
                <Badge variant={ROLE_BADGE[detailUser.role]?.variant ?? "neutral"} size="sm">
                  {ROLE_BADGE[detailUser.role]?.label}
                </Badge>
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
                <Badge variant={detailUser.status === "active" ? "success" : "danger"} size="sm">
                  {detailUser.status === "active" ? "Aktywny" : "Zbanowany"}
                </Badge>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={UserCog}
                fullWidth
                onClick={() => {
                  setShowUserDetail(null);
                  setShowRoleModal(detailUser.id);
                }}
              >
                Rola
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Crown}
                fullWidth
                onClick={() => {
                  setShowUserDetail(null);
                  setShowTierModal(detailUser.id);
                }}
              >
                Plan
              </Button>
              <Button
                variant={detailUser.status === "banned" ? "primary" : "danger"}
                size="sm"
                icon={detailUser.status === "banned" ? CheckCircle2 : Ban}
                fullWidth
                onClick={() => {
                  setShowUserDetail(null);
                  setShowConfirmModal({
                    userId: detailUser.id,
                    action: detailUser.status === "banned" ? "unban" : "ban",
                  });
                }}
              >
                {detailUser.status === "banned" ? "Odbanuj" : "Zbanuj"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
