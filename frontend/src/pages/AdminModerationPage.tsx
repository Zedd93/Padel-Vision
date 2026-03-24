import { useState, useEffect, useRef } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  MessageSquareWarning,
  AlertTriangle,
  Ban,
  Check,
  Eye,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  Send,
  User,
  UserRound,
  Crown,
  Tv,
  Video,
  Wallet,
  UserCog,
  Gavel,
  MessagesSquare,
  Volume2,
  VolumeX,
  Timer,
  History,
  XCircle,
  CheckCircle2,
  ArrowUpDown,
  Download,
  RefreshCw,
  Flag,
  Flame,
  Link2,
  AtSign,
  Radio,
  KeyRound,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Role Hierarchy ──────────────────────────────────── */

type RoleKey = "super_admin" | "admin" | "club_owner" | "club_mod" | "chat_mod" | "user";

interface RoleInfo {
  label: string;
  shortLabel: string;
  level: number; // Higher = more power
  color: string;
  bgColor: string;
  icon: typeof Shield;
  description: string;
  permissions: string[];
}

const ROLE_HIERARCHY: Record<RoleKey, RoleInfo> = {
  super_admin: {
    label: "Super Admin",
    shortLabel: "SuperAdmin",
    level: 100,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: Crown,
    description: "Pełna kontrola nad platformą, zarządzanie adminami",
    permissions: [
      "Zarządzanie wszystkimi użytkownikami i rolami",
      "Pełna kontrola nad finansami platformy",
      "Zarządzanie klubami i subskrypcjami",
      "Moderacja globalna (czat, streamy, konta)",
      "Konfiguracja systemu i integracji",
      "Dostęp do wszystkich analityk",
      "Zarządzanie administratorami",
    ],
  },
  admin: {
    label: "Administrator",
    shortLabel: "Admin",
    level: 80,
    color: "text-orange",
    bgColor: "bg-orange/20",
    icon: ShieldCheck,
    description: "Zarządzanie platformą, użytkownikami i moderacją",
    permissions: [
      "Zarządzanie użytkownikami (bez SuperAdminów)",
      "Moderacja globalna czatu i streamów",
      "Przegląd finansów (bez zmian systemowych)",
      "Zarządzanie zgłoszeniami i banami",
      "Podgląd analityk platformy",
      "Zarządzanie klubami",
    ],
  },
  club_owner: {
    label: "Właściciel klubu",
    shortLabel: "Właściciel",
    level: 60,
    color: "text-lime",
    bgColor: "bg-lime/20",
    icon: KeyRound,
    description: "Pełna kontrola nad własnym klubem, transmisje i finanse",
    permissions: [
      "Zarządzanie transmisjami klubu (start/stop/konfiguracja)",
      "Dostęp do wypłat i finansów klubu",
      "Analityka i statystyki własnego klubu",
      "Zarządzanie moderatorami klubowymi",
      "Edycja profilu i ustawień klubu",
      "Zarządzanie turniejami i VOD",
    ],
  },
  club_mod: {
    label: "Moderator klubowy",
    shortLabel: "Mod klubowy",
    level: 40,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: Video,
    description: "Obsługa transmisji bez dostępu do finansów",
    permissions: [
      "Uruchamianie i zarządzanie transmisjami",
      "Obsługa overlay'a wyników na żywo",
      "Zarządzanie czatem podczas transmisji",
      "Brak dostępu do finansów i wypłat",
      "Brak dostępu do analityki przychodów",
    ],
  },
  chat_mod: {
    label: "Moderator czatu",
    shortLabel: "Mod czatu",
    level: 20,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    icon: MessageSquareWarning,
    description: "Pilnowanie porządku w czacie transmisji",
    permissions: [
      "Usuwanie wiadomości z czatu",
      "Wyciszanie użytkowników (timeout)",
      "Banowanie z czatu transmisji",
      "Oznaczanie zgłoszeń do moderacji wyższego stopnia",
      "Brak dostępu do transmisji i finansów",
    ],
  },
  user: {
    label: "Użytkownik",
    shortLabel: "User",
    level: 0,
    color: "text-muted",
    bgColor: "bg-bg4",
    icon: UserRound,
    description: "Standardowy użytkownik platformy",
    permissions: [
      "Oglądanie transmisji",
      "Pisanie na czacie",
      "Kupowanie subskrypcji i Piłek",
      "Zgłaszanie nieodpowiednich treści",
    ],
  },
};

