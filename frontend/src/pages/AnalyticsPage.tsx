import { useState, useMemo, useCallback } from "react";
import {
  Users,
  Eye,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MessageSquare,
  BarChart3,
  Calendar,
  PlayCircle,
  ChevronRight,
  Activity,
  Globe,
  Zap,
  Target,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

type Period = "7d" | "30d" | "90d";

interface StatCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: typeof Eye;
  detail?: string;
}

/* ─── Data by Period ──────────────────────────────── */

const DATA_BY_PERIOD: Record<Period, {
  stats: StatCard[];
  viewerChart: { label: string; value: number; date: string }[];
  hourlyChart: number[];
  revenueChart: { label: string; value: number }[];
  topStreams: { title: string; viewers: number; date: string; duration: string; peakViewers: number; avgWatchTime: string }[];
  revenue: { source: string; amount: string; pct: number; change: string; up: boolean }[];
  geoData: { city: string; viewers: number; pct: number }[];
  engagement: { label: string; value: string; change: string; up: boolean; icon: typeof Eye }[];
  totalRevenue: string;
}> = {
  "7d": {
    stats: [
      { label: "Widzowie (7d)", value: "12,847", change: "+23%", up: true, icon: Eye, detail: "vs poprzedni tydzień" },
      { label: "Unikalni widzowie", value: "4,312", change: "+11%", up: true, icon: Users, detail: "vs poprzedni tydzień" },
      { label: "Szczytowa widownia", value: "4,291", change: "+15%", up: true, icon: TrendingUp, detail: "Silesia Open Finał" },
      { label: "Przychody (7d)", value: "487 zł", change: "+18%", up: true, icon: Coins, detail: "vs poprzedni tydzień" },
    ],
    viewerChart: [
      { label: "Pn", value: 1240, date: "10 mar" },
      { label: "Wt", value: 1890, date: "11 mar" },
      { label: "Śr", value: 980, date: "12 mar" },
      { label: "Cz", value: 2340, date: "13 mar" },
      { label: "Pt", value: 3210, date: "14 mar" },
      { label: "So", value: 2780, date: "15 mar" },
      { label: "Nd", value: 4291, date: "16 mar" },
    ],
    hourlyChart: [12, 8, 5, 3, 2, 4, 15, 45, 62, 78, 85, 92, 100, 95, 88, 92, 98, 95, 85, 90, 72, 55, 38, 22],
    revenueChart: [
      { label: "Pn", value: 42 },
      { label: "Wt", value: 68 },
      { label: "Śr", value: 35 },
      { label: "Cz", value: 89 },
      { label: "Pt", value: 95 },
      { label: "So", value: 78 },
      { label: "Nd", value: 80 },
    ],
    topStreams: [
      { title: "Silesia Open 2026 — Finał OPEN A", viewers: 4291, date: "16 mar", duration: "3h 42m", peakViewers: 4291, avgWatchTime: "1h 12m" },
      { title: "Silesia Open 2026 — Półfinał 1", viewers: 2891, date: "15 mar", duration: "2h 18m", peakViewers: 3102, avgWatchTime: "54m" },
      { title: "Liga Weekendowa — Runda 5", viewers: 1532, date: "14 mar", duration: "4h 05m", peakViewers: 1891, avgWatchTime: "1h 28m" },
      { title: "Americano Night #12", viewers: 987, date: "12 mar", duration: "2h 30m", peakViewers: 1105, avgWatchTime: "42m" },
      { title: "Silesia Open 2026 — Ćwierćfinał 2", viewers: 876, date: "15 mar", duration: "1h 55m", peakViewers: 1023, avgWatchTime: "38m" },
    ],
    revenue: [
      { source: "Subskrypcje kanału", amount: "215 zł", pct: 44, change: "+12%", up: true },
      { source: "Piłki (Bits)", amount: "142 zł", pct: 29, change: "+34%", up: true },
      { source: "PPV", amount: "98 zł", pct: 20, change: "+8%", up: true },
      { source: "Reklamy", amount: "32 zł", pct: 7, change: "-5%", up: false },
    ],
    geoData: [
      { city: "Katowice", viewers: 3842, pct: 30 },
      { city: "Kraków", viewers: 2156, pct: 17 },
      { city: "Warszawa", viewers: 1923, pct: 15 },
      { city: "Wrocław", viewers: 1284, pct: 10 },
      { city: "Gdańsk", viewers: 897, pct: 7 },
      { city: "Inne", viewers: 2745, pct: 21 },
    ],
    engagement: [
      { label: "Śr. czas oglądania", value: "47 min", change: "+12%", up: true, icon: Clock },
      { label: "Wiadomości czatu", value: "8,432", change: "+28%", up: true, icon: MessageSquare },
      { label: "Piłki wysłane", value: "1,247", change: "+45%", up: true, icon: Zap },
      { label: "Klipy utworzone", value: "89", change: "+67%", up: true, icon: PlayCircle },
    ],
    totalRevenue: "487 zł",
  },
  "30d": {
    stats: [
      { label: "Widzowie (30d)", value: "48,291", change: "+18%", up: true, icon: Eye, detail: "vs poprzedni miesiąc" },
      { label: "Unikalni widzowie", value: "12,847", change: "+8%", up: true, icon: Users, detail: "vs poprzedni miesiąc" },
      { label: "Szczytowa widownia", value: "4,291", change: "+15%", up: true, icon: TrendingUp, detail: "Silesia Open Finał" },
      { label: "Przychody (30d)", value: "1,847 zł", change: "-3%", up: false, icon: Coins, detail: "vs poprzedni miesiąc" },
    ],
    viewerChart: [
      { label: "Tydz 1", value: 8240, date: "17-23 lut" },
      { label: "Tydz 2", value: 11890, date: "24 lut-2 mar" },
      { label: "Tydz 3", value: 15320, date: "3-9 mar" },
      { label: "Tydz 4", value: 12847, date: "10-16 mar" },
    ],
    hourlyChart: [15, 10, 6, 4, 3, 5, 18, 48, 65, 80, 88, 94, 100, 97, 90, 94, 99, 96, 87, 92, 75, 58, 40, 25],
    revenueChart: [
      { label: "Tydz 1", value: 380 },
      { label: "Tydz 2", value: 520 },
      { label: "Tydz 3", value: 460 },
      { label: "Tydz 4", value: 487 },
    ],
    topStreams: [
      { title: "Silesia Open 2026 — Finał OPEN A", viewers: 4291, date: "16 mar", duration: "3h 42m", peakViewers: 4291, avgWatchTime: "1h 12m" },
      { title: "Silesia Open 2026 — Półfinał 1", viewers: 2891, date: "15 mar", duration: "2h 18m", peakViewers: 3102, avgWatchTime: "54m" },
      { title: "Liga Weekendowa — Runda 5", viewers: 1532, date: "14 mar", duration: "4h 05m", peakViewers: 1891, avgWatchTime: "1h 28m" },
      { title: "Trening pokazowy — Kowalski", viewers: 1247, date: "8 mar", duration: "1h 15m", peakViewers: 1450, avgWatchTime: "32m" },
      { title: "Americano Night #12", viewers: 987, date: "12 mar", duration: "2h 30m", peakViewers: 1105, avgWatchTime: "42m" },
      { title: "Liga Weekendowa — Runda 4", viewers: 934, date: "7 mar", duration: "3h 50m", peakViewers: 1102, avgWatchTime: "1h 05m" },
      { title: "Turniej Firmowy KPMG", viewers: 812, date: "1 mar", duration: "5h 10m", peakViewers: 945, avgWatchTime: "48m" },
    ],
    revenue: [
      { source: "Subskrypcje kanału", amount: "890 zł", pct: 48, change: "+5%", up: true },
      { source: "Piłki (Bits)", amount: "520 zł", pct: 28, change: "+22%", up: true },
      { source: "PPV", amount: "312 zł", pct: 17, change: "-8%", up: false },
      { source: "Reklamy", amount: "125 zł", pct: 7, change: "-12%", up: false },
    ],
    geoData: [
      { city: "Katowice", viewers: 14487, pct: 30 },
      { city: "Kraków", viewers: 8209, pct: 17 },
      { city: "Warszawa", viewers: 7244, pct: 15 },
      { city: "Wrocław", viewers: 4829, pct: 10 },
      { city: "Gdańsk", viewers: 3380, pct: 7 },
      { city: "Inne", viewers: 10142, pct: 21 },
    ],
    engagement: [
      { label: "Śr. czas oglądania", value: "42 min", change: "+8%", up: true, icon: Clock },
      { label: "Wiadomości czatu", value: "32,156", change: "+15%", up: true, icon: MessageSquare },
      { label: "Piłki wysłane", value: "4,832", change: "+32%", up: true, icon: Zap },
      { label: "Klipy utworzone", value: "312", change: "+52%", up: true, icon: PlayCircle },
    ],
    totalRevenue: "1,847 zł",
  },
  "90d": {
    stats: [
      { label: "Widzowie (90d)", value: "142,563", change: "+42%", up: true, icon: Eye, detail: "vs poprzedni kwartał" },
      { label: "Unikalni widzowie", value: "38,291", change: "+25%", up: true, icon: Users, detail: "vs poprzedni kwartał" },
      { label: "Szczytowa widownia", value: "4,291", change: "+35%", up: true, icon: TrendingUp, detail: "Silesia Open Finał" },
      { label: "Przychody (90d)", value: "5,432 zł", change: "+28%", up: true, icon: Coins, detail: "vs poprzedni kwartał" },
    ],
    viewerChart: [
      { label: "Sty", value: 38200, date: "Styczeń" },
      { label: "Lut", value: 45800, date: "Luty" },
      { label: "Mar", value: 58563, date: "Marzec" },
    ],
    hourlyChart: [14, 9, 5, 3, 2, 4, 16, 46, 63, 79, 86, 93, 100, 96, 89, 93, 98, 95, 86, 91, 73, 56, 39, 23],
    revenueChart: [
      { label: "Sty", value: 1520 },
      { label: "Lut", value: 2065 },
      { label: "Mar", value: 1847 },
    ],
    topStreams: [
      { title: "Silesia Open 2026 — Finał OPEN A", viewers: 4291, date: "16 mar", duration: "3h 42m", peakViewers: 4291, avgWatchTime: "1h 12m" },
      { title: "Noworoczny Turniej Padel", viewers: 3845, date: "6 sty", duration: "6h 20m", peakViewers: 4102, avgWatchTime: "1h 34m" },
      { title: "Silesia Open 2026 — Półfinał 1", viewers: 2891, date: "15 mar", duration: "2h 18m", peakViewers: 3102, avgWatchTime: "54m" },
      { title: "Walentynkowy Mixt", viewers: 2654, date: "14 lut", duration: "4h 45m", peakViewers: 2980, avgWatchTime: "1h 08m" },
      { title: "Liga Weekendowa — Runda 5", viewers: 1532, date: "14 mar", duration: "4h 05m", peakViewers: 1891, avgWatchTime: "1h 28m" },
    ],
    revenue: [
      { source: "Subskrypcje kanału", amount: "2,680 zł", pct: 49, change: "+18%", up: true },
      { source: "Piłki (Bits)", amount: "1,450 zł", pct: 27, change: "+45%", up: true },
      { source: "PPV", amount: "920 zł", pct: 17, change: "+12%", up: true },
      { source: "Reklamy", amount: "382 zł", pct: 7, change: "+5%", up: true },
    ],
    geoData: [
      { city: "Katowice", viewers: 42769, pct: 30 },
      { city: "Kraków", viewers: 24236, pct: 17 },
      { city: "Warszawa", viewers: 21384, pct: 15 },
      { city: "Wrocław", viewers: 14256, pct: 10 },
      { city: "Gdańsk", viewers: 9979, pct: 7 },
      { city: "Inne", viewers: 29939, pct: 21 },
    ],
    engagement: [
      { label: "Śr. czas oglądania", value: "39 min", change: "+15%", up: true, icon: Clock },
      { label: "Wiadomości czatu", value: "95,432", change: "+38%", up: true, icon: MessageSquare },
      { label: "Piłki wysłane", value: "14,289", change: "+62%", up: true, icon: Zap },
      { label: "Klipy utworzone", value: "892", change: "+78%", up: true, icon: PlayCircle },
    ],
    totalRevenue: "5,432 zł",
  },
};

