import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Eye,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Coins,
  Ticket,
  Briefcase,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Data ───────────────────────────────────────────── */

const KPI_CARDS = [
  {
    label: "MRR",
    value: "48,320 zł",
    change: "+12.4%",
    up: true,
    icon: DollarSign,
    color: "text-lime",
    href: "/admin/finance",
    description: "Miesięczny przychód powtarzalny",
  },
  {
    label: "Aktywni użytkownicy",
    value: "3,847",
    change: "+8.2%",
    up: true,
    icon: Users,
    color: "text-blue-400",
    href: "/admin/users",
    description: "Unikalni użytkownicy (30 dni)",
  },
  {
    label: "Kluby",
    value: "47",
    change: "+3",
    up: true,
    icon: Building2,
    color: "text-emerald-400",
    href: "/admin/clubs",
    description: "Aktywne konta klubowe",
  },
  {
    label: "Avg. widzów/stream",
    value: "234",
    change: "-5.1%",
    up: false,
    icon: Eye,
    color: "text-orange",
    href: "/admin/clubs",
    description: "Średnia oglądalność transmisji",
  },
];

const REVENUE_BREAKDOWN = [
  { source: "Subskrypcje platformy (Pass/Pro)", amount: "28,450 zł", pct: 59, icon: CreditCard, href: "/admin/finance" },
  { source: "Subskrypcje kanałów (30%)", amount: "8,920 zł", pct: 18, icon: Users, href: "/admin/finance" },
  { source: "Piłki (Bits) (30%)", amount: "5,340 zł", pct: 11, icon: Coins, href: "/admin/finance" },
  { source: "PPV (12%)", amount: "3,890 zł", pct: 8, icon: Ticket, href: "/admin/finance" },
  { source: "Plany klubowe (B2B)", amount: "1,720 zł", pct: 4, icon: Briefcase, href: "/admin/clubs" },
];

const RECENT_ACTIVITY = [
  { time: "2 min", event: "Nowy stream", detail: "Racket Club Katowice — Silesia Open Finał", type: "stream", href: "/admin/clubs" },
  { time: "15 min", event: "Nowy klub", detail: "Padel Zone Lublin dołączył do platformy", type: "club", href: "/admin/clubs" },
  { time: "1h", event: "Zakup PPV", detail: "234 kupione — Silesia Open", type: "purchase", href: "/admin/finance" },
  { time: "2h", event: "Nowa subskrypcja", detail: "+18 subskrypcji kanałów", type: "sub", href: "/admin/finance" },
  { time: "3h", event: "Wypłata", detail: "Court Masters — 987 zł przelane", type: "payout", href: "/admin/finance" },
  { time: "5h", event: "Raport", detail: "Moderacja: 3 wiadomości usunięte", type: "mod", href: "/admin/moderation" },
];

const WEEKLY_DATA = [
  { day: "Pon", viewers: 1240, revenue: 6800 },
  { day: "Wt", viewers: 980, revenue: 5200 },
  { day: "Śr", viewers: 1560, revenue: 7400 },
  { day: "Czw", viewers: 1120, revenue: 6100 },
  { day: "Pt", viewers: 2340, revenue: 9800 },
  { day: "Sob", viewers: 3100, revenue: 12400 },
  { day: "Nd", viewers: 2780, revenue: 11200 },
];

const MONTHLY_DATA = [
  { day: "Tydz. 1", viewers: 8200, revenue: 32000 },
  { day: "Tydz. 2", viewers: 9400, revenue: 38000 },
  { day: "Tydz. 3", viewers: 11200, revenue: 42000 },
  { day: "Tydz. 4", viewers: 13120, revenue: 48320 },
];

const TOP_CLUBS = [
  { name: "Racket Club Katowice", slug: "racket-club-katowice", revenue: "8,420 zł", subs: 156, streams: 24 },
  { name: "Padel Kraków", slug: "padel-krakow", revenue: "5,230 zł", subs: 89, streams: 18 },
  { name: "Smash Arena Warszawa", slug: "smash-arena-warszawa", revenue: "4,890 zł", subs: 72, streams: 15 },
  { name: "Court Masters Gdańsk", slug: "court-masters-gdansk", revenue: "2,340 zł", subs: 45, streams: 8 },
  { name: "Viva Padel Poznań", slug: "viva-padel-poznan", revenue: "1,870 zł", subs: 31, streams: 6 },
];

/* ─── Types ──────────────────────────────────────────── */

type ChartPeriod = "week" | "month";
type ChartMetric = "viewers" | "revenue";
type DateRange = "7d" | "30d" | "90d";

/* ─── Activity Type Colors ───────────────────────────── */

const ACTIVITY_COLORS: Record<string, string> = {
  stream: "bg-live/20 text-live",
  club: "bg-emerald-500/20 text-emerald-400",
  purchase: "bg-lime/20 text-lime",
  sub: "bg-blue-500/20 text-blue-400",
  payout: "bg-orange/20 text-orange",
  mod: "bg-red-500/20 text-red-400",
};