const ROLE_KEYS: RoleKey[] = ["super_admin", "admin", "club_owner", "club_mod", "chat_mod", "user"];

/* ─── Report Data ─────────────────────────────────────── */

type ReportStatus = "pending" | "reviewing" | "resolved" | "banned" | "dismissed";
type ReportType = "chat" | "username" | "stream" | "spam" | "hate" | "harassment";
type ReportSeverity = "low" | "medium" | "high" | "critical";

interface ReportData {
  id: string;
  type: ReportType;
  severity: ReportSeverity;
  user: string;
  userRole: RoleKey;
  content: string;
  stream: string;
  reportedBy: string;
  reportCount: number;
  time: string;
  timestamp: number;
  status: ReportStatus;
  assignedTo?: string;
  note?: string;
  history: { action: string; by: string; time: string }[];
}

interface ModAction {
  id: string;
  action: string;
  target: string;
  by: string;
  byRole: RoleKey;
  time: string;
  detail: string;
}

const INITIAL_REPORTS: ReportData[] = [
  {
    id: "RPT-001",
    type: "hate",
    severity: "critical",
    user: "toxic_player99",
    userRole: "user",
    content: "Obraźliwa wiadomość zawierająca mowę nienawiści w czacie na żywo",
    stream: "Racket Club — Silesia Open",
    reportedBy: "anna_k, jan_nowak, moderator_1",
    reportCount: 3,
    time: "5 min temu",
    timestamp: Date.now() - 300000,
    status: "pending",
    history: [
      { action: "Zgłoszenie utworzone", by: "anna_k", time: "5 min temu" },
      { action: "Potwierdzenie zgłoszenia", by: "jan_nowak", time: "4 min temu" },
      { action: "Auto-eskalacja (3+ zgłoszenia)", by: "System", time: "3 min temu" },
    ],
  },
  {
    id: "RPT-002",
    type: "spam",
    severity: "medium",
    user: "spam_bot_42",
    userRole: "user",
    content: "Powtarzające się linki do external site (phishing suspected)",
    stream: "Padel Kraków — Liga",
    reportedBy: "Auto-detect",
    reportCount: 1,
    time: "15 min temu",
    timestamp: Date.now() - 900000,
    status: "pending",
    history: [
      { action: "Auto-detect: spam pattern", by: "System", time: "15 min temu" },
    ],
  },
  {
    id: "RPT-003",
    type: "username",
    severity: "low",
    user: "offensive_name_pl",
    userRole: "user",
    content: "Nazwa użytkownika zawiera wulgaryzmy w języku polskim",
    stream: "—",
    reportedBy: "kasia_w",
    reportCount: 1,
    time: "1h temu",
    timestamp: Date.now() - 3600000,
    status: "pending",
    history: [
      { action: "Zgłoszenie nazwy użytkownika", by: "kasia_w", time: "1h temu" },
    ],
  },
  {
    id: "RPT-004",
    type: "chat",
    severity: "medium",
    user: "user123",
    userRole: "user",
    content: "Powtarzający się flood w czacie — te same wiadomości co 2s",
    stream: "Smash Arena — Turniej Otwarty",
    reportedBy: "Auto-detect",
    reportCount: 1,
    time: "2h temu",
    timestamp: Date.now() - 7200000,
    status: "resolved",
    assignedTo: "mod_adam",
    note: "Timeout 24h + ostrzeżenie",
    history: [
      { action: "Auto-detect: flood", by: "System", time: "2h temu" },
      { action: "Timeout 24h", by: "mod_adam", time: "1h 50min temu" },
      { action: "Zamknięte", by: "mod_adam", time: "1h 45min temu" },
    ],
  },
  {
    id: "RPT-005",
    type: "stream",
    severity: "high",
    user: "klub_xyz",
    userRole: "club_owner",
    content: "Treść niezwiązana z padelem — stream z gry komputerowej",
    stream: "klub_xyz — Random Stream",
    reportedBy: "admin_marta, jan_nowak, kasia_w, piotr_m, user887",
    reportCount: 5,
    time: "3h temu",
    timestamp: Date.now() - 10800000,
    status: "resolved",
    assignedTo: "admin_marta",
    note: "Stream zamknięty + ostrzeżenie (1/3)",
    history: [
      { action: "Zgłoszenie treści streama", by: "jan_nowak", time: "3h temu" },
      { action: "Eskalacja: 5 zgłoszeń", by: "System", time: "2h 55min temu" },
      { action: "Stream zamknięty", by: "admin_marta", time: "2h 40min temu" },
      { action: "Ostrzeżenie wysłane (1/3)", by: "admin_marta", time: "2h 40min temu" },
    ],
  },
  {
    id: "RPT-006",
    type: "hate",
    severity: "critical",
    user: "hater_2000",
    userRole: "user",
    content: "Wielokrotna mowa nienawiści — recydywa po 2 ostrzeżeniach",
    stream: "Court Masters — Liga Wieczorna",
    reportedBy: "7 użytkowników",
    reportCount: 7,
    time: "5h temu",
    timestamp: Date.now() - 18000000,
    status: "banned",
    assignedTo: "admin_marta",
    note: "Ban permanentny — 3. naruszenie regulaminu",
    history: [
      { action: "Masowe zgłoszenia (7)", by: "System", time: "5h temu" },
      { action: "Rewizja historii konta", by: "admin_marta", time: "4h 50min temu" },
      { action: "Ban permanentny", by: "admin_marta", time: "4h 45min temu" },
    ],
  },
  {
    id: "RPT-007",
    type: "harassment",
    severity: "high",
    user: "troll_master",
    userRole: "user",
    content: "Nękanie innego użytkownika przez prywatne wiadomości i czat",
    stream: "Viva Padel — Sparingi",
    reportedBy: "ofiara_user",
    reportCount: 1,
    time: "6h temu",
    timestamp: Date.now() - 21600000,
    status: "reviewing",
    assignedTo: "mod_adam",
    history: [
      { action: "Zgłoszenie nękania", by: "ofiara_user", time: "6h temu" },
      { action: "Przypisano do moderatora", by: "System", time: "5h 55min temu" },
      { action: "W trakcie przeglądu", by: "mod_adam", time: "5h 30min temu" },
    ],
  },
  {
    id: "RPT-008",
    type: "chat",
    severity: "low",
    user: "newbie_01",
    userRole: "user",
    content: "Drobne przekleństwo w emocjach po przegranym meczu",
    stream: "Padel Wrocław — Amatorzy",
    reportedBy: "strict_viewer",
    reportCount: 1,
    time: "8h temu",
    timestamp: Date.now() - 28800000,
    status: "dismissed",
    assignedTo: "mod_adam",
    note: "Odrzucone — jednorazowy incydent, brak eskalacji",
    history: [
      { action: "Zgłoszenie z czatu", by: "strict_viewer", time: "8h temu" },
      { action: "Przegląd kontekstu", by: "mod_adam", time: "7h 30min temu" },
      { action: "Odrzucone — brak naruszenia", by: "mod_adam", time: "7h 25min temu" },
    ],
  },
];