/* ─── SVG Line Chart ──────────────────────────────── */

function LineChart({
  data,
  color = "#C8FF00",
  height = 180,
  showArea = true,
  valuePrefix = "",
  valueSuffix = "",
}: {
  data: { label: string; value: number; date?: string }[];
  color?: string;
  height?: number;
  showArea?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const padding = { top: 20, bottom: 30, left: 10, right: 10 };
  const chartW = 100;
  const chartH = height;
  const usableW = chartW - padding.left - padding.right;
  const usableH = chartH - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * usableW,
    y: padding.top + usableH - ((d.value - minVal) / range) * usableH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + usableH} L ${points[0].x} ${padding.top + usableH} Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            y1={padding.top + usableH * (1 - pct)}
            x2={chartW - padding.right}
            y2={padding.top + usableH * (1 - pct)}
            stroke="rgb(42 43 56)"
            strokeWidth="0.2"
          />
        ))}

        {/* Area fill */}
        {showArea && (
          <path d={areaPath} fill={`${color}15`} />
        )}

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 1.8 : 1}
              fill={hoveredIdx === i ? color : "transparent"}
              stroke={color}
              strokeWidth="0.5"
            />
            {/* Invisible hover target */}
            <rect
              x={p.x - usableW / data.length / 2}
              y={padding.top}
              width={usableW / data.length}
              height={usableH}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "crosshair" }}
            />
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={points[i].x}
            y={chartH - 5}
            textAnchor="middle"
            fill="rgb(120 120 160)"
            fontSize="3"
            fontFamily="DM Sans, sans-serif"
          >
            {d.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-bg2 px-3 py-2 shadow-xl"
          style={{
            left: `${(points[hoveredIdx].x / chartW) * 100}%`,
            top: `${(points[hoveredIdx].y / chartH) * 100 - 15}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-bold text-text">
            {valuePrefix}{data[hoveredIdx].value.toLocaleString()}{valueSuffix}
          </p>
          {data[hoveredIdx].date && (
            <p className="text-[10px] text-muted">{data[hoveredIdx].date}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Heatmap for hourly data ─────────────────────── */

function HourlyHeatmap({ data }: { data: number[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data);

  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {data.map((val, i) => {
          const intensity = val / max;
          return (
            <div
              key={i}
              className="relative flex aspect-square items-center justify-center rounded-sm transition-transform hover:scale-125"
              style={{
                backgroundColor: `rgba(200, 255, 0, ${intensity * 0.8})`,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <div className="pointer-events-none absolute -top-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-bg2 px-2 py-1 shadow-xl">
                  <p className="text-[10px] font-bold text-text">{val}% aktywności</p>
                  <p className="text-[9px] text-muted">{String(i).padStart(2, "0")}:00</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-muted">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

/* ─── Bar Chart ───────────────────────────────────── */

function BarChart({
  data,
  color = "#C8FF00",
  height = 160,
  valuePrefix = "",
  valueSuffix = "",
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 30);
        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center gap-1"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-bg2 px-2 py-1 shadow-xl">
                <p className="text-[10px] font-bold text-text">
                  {valuePrefix}{d.value.toLocaleString()}{valueSuffix}
                </p>
              </div>
            )}
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: barH,
                backgroundColor: hovered === i ? color : `${color}99`,
              }}
            />
            <span className="text-[10px] text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────── */

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [expandedStream, setExpandedStream] = useState<number | null>(null);

  const data = DATA_BY_PERIOD[period];

  const periods: { key: Period; label: string }[] = [
    { key: "7d", label: "7 dni" },
    { key: "30d", label: "30 dni" },
    { key: "90d", label: "90 dni" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display text-2xl">Analityki</h1>
          <p className="text-sm text-muted">Racket Club Katowice</p>
        </div>
        {/* Period Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-bg3 p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                period === p.key
                  ? "bg-lime text-black"
                  : "text-muted hover:text-text"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-4 transition-colors hover:border-lime/30">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg3">
                  <Icon className="h-4 w-4 text-muted" />
                </div>
                <span
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    stat.up
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-live/10 text-live"
                  )}
                >
                  {stat.up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 text-display text-2xl">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
              {stat.detail && (
                <p className="mt-0.5 text-[10px] text-muted/60">{stat.detail}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row 1: Viewership + Revenue */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Viewership Chart */}
        <div className="glass-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-lime" />
              <h3 className="text-sm font-semibold text-text">Oglądalność</h3>
            </div>
            <span className="text-xs text-muted">
              {period === "7d" ? "Dziennie" : period === "30d" ? "Tygodniowo" : "Miesięcznie"}
            </span>
          </div>
          <LineChart data={data.viewerChart} color="#C8FF00" valueSuffix=" widzów" />
        </div>

        {/* Revenue Chart */}
        <div className="glass-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-orange" />
              <h3 className="text-sm font-semibold text-text">Przychody</h3>
            </div>
            <span className="rounded-full bg-lime/10 px-2 py-0.5 text-xs font-bold text-lime">
              {data.totalRevenue}
            </span>
          </div>
          <BarChart data={data.revenueChart} color="#FF6A00" valuePrefix="" valueSuffix=" zł" height={180} />
        </div>
      </div>

      {/* Charts Row 2: Peak Hours + Engagement */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Peak Hours Heatmap */}
        <div className="glass-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-lime" />
            <h3 className="text-sm font-semibold text-text">Godziny szczytu</h3>
          </div>
          <p className="mb-3 text-xs text-muted">
            Najwyższa aktywność w godzinach 12:00–20:00. Planuj transmisje w tych godzinach!
          </p>
          <HourlyHeatmap data={data.hourlyChart} />
        </div>

        {/* Engagement Stats */}
        <div className="glass-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-lime" />
            <h3 className="text-sm font-semibold text-text">Zaangażowanie</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.engagement.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.label} className="rounded-lg bg-bg3 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Icon className="h-4 w-4 text-muted" />
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        e.up ? "text-emerald-400" : "text-live"
                      )}
                    >
                      {e.up ? "↑" : "↓"} {e.change}
                    </span>
                  </div>
                  <p className="text-display text-lg">{e.value}</p>
                  <p className="text-[10px] text-muted">{e.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Revenue Breakdown + Geography */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <div className="glass-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-lime" />
            <h3 className="text-sm font-semibold text-text">Podział przychodów</h3>
          </div>
          <div className="space-y-3">
            {data.revenue.map((item) => (
              <div key={item.source}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text">{item.source}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        item.up ? "text-emerald-400" : "text-live"
                      )}
                    >
                      {item.change}
                    </span>
                    <span className="font-mono text-sm font-bold text-text">{item.amount}</span>
                  </div>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg4">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.pct}%`,
                      background: `linear-gradient(90deg, #C8FF00 0%, #FF6A00 ${100 + item.pct}%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-bg3 p-3 text-center">
            <p className="text-xs text-muted">Suma przychodów</p>
            <p className="text-display text-2xl text-lime">{data.totalRevenue}</p>
          </div>
        </div>

        {/* Geography */}
        <div className="glass-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-lime" />
            <h3 className="text-sm font-semibold text-text">Lokalizacje widzów</h3>
          </div>
          <div className="space-y-2">
            {data.geoData.map((geo, i) => (
              <div key={geo.city} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-muted">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text">{geo.city}</span>
                    <span className="text-xs text-muted">
                      {geo.viewers.toLocaleString()} ({geo.pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg4">
                    <div
                      className="h-full rounded-full bg-lime transition-all duration-500"
                      style={{ width: `${geo.pct}%`, opacity: 1 - i * 0.12 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-bg3 p-2.5">
            <Globe className="h-3.5 w-3.5 text-muted" />
            <span className="text-xs text-muted">
              Widzowie z {data.geoData.length} lokalizacji
            </span>
          </div>
        </div>
      </div>

      {/* Top Streams */}
      <div className="glass-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-lime" />
            <h3 className="text-sm font-semibold text-text">Top streamy</h3>
          </div>
          <span className="text-xs text-muted">{data.topStreams.length} transmisji</span>
        </div>
        <div className="space-y-1">
          {data.topStreams.map((stream, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedStream(expandedStream === i ? null : i)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left transition-colors",
                  expandedStream === i ? "bg-bg4" : "bg-bg3 hover:bg-bg3/80"
                )}
              >
                <span className="text-display text-lg text-muted w-8">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-text">{stream.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {stream.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {stream.duration}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-lime">
                  <Eye className="h-3.5 w-3.5" />
                  {stream.viewers.toLocaleString()}
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted transition-transform",
                    expandedStream === i && "rotate-90"
                  )}
                />
              </button>

              {/* Expanded details */}
              {expandedStream === i && (
                <div className="mx-4 mb-1 grid grid-cols-3 gap-3 rounded-b-lg bg-bg4 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted">Szczyt widzów</p>
                    <p className="text-display text-lg text-lime">{stream.peakViewers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted">Śr. czas oglądania</p>
                    <p className="text-display text-lg">{stream.avgWatchTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted">Czas trwania</p>
                    <p className="text-display text-lg">{stream.duration}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