const ACTIVITY_LABELS: Record<string, string> = {
  stream: "LIVE",
  club: "KLUB",
  purchase: "PPV",
  sub: "SUB",
  payout: "PAY",
  mod: "MOD",
};

/* ─── Component ──────────────────────────────────────── */

export default function AdminPage() {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("week");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("viewers");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const chartData = chartPeriod === "week" ? WEEKLY_DATA : MONTHLY_DATA;
  const maxVal = Math.max(...chartData.map((d) => chartMetric === "viewers" ? d.viewers : d.revenue));

  const fetchStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${dateRange}`);
      if (res.ok) {
        await res.json();
      }
    } catch {
      // Silently fail — static mock data already displayed
    } finally {
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    fetchStats();
  };

  const handleExportCSV = () => {
    const headers = "Dzień,Widzowie,Przychód\n";
    const rows = chartData.map((d) => `${d.day},${d.viewers},${d.revenue}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `padelvision-dashboard-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display text-2xl">Dashboard</h1>
          <p className="text-xs text-muted">
            Przegląd platformy — ostatnie{" "}
            {dateRange === "7d" ? "7 dni" : dateRange === "30d" ? "30 dni" : "90 dni"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range filter */}
          <div className="flex items-center rounded-lg border border-border bg-bg3">
            {(["7d", "30d", "90d"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-medium transition-colors",
                  dateRange === range
                    ? "bg-lime/10 text-lime"
                    : "text-muted hover:text-text"
                )}
              >
                {range === "7d" ? "7 dni" : range === "30d" ? "30 dni" : "90 dni"}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg3 text-muted transition-colors hover:bg-bg4 hover:text-text"
            title="Odśwież dane"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </button>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-bg3 px-3 text-[11px] font-medium text-muted transition-colors hover:bg-bg4 hover:text-text"
            title="Eksportuj CSV"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>

          {/* Live badge */}
          <Link
            to="/admin/clubs"
            className="flex items-center gap-1.5 rounded-full bg-live/20 px-3 py-1 text-xs font-semibold text-live transition-colors hover:bg-live/30"
          >
            <Radio className="h-3 w-3 animate-pulse" />
            2 live
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              to={kpi.href}
              className="glass-card group relative cursor-pointer p-4 transition-all duration-200 hover:border-border hover:scale-[1.02]"
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn("h-5 w-5", kpi.color)} />
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold",
                      kpi.up ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {kpi.up ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {kpi.change}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
              <p className="text-display text-2xl">{kpi.value}</p>
              <p className="text-xs text-muted">{kpi.label}</p>
              <p className="mt-1 text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {kpi.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Chart + Revenue */}
        <div className="space-y-6 lg:col-span-2">
          {/* Weekly Viewership Chart */}
          <div className="glass-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">
                {chartMetric === "viewers" ? "Widzowie" : "Przychód"} —{" "}
                {chartPeriod === "week" ? "ten tydzień" : "ten miesiąc"}
              </h2>
              <div className="flex items-center gap-2">
                {/* Metric toggle */}
                <div className="flex items-center rounded-md border border-border bg-bg3">
                  <button
                    onClick={() => setChartMetric("viewers")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-colors",
                      chartMetric === "viewers"
                        ? "bg-lime/10 text-lime"
                        : "text-muted hover:text-text"
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    Widzowie
                  </button>
                  <button
                    onClick={() => setChartMetric("revenue")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-colors",
                      chartMetric === "revenue"
                        ? "bg-lime/10 text-lime"
                        : "text-muted hover:text-text"
                    )}
                  >
                    <DollarSign className="h-3 w-3" />
                    Przychód
                  </button>
                </div>
                {/* Period toggle */}
                <div className="flex items-center rounded-md border border-border bg-bg3">
                  <button
                    onClick={() => setChartPeriod("week")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-medium transition-colors",
                      chartPeriod === "week"
                        ? "bg-lime/10 text-lime"
                        : "text-muted hover:text-text"
                    )}
                  >
                    Tydzień
                  </button>
                  <button
                    onClick={() => setChartPeriod("month")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-medium transition-colors",
                      chartPeriod === "month"
                        ? "bg-lime/10 text-lime"
                        : "text-muted hover:text-text"
                    )}
                  >
                    Miesiąc
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-3" style={{ height: 160 }}>
              {chartData.map((d, i) => {
                const val = chartMetric === "viewers" ? d.viewers : d.revenue;
                const isHovered = hoveredBar === i;
                return (
                  <div
                    key={d.day}
                    className="group relative flex flex-1 flex-col items-center gap-1 cursor-pointer"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 z-10 rounded-lg border border-border bg-bg2 px-3 py-1.5 text-center shadow-lg">
                        <p className="text-[10px] font-semibold text-lime">
                          {chartMetric === "viewers"
                            ? `${d.viewers.toLocaleString()} widzów`
                            : `${d.revenue.toLocaleString()} zł`}
                        </p>
                        <p className="text-[9px] text-muted">
                          {chartMetric === "viewers"
                            ? `${d.revenue.toLocaleString()} zł przychodu`
                            : `${d.viewers.toLocaleString()} widzów`}
                        </p>
                      </div>
                    )}
                    <span className="font-mono text-[10px] text-muted">
                      {chartMetric === "viewers"
                        ? val.toLocaleString()
                        : `${(val / 1000).toFixed(1)}k`}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-t transition-all duration-200",
                        isHovered ? "bg-lime" : "bg-lime/60"
                      )}
                      style={{ height: `${(val / maxVal) * 120}px` }}
                    />
                    <span className="text-[10px] text-muted">{d.day}</span>
                  </div>
                );
              })}
            </div>
            {/* Summary row */}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-bg3 px-3 py-2">
              <span className="text-[10px] text-muted">
                Suma: {chartData.reduce((s, d) => s + (chartMetric === "viewers" ? d.viewers : d.revenue), 0).toLocaleString()}
                {chartMetric === "revenue" ? " zł" : " widzów"}
              </span>
              <span className="text-[10px] text-muted">
                Średnia: {Math.round(chartData.reduce((s, d) => s + (chartMetric === "viewers" ? d.viewers : d.revenue), 0) / chartData.length).toLocaleString()}
                {chartMetric === "revenue" ? " zł" : " widzów"}{chartPeriod === "week" ? "/dzień" : "/tydzień"}
              </span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="glass-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">
                Podział przychodów (MRR)
              </h2>
              <Link
                to="/admin/finance"
                className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-lime"
              >
                Szczegóły
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {REVENUE_BREAKDOWN.map((src) => {
                const Icon = src.icon;
                return (
                  <Link
                    key={src.source}
                    to={src.href}
                    className="group block cursor-pointer rounded-lg p-2 transition-colors hover:bg-bg3"
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-muted group-hover:text-text">
                        <Icon className="h-3.5 w-3.5" />
                        {src.source}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-text">{src.amount}</span>
                        <span className="rounded bg-bg4 px-1.5 py-0.5 text-[10px] text-muted">
                          {src.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg4">
                      <div
                        className="h-full rounded-full bg-lime/50 transition-all group-hover:bg-lime/70"
                        style={{ width: `${src.pct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link
              to="/admin/finance"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-lime/10 p-3 text-center transition-colors hover:bg-lime/20"
            >
              <div>
                <p className="text-xs text-muted">Łączny MRR</p>
                <p className="text-display text-2xl text-lime">48,320 zł</p>
              </div>
              <ChevronRight className="h-5 w-5 text-lime/50" />
            </Link>
          </div>
        </div>

        {/* Right: Activity + Top Clubs */}
        <div className="space-y-4">
          {/* Recent Activity */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-text">
                Ostatnia aktywność
              </h2>
              <button
                onClick={handleRefresh}
                className="text-[10px] text-muted transition-colors hover:text-lime"
              >
                Odśwież
              </button>
            </div>
            <div className="divide-y divide-border">
              {RECENT_ACTIVITY.map((a, i) => (
                <Link
                  key={i}
                  to={a.href}
                  className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-bg3"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold",
                      ACTIVITY_COLORS[a.type] || "bg-bg4 text-muted"
                    )}
                  >
                    {ACTIVITY_LABELS[a.type] || a.type.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-text group-hover:text-lime">
                        {a.event}
                      </p>
                      <span className="flex-shrink-0 text-[10px] text-muted">{a.time}</span>
                    </div>
                    <p className="truncate text-[10px] text-muted">{a.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              to="/admin/moderation"
              className="flex items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-[11px] text-muted transition-colors hover:bg-bg3 hover:text-lime"
            >
              Zobacz wszystkie
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Top Clubs */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-text">
                Top kluby (przychód)
              </h2>
              <Link
                to="/admin/clubs"
                className="text-[10px] text-muted transition-colors hover:text-lime"
              >
                Wszystkie →
              </Link>
            </div>
            <div className="divide-y divide-border">
              {TOP_CLUBS.map((club, i) => (
                <Link
                  key={i}
                  to={`/club/${club.slug}`}
                  className="group flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-bg3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg4 text-[10px] font-bold text-lime">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-text group-hover:text-lime">
                        {club.name}
                      </p>
                      <p className="text-[10px] text-muted">
                        {club.subs} sub · {club.streams} streamów
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-lime">
                      {club.revenue}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
            <Link
              to="/admin/clubs"
              className="flex items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-[11px] text-muted transition-colors hover:bg-bg3 hover:text-lime"
            >
              Zarządzaj klubami
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