const RECENT_ACTIONS: ModAction[] = [
  { id: "a1", action: "Ban permanentny", target: "hater_2000", by: "admin_marta", byRole: "admin", time: "4h 45min temu", detail: "3. naruszenie regulaminu" },
  { id: "a2", action: "Timeout 24h", target: "user123", by: "mod_adam", byRole: "chat_mod", time: "1h 50min temu", detail: "Flood w czacie" },
  { id: "a3", action: "Stream zamknięty", target: "klub_xyz", by: "admin_marta", byRole: "admin", time: "2h 40min temu", detail: "Treść off-topic" },
  { id: "a4", action: "Ostrzeżenie", target: "klub_xyz", by: "admin_marta", byRole: "admin", time: "2h 40min temu", detail: "Ostrzeżenie 1/3" },
  { id: "a5", action: "Wyciszenie 1h", target: "spammer_44", by: "mod_chat_1", byRole: "chat_mod", time: "3h temu", detail: "Spam linkowy" },
  { id: "a6", action: "Usunięcie wiadomości", target: "angry_viewer", by: "mod_chat_1", byRole: "chat_mod", time: "4h temu", detail: "Wulgaryzmy" },
];

/* ─── Config ──────────────────────────────────────────── */

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Oczekuje", color: "bg-orange/20 text-orange", icon: Clock },
  reviewing: { label: "W trakcie", color: "bg-blue-500/20 text-blue-400", icon: Eye },
  resolved: { label: "Rozwiązane", color: "bg-emerald-500/20 text-emerald-400", icon: Check },
  banned: { label: "Zbanowany", color: "bg-red-500/20 text-red-400", icon: Ban },
  dismissed: { label: "Odrzucone", color: "bg-zinc-500/20 text-zinc-400", icon: XCircle },
};

const TYPE_CONFIG: Record<ReportType, { label: string; icon: typeof MessageSquare; color: string }> = {
  chat: { label: "Czat", icon: MessageSquare, color: "text-blue-400" },
  username: { label: "Nazwa", icon: AtSign, color: "text-purple-400" },
  stream: { label: "Stream", icon: Tv, color: "text-lime" },
  spam: { label: "Spam", icon: Link2, color: "text-yellow-400" },
  hate: { label: "Nienawiść", icon: Flame, color: "text-red-400" },
  harassment: { label: "Nękanie", icon: AlertTriangle, color: "text-orange" },
};

const SEVERITY_CONFIG: Record<ReportSeverity, { label: string; color: string; dot: string }> = {
  low: { label: "Niski", color: "text-zinc-400", dot: "bg-zinc-400" },
  medium: { label: "Średni", color: "text-yellow-400", dot: "bg-yellow-400" },
  high: { label: "Wysoki", color: "text-orange", dot: "bg-orange" },
  critical: { label: "Krytyczny", color: "text-red-400", dot: "bg-red-400" },
};

type StatusFilter = "all" | ReportStatus;
type TypeFilter = "all" | ReportType;
type SeverityFilter = "all" | ReportSeverity;
type SortBy = "time" | "severity" | "reportCount";

/* ─── Component ──────────────────────────────────────── */

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ReportData[]>(INITIAL_REPORTS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showRolePanel, setShowRolePanel] = useState(false);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState<"1h" | "24h" | "7d" | "30d" | "perm">("24h");
  const [banReason, setBanReason] = useState("");
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Click outside to close action menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (msg: string) => setToast(msg);

  /* ─── Filter & Sort ─────────────────────────── */

  const filtered = reports
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => typeFilter === "all" || r.type === typeFilter)
    .filter((r) => severityFilter === "all" || r.severity === severityFilter)
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.user.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.stream.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      if (sortBy === "time") return (a.timestamp - b.timestamp) * dir;
      if (sortBy === "severity") {
        const order = { low: 0, medium: 1, high: 2, critical: 3 };
        return (order[a.severity] - order[b.severity]) * dir;
      }
      return (a.reportCount - b.reportCount) * dir;
    });

  /* ─── Stats ─────────────────────────────────── */

  const stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    reviewing: reports.filter((r) => r.status === "reviewing").length,
    resolved: reports.filter((r) => r.status === "resolved" || r.status === "dismissed").length,
    banned: reports.filter((r) => r.status === "banned").length,
    critical: reports.filter((r) => r.severity === "critical" && r.status === "pending").length,
    autoDetect: reports.filter((r) => r.reportedBy.includes("Auto-detect")).length,
  };

  /* ─── Actions ───────────────────────────────── */

  const handleResolve = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "resolved" as ReportStatus,
              assignedTo: "Ty",
              history: [...r.history, { action: "Rozwiązane", by: "Ty", time: "teraz" }],
            }
          : r
      )
    );
    showToast(`Zgłoszenie ${id} rozwiązane`);
    setShowActionMenu(null);
  };

  const handleDismiss = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "dismissed" as ReportStatus,
              assignedTo: "Ty",
              note: "Odrzucone przez moderatora",
              history: [...r.history, { action: "Odrzucone", by: "Ty", time: "teraz" }],
            }
          : r
      )
    );
    showToast(`Zgłoszenie ${id} odrzucone`);
    setShowActionMenu(null);
  };

  const handleStartReview = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "reviewing" as ReportStatus,
              assignedTo: "Ty",
              history: [...r.history, { action: "Rozpoczęto przegląd", by: "Ty", time: "teraz" }],
            }
          : r
      )
    );
    showToast(`Przegląd zgłoszenia ${id} rozpoczęty`);
    setShowActionMenu(null);
  };

  const handleBan = (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    const durationLabel = banDuration === "perm" ? "permanentny" : banDuration;

    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "banned" as ReportStatus,
              assignedTo: "Ty",
              note: `Ban ${durationLabel} — ${banReason || "Naruszenie regulaminu"}`,
              history: [
                ...r.history,
                { action: `Ban ${durationLabel}`, by: "Ty", time: "teraz" },
              ],
            }
          : r
      )
    );
    showToast(`Użytkownik ${report.user} zbanowany (${durationLabel})`);
    setShowBanModal(null);
    setBanReason("");
    setBanDuration("24h");
  };

  const handleTimeout = (id: string, duration: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "resolved" as ReportStatus,
              assignedTo: "Ty",
              note: `Timeout ${duration}`,
              history: [...r.history, { action: `Timeout ${duration}`, by: "Ty", time: "teraz" }],
            }
          : r
      )
    );
    const report = reports.find((r) => r.id === id);
    showToast(`Timeout ${duration} dla ${report?.user}`);
    setShowActionMenu(null);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Zgłoszenia odświeżone");
    }, 1000);
  };

  const handleExport = () => {
    const headers = "ID,Typ,Priorytet,Użytkownik,Treść,Stream,Status,Czas\n";
    const rows = filtered
      .map((r) => `${r.id},${TYPE_CONFIG[r.type].label},${SEVERITY_CONFIG[r.severity].label},"${r.user}","${r.content}","${r.stream}",${STATUS_CONFIG[r.status].label},${r.time}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "padelvision-moderation.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Wyeksportowano CSV");
  };

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  /* ─── Render ───────────────────────────────────── */

  const detail = selectedReport ? reports.find((r) => r.id === selectedReport) : null;
  const banReport = showBanModal ? reports.find((r) => r.id === showBanModal) : null;

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
          <h1 className="text-display text-2xl">Moderacja</h1>
          <p className="text-xs text-muted">Zarządzanie zgłoszeniami i bezpieczeństwem platformy</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRolePanel(!showRolePanel)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors",
              showRolePanel
                ? "border-lime/30 bg-lime/10 text-lime"
                : "border-border bg-bg3 text-muted hover:bg-bg4 hover:text-text"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Role
          </button>
          <button
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg3 text-muted transition-colors hover:bg-bg4 hover:text-text"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </button>
          <button
            onClick={handleExport}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-bg3 px-3 text-[11px] font-medium text-muted transition-colors hover:bg-bg4 hover:text-text"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Role Hierarchy Panel */}
      {showRolePanel && (
        <div className="mb-6 glass-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
                <Shield className="h-4 w-4 text-lime" />
                Hierarchia ról
              </h2>
              <button onClick={() => setShowRolePanel(false)} className="text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-0">
              {ROLE_KEYS.map((key, idx) => {
                const role = ROLE_HIERARCHY[key];
                const Icon = role.icon;
                return (
                  <div key={key}>
                    <div className="flex items-start gap-3 py-3">
                      {/* Level indicator */}
                      <div className="flex flex-col items-center">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", role.bgColor)}>
                          <Icon className={cn("h-4.5 w-4.5", role.color)} />
                        </div>
                        {idx < ROLE_KEYS.length - 1 && (
                          <div className="my-1 h-4 w-px bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-semibold", role.color)}>{role.label}</span>
                          <span className="rounded-full bg-bg4 px-2 py-0.5 font-mono text-[10px] text-muted">
                            LVL {role.level}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">{role.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {role.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="rounded-md bg-bg3 px-2 py-0.5 text-[10px] text-muted"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <button
          onClick={() => { setStatusFilter("pending"); setTypeFilter("all"); setSeverityFilter("all"); }}
          className={cn("glass-card p-4 text-left transition-all hover:border-orange/30", statusFilter === "pending" && "border-orange/30 ring-1 ring-orange/20")}
        >
          <div className="flex items-center justify-between">
            <Clock className="h-5 w-5 text-orange" />
            {stats.critical > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                <Flame className="h-3 w-3" />
                {stats.critical} kryt.
              </span>
            )}
          </div>
          <p className="text-display text-2xl mt-1">{stats.pending}</p>
          <p className="text-xs text-muted">Oczekujące</p>
        </button>
        <button
          onClick={() => { setStatusFilter("reviewing"); setTypeFilter("all"); setSeverityFilter("all"); }}
          className={cn("glass-card p-4 text-left transition-all hover:border-blue-500/30", statusFilter === "reviewing" && "border-blue-500/30 ring-1 ring-blue-500/20")}
        >
          <Eye className="h-5 w-5 text-blue-400" />
          <p className="text-display text-2xl mt-1">{stats.reviewing}</p>
          <p className="text-xs text-muted">W trakcie</p>
        </button>
        <button
          onClick={() => { setStatusFilter("resolved"); setTypeFilter("all"); setSeverityFilter("all"); }}
          className={cn("glass-card p-4 text-left transition-all hover:border-emerald-500/30", statusFilter === "resolved" && "border-emerald-500/30 ring-1 ring-emerald-500/20")}
        >
          <Check className="h-5 w-5 text-emerald-400" />
          <p className="text-display text-2xl mt-1">{stats.resolved}</p>
          <p className="text-xs text-muted">Rozwiązane</p>
        </button>
        <button
          onClick={() => { setStatusFilter("banned"); setTypeFilter("all"); setSeverityFilter("all"); }}
          className={cn("glass-card p-4 text-left transition-all hover:border-red-500/30", statusFilter === "banned" && "border-red-500/30 ring-1 ring-red-500/20")}
        >
          <Ban className="h-5 w-5 text-red-400" />
          <p className="text-display text-2xl mt-1">{stats.banned}</p>
          <p className="text-xs text-muted">Bany</p>
        </button>
        <div className="glass-card p-4">
          <Shield className="h-5 w-5 text-blue-400" />
          <p className="text-display text-2xl mt-1">{stats.autoDetect}</p>
          <p className="text-xs text-muted">Auto-detect</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reports List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search + Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Szukaj zgłoszeń (ID, użytkownik, treść...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-bg3 pl-9 pr-3 text-xs text-text placeholder:text-muted focus:border-lime/50 focus:outline-none focus:ring-1 focus:ring-lime/20"
              />
            </div>
            {/* Type Filter */}
            <div className="flex rounded-lg border border-border bg-bg3">
              {(["all", "chat", "spam", "hate", "harassment", "stream", "username"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "px-2 py-1.5 text-[10px] font-semibold transition-colors",
                    typeFilter === t ? "bg-lime/20 text-lime" : "text-muted hover:text-text"
                  )}
                >
                  {t === "all" ? "Typ" : TYPE_CONFIG[t as ReportType]?.label}
                </button>
              ))}
            </div>
            {/* Severity Filter */}
            <div className="flex rounded-lg border border-border bg-bg3">
              {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={cn(
                    "px-2 py-1.5 text-[10px] font-semibold transition-colors",
                    severityFilter === s ? "bg-lime/20 text-lime" : "text-muted hover:text-text"
                  )}
                >
                  {s === "all" ? "Priorytet" : SEVERITY_CONFIG[s as ReportSeverity]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort + Status Filter Row */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(["all", "pending", "reviewing", "resolved", "banned", "dismissed"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                    statusFilter === f
                      ? "bg-lime/20 text-lime"
                      : "bg-bg3 text-muted hover:text-text"
                  )}
                >
                  {f === "all" ? "Wszystkie" : STATUS_CONFIG[f]?.label}
                  {f !== "all" && (
                    <span className="ml-1 opacity-60">
                      {reports.filter((r) => r.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {([
                { key: "time" as SortBy, label: "Czas" },
                { key: "severity" as SortBy, label: "Priorytet" },
                { key: "reportCount" as SortBy, label: "Zgłoszenia" },
              ]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
                    sortBy === s.key ? "bg-bg4 text-lime" : "text-muted hover:text-text"
                  )}
                >
                  {s.label}
                  {sortBy === s.key && (
                    sortDir === "desc" ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronUp className="h-2.5 w-2.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reports */}
          <div className="space-y-3">
            {filtered.map((report) => {
              const status = STATUS_CONFIG[report.status];
              const type = TYPE_CONFIG[report.type];
              const severity = SEVERITY_CONFIG[report.severity];
              const userRole = ROLE_HIERARCHY[report.userRole];
              const TypeIcon = type.icon;
              const StatusIcon = status.icon;
              const isActionable = report.status === "pending" || report.status === "reviewing";

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={cn(
                    "glass-card cursor-pointer p-4 transition-all hover:border-lime/20",
                    selectedReport === report.id && "border-lime/30 ring-1 ring-lime/20",
                    report.severity === "critical" && report.status === "pending" && "border-red-500/30"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Severity dot + Type icon */}
                      <div className="relative mt-0.5">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-bg4")}>
                          <TypeIcon className={cn("h-4 w-4", type.color)} />
                        </div>
                        <div className={cn("absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0C10]", severity.dot)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-muted">{report.id}</span>
                          <span className="text-sm font-semibold text-text">{report.user}</span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", userRole.bgColor, userRole.color)}>
                            {userRole.shortLabel}
                          </span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", severity.color, `bg-current/10`)}>
                            <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1", severity.dot)} />
                            {severity.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted line-clamp-2">{report.content}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted">
                          <span className="flex items-center gap-1">
                            <Tv className="h-2.5 w-2.5" />
                            {report.stream}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Flag className="h-2.5 w-2.5" />
                            {report.reportCount} {report.reportCount === 1 ? "zgłoszenie" : report.reportCount < 5 ? "zgłoszenia" : "zgłoszeń"}
                          </span>
                          <span>·</span>
                          <span>{report.time}</span>
                          {report.assignedTo && (
                            <>
                              <span>·</span>
                              <span className="text-blue-400">{report.assignedTo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      {isActionable && (
                        <div className="relative" ref={showActionMenu === report.id ? actionMenuRef : undefined}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowActionMenu(showActionMenu === report.id ? null : report.id);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg4 text-muted transition-colors hover:bg-bg3 hover:text-text"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {showActionMenu === report.id && (
                            <div className="absolute right-0 top-9 z-30 w-52 rounded-xl border border-border bg-[#0B0C10] p-1.5 shadow-2xl">
                              {report.status === "pending" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStartReview(report.id); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                                >
                                  <Eye className="h-3.5 w-3.5 text-blue-400" />
                                  Rozpocznij przegląd
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTimeout(report.id, "10min"); }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                              >
                                <Timer className="h-3.5 w-3.5 text-yellow-400" />
                                Timeout 10min
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTimeout(report.id, "1h"); }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                              >
                                <Timer className="h-3.5 w-3.5 text-orange" />
                                Timeout 1h
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTimeout(report.id, "24h"); }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text transition-colors hover:bg-bg3"
                              >
                                <VolumeX className="h-3.5 w-3.5 text-orange" />
                                Timeout 24h
                              </button>
                              <div className="my-1 h-px bg-border" />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResolve(report.id); }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Rozwiąż
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDismiss(report.id); }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-500/10"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Odrzuć
                              </button>
                              <div className="my-1 h-px bg-border" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowBanModal(report.id);
                                  setShowActionMenu(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Zbanuj użytkownika
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
                <Shield className="mb-3 h-10 w-10 text-muted/30" />
                <p className="text-sm text-muted">Brak zgłoszeń pasujących do filtrów</p>
                <button
                  onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setSeverityFilter("all"); setSearchQuery(""); }}
                  className="mt-2 text-xs text-lime hover:underline"
                >
                  Wyczyść filtry
                </button>
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>{filtered.length} z {reports.length} zgłoszeń</span>
            <span>Sortowanie: {sortBy === "time" ? "Czas" : sortBy === "severity" ? "Priorytet" : "Zgłoszenia"} ({sortDir === "desc" ? "malejąco" : "rosnąco"})</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Report Detail */}
          {detail ? (
            <div className="glass-card overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
                    <Eye className="h-4 w-4 text-lime" />
                    Szczegóły
                  </h2>
                  <span className="font-mono text-[10px] text-muted">{detail.id}</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* User */}
                <div className="rounded-lg bg-bg3 p-3">
                  <p className="text-[10px] text-muted">Użytkownik</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">{detail.user}</span>
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                      ROLE_HIERARCHY[detail.userRole].bgColor,
                      ROLE_HIERARCHY[detail.userRole].color
                    )}>
                      {ROLE_HIERARCHY[detail.userRole].shortLabel}
                    </span>
                  </div>
                </div>
                {/* Content */}
                <div className="rounded-lg bg-bg3 p-3">
                  <p className="text-[10px] text-muted">Treść zgłoszenia</p>
                  <p className="mt-1 text-xs text-text">{detail.content}</p>
                </div>
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-bg3 p-3">
                    <p className="text-[10px] text-muted">Typ</p>
                    <div className="mt-1 flex items-center gap-1">
                      {(() => { const I = TYPE_CONFIG[detail.type].icon; return <I className={cn("h-3 w-3", TYPE_CONFIG[detail.type].color)} />; })()}
                      <span className={cn("text-xs font-semibold", TYPE_CONFIG[detail.type].color)}>{TYPE_CONFIG[detail.type].label}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-bg3 p-3">
                    <p className="text-[10px] text-muted">Priorytet</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className={cn("inline-block h-2 w-2 rounded-full", SEVERITY_CONFIG[detail.severity].dot)} />
                      <span className={cn("text-xs font-semibold", SEVERITY_CONFIG[detail.severity].color)}>{SEVERITY_CONFIG[detail.severity].label}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-bg3 p-3">
                    <p className="text-[10px] text-muted">Status</p>
                    <span className={cn("text-xs font-semibold", STATUS_CONFIG[detail.status].color.split(" ")[1])}>
                      {STATUS_CONFIG[detail.status].label}
                    </span>
                  </div>
                  <div className="rounded-lg bg-bg3 p-3">
                    <p className="text-[10px] text-muted">Zgłoszenia</p>
                    <span className="text-xs font-semibold text-text">{detail.reportCount}</span>
                  </div>
                </div>
                {/* Stream */}
                <div className="rounded-lg bg-bg3 p-3">
                  <p className="text-[10px] text-muted">Stream</p>
                  <p className="mt-1 text-xs text-text">{detail.stream}</p>
                </div>
                {/* Note */}
                {detail.note && (
                  <div className="rounded-lg bg-bg3 p-3">
                    <p className="text-[10px] text-muted">Notatka moderatora</p>
                    <p className="mt-1 text-xs text-text">{detail.note}</p>
                  </div>
                )}
                {/* History */}
                <div className="rounded-lg bg-bg3 p-3">
                  <p className="mb-2 flex items-center gap-1 text-[10px] text-muted">
                    <History className="h-3 w-3" />
                    Historia
                  </p>
                  <div className="space-y-2">
                    {detail.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-border" />
                        <div>
                          <p className="text-[11px] text-text">{h.action}</p>
                          <p className="text-[10px] text-muted">{h.by} · {h.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Quick Actions */}
                {(detail.status === "pending" || detail.status === "reviewing") && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(detail.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Rozwiąż
                    </button>
                    <button
                      onClick={() => {
                        setShowBanModal(detail.id);
                      }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Zbanuj
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center p-8 text-center">
              <Eye className="mb-3 h-8 w-8 text-muted/30" />
              <p className="text-xs text-muted">Kliknij zgłoszenie, aby zobaczyć szczegóły</p>
            </div>
          )}

          {/* Recent Actions */}
          <div className="glass-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
                <Gavel className="h-4 w-4 text-orange" />
                Ostatnie akcje
              </h2>
            </div>
            <div className="divide-y divide-border">
              {RECENT_ACTIONS.map((act) => {
                const role = ROLE_HIERARCHY[act.byRole];
                return (
                  <div key={act.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-text">{act.action}</span>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", role.bgColor, role.color)}>
                        {role.shortLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {act.target} · {act.by} · {act.time}
                    </p>
                    <p className="text-[10px] text-muted/70">{act.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Ban Modal ──────────────────────────── */}
      {showBanModal && banReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => { setShowBanModal(null); setBanReason(""); }}
        >
          <div
            className="w-[420px] rounded-xl border border-border bg-[#0B0C10] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-display text-lg">Zbanuj użytkownika</h3>
                <p className="text-xs text-muted">{banReport.user}</p>
              </div>
            </div>

            {/* Report Context */}
            <div className="mb-4 rounded-lg bg-bg3 p-3">
              <p className="text-[10px] text-muted">Zgłoszenie</p>
              <p className="mt-1 text-xs text-text">{banReport.content}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", SEVERITY_CONFIG[banReport.severity].color)}>
                  {SEVERITY_CONFIG[banReport.severity].label}
                </span>
                <span className="text-[10px] text-muted">{banReport.reportCount} zgł.</span>
              </div>
            </div>

            {/* Ban Duration */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-text">Czas trwania bana</p>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { value: "1h" as const, label: "1h" },
                  { value: "24h" as const, label: "24h" },
                  { value: "7d" as const, label: "7 dni" },
                  { value: "30d" as const, label: "30 dni" },
                  { value: "perm" as const, label: "Perm" },
                ]).map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setBanDuration(d.value)}
                    className={cn(
                      "rounded-lg py-2 text-xs font-semibold transition-colors",
                      banDuration === d.value
                        ? "bg-red-500 text-white"
                        : "bg-bg3 text-muted hover:bg-bg4 hover:text-text"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-text">Powód (opcjonalnie)</p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Naruszenie regulaminu..."
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-bg3 p-3 text-xs text-text placeholder:text-muted focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
            </div>

            {banDuration === "perm" && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Ban permanentny jest nieodwracalny. Użytkownik straci dostęp do konta.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowBanModal(null); setBanReason(""); }}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleBan(banReport.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <Ban className="h-4 w-4" />
                Zbanuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
