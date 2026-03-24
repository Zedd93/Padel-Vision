import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wallet,
  Coins,
  CreditCard,
  Users,
  Film,
  TrendingUp,
  TrendingDown,
  Clock,
  Loader2,
  Check,
  X,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  PieChart,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────── */

interface PayoutEntry {
  date: string;
  amount: string;
  amountNum: number;
  status: "completed" | "pending" | "failed";
  method: string;
}

interface MonthlyData {
  month: string;
  shortMonth: string;
  subs: number;
  bits: number;
  ppv: number;
  ads: number;
  total: number;
}

interface PeriodData {
  stats: {
    balance: number;
    totalRevenue: number;
    totalRevenueChange: number;
    activeSubs: number;
    subsChange: number;
    avgRevenuePerStream: number;
    avgChange: number;
    lastPayout: number;
  };
  sources: {
    source: string;
    icon: "users" | "coins" | "film" | "zap";
    count: string;
    gross: number;
    net: number;
    pct: number;
    change: number;
  }[];
  monthly: MonthlyData[];
  topEvents: {
    name: string;
    date: string;
    revenue: number;
    viewers: number;
    type: "ppv" | "sub" | "bits";
  }[];
}

/* ─── Data per period ────────────────────────────── */

const DATA_BY_PERIOD: Record<string, PeriodData> = {
  "30d": {
    stats: {
      balance: 2847,
      totalRevenue: 4650,
      totalRevenueChange: 23,
      activeSubs: 156,
      subsChange: 12,
      avgRevenuePerStream: 387,
      avgChange: 8,
      lastPayout: 1420,
    },
    sources: [
      { source: "Subskrypcje kanału", icon: "users", count: "156 sub", gross: 1404, net: 983, pct: 70, change: 12 },
      { source: "Piłki (Bits)", icon: "coins", count: "8 420 piłek", gross: 842, net: 589, pct: 70, change: 34 },
      { source: "PPV — Turnieje", icon: "film", count: "234 kupione", gross: 3497, net: 3078, pct: 88, change: -5 },
      { source: "Reklamy", icon: "zap", count: "48 200 wyśw.", gross: 142, net: 99, pct: 70, change: 18 },
    ],
    monthly: [
      { month: "Październik", shortMonth: "Paź", subs: 620, bits: 310, ppv: 1200, ads: 45, total: 2175 },
      { month: "Listopad", shortMonth: "Lis", subs: 710, bits: 420, ppv: 890, ads: 52, total: 2072 },
      { month: "Grudzień", shortMonth: "Gru", subs: 780, bits: 380, ppv: 2100, ads: 68, total: 3328 },
      { month: "Styczeń", shortMonth: "Sty", subs: 850, bits: 450, ppv: 980, ads: 72, total: 2352 },
      { month: "Luty", shortMonth: "Lut", subs: 920, bits: 520, ppv: 1450, ads: 85, total: 2975 },
      { month: "Marzec", shortMonth: "Mar", subs: 983, bits: 589, ppv: 3078, ads: 99, total: 4749 },
    ],
    topEvents: [
      { name: "Silesia Open 2026 — Finał PPV", date: "16 mar", revenue: 2340, viewers: 4291, type: "ppv" },
      { name: "Americano Night #12 — Bity", date: "12 mar", revenue: 420, viewers: 987, type: "bits" },
      { name: "Liga Weekendowa — Subskrypcje", date: "14 mar", revenue: 315, viewers: 1532, type: "sub" },
      { name: "Trening VIP — PPV", date: "8 mar", revenue: 298, viewers: 456, type: "ppv" },
      { name: "Silesia Open — Półfinał PPV", date: "15 mar", revenue: 187, viewers: 2891, type: "ppv" },
    ],
  },
  "90d": {
    stats: {
      balance: 2847,
      totalRevenue: 12340,
      totalRevenueChange: 31,
      activeSubs: 156,
      subsChange: 45,
      avgRevenuePerStream: 412,
      avgChange: 15,
      lastPayout: 1420,
    },
    sources: [
      { source: "Subskrypcje kanału", icon: "users", count: "312 sub łącznie", gross: 4200, net: 2940, pct: 70, change: 45 },
      { source: "Piłki (Bits)", icon: "coins", count: "24 800 piłek", gross: 2480, net: 1736, pct: 70, change: 62 },
      { source: "PPV — Turnieje", icon: "film", count: "687 kupione", gross: 8240, net: 7251, pct: 88, change: 18 },
      { source: "Reklamy", icon: "zap", count: "142 000 wyśw.", gross: 591, net: 413, pct: 70, change: 28 },
    ],
    monthly: [
      { month: "Październik", shortMonth: "Paź", subs: 620, bits: 310, ppv: 1200, ads: 45, total: 2175 },
      { month: "Listopad", shortMonth: "Lis", subs: 710, bits: 420, ppv: 890, ads: 52, total: 2072 },
      { month: "Grudzień", shortMonth: "Gru", subs: 780, bits: 380, ppv: 2100, ads: 68, total: 3328 },
      { month: "Styczeń", shortMonth: "Sty", subs: 850, bits: 450, ppv: 980, ads: 72, total: 2352 },
      { month: "Luty", shortMonth: "Lut", subs: 920, bits: 520, ppv: 1450, ads: 85, total: 2975 },
      { month: "Marzec", shortMonth: "Mar", subs: 983, bits: 589, ppv: 3078, ads: 99, total: 4749 },
    ],
    topEvents: [
      { name: "Silesia Open 2026 — Finał PPV", date: "16 mar", revenue: 2340, viewers: 4291, type: "ppv" },
      { name: "Turniej Świąteczny PPV", date: "22 gru", revenue: 1890, viewers: 3120, type: "ppv" },
      { name: "Liga Weekendowa Finał — Bity", date: "28 lut", revenue: 780, viewers: 2100, type: "bits" },
      { name: "Americano Night #12 — Bity", date: "12 mar", revenue: 420, viewers: 987, type: "bits" },
      { name: "Noworoczny Open PPV", date: "5 sty", revenue: 1450, viewers: 2800, type: "ppv" },
      { name: "Liga Weekendowa — Subskrypcje", date: "14 mar", revenue: 315, viewers: 1532, type: "sub" },
      { name: "Trening VIP — PPV", date: "8 mar", revenue: 298, viewers: 456, type: "ppv" },
    ],
  },
  "12m": {
    stats: {
      balance: 2847,
      totalRevenue: 38420,
      totalRevenueChange: 87,
      activeSubs: 156,
      subsChange: 120,
      avgRevenuePerStream: 356,
      avgChange: 22,
      lastPayout: 1420,
    },
    sources: [
      { source: "Subskrypcje kanału", icon: "users", count: "1 247 sub łącznie", gross: 12600, net: 8820, pct: 70, change: 120 },
      { source: "Piłki (Bits)", icon: "coins", count: "68 400 piłek", gross: 6840, net: 4788, pct: 70, change: 95 },
      { source: "PPV — Turnieje", icon: "film", count: "2 140 kupione", gross: 24800, net: 21824, pct: 88, change: 45 },
      { source: "Reklamy", icon: "zap", count: "520 000 wyśw.", gross: 4260, net: 2988, pct: 70, change: 68 },
    ],
    monthly: [
      { month: "Kwiecień '25", shortMonth: "Kwi", subs: 280, bits: 120, ppv: 450, ads: 18, total: 868 },
      { month: "Maj '25", shortMonth: "Maj", subs: 340, bits: 180, ppv: 620, ads: 22, total: 1162 },
      { month: "Czerwiec '25", shortMonth: "Cze", subs: 420, bits: 210, ppv: 380, ads: 28, total: 1038 },
      { month: "Lipiec '25", shortMonth: "Lip", subs: 380, bits: 190, ppv: 290, ads: 25, total: 885 },
      { month: "Sierpień '25", shortMonth: "Sie", subs: 450, bits: 240, ppv: 520, ads: 32, total: 1242 },
      { month: "Wrzesień '25", shortMonth: "Wrz", subs: 520, bits: 280, ppv: 780, ads: 38, total: 1618 },
      { month: "Październik '25", shortMonth: "Paź", subs: 620, bits: 310, ppv: 1200, ads: 45, total: 2175 },
      { month: "Listopad '25", shortMonth: "Lis", subs: 710, bits: 420, ppv: 890, ads: 52, total: 2072 },
      { month: "Grudzień '25", shortMonth: "Gru", subs: 780, bits: 380, ppv: 2100, ads: 68, total: 3328 },
      { month: "Styczeń '26", shortMonth: "Sty", subs: 850, bits: 450, ppv: 980, ads: 72, total: 2352 },
      { month: "Luty '26", shortMonth: "Lut", subs: 920, bits: 520, ppv: 1450, ads: 85, total: 2975 },
      { month: "Marzec '26", shortMonth: "Mar", subs: 983, bits: 589, ppv: 3078, ads: 99, total: 4749 },
    ],
    topEvents: [
      { name: "Silesia Open 2026 — Finał PPV", date: "16 mar", revenue: 2340, viewers: 4291, type: "ppv" },
      { name: "Turniej Świąteczny PPV", date: "22 gru", revenue: 1890, viewers: 3120, type: "ppv" },
      { name: "Noworoczny Open PPV", date: "5 sty", revenue: 1450, viewers: 2800, type: "ppv" },
      { name: "Padel Masters Kraków PPV", date: "10 paź", revenue: 1120, viewers: 2450, type: "ppv" },
      { name: "Liga Weekendowa Finał — Bity", date: "28 lut", revenue: 780, viewers: 2100, type: "bits" },
      { name: "Letni Turniej Wrocław PPV", date: "18 sie", revenue: 650, viewers: 1800, type: "ppv" },
      { name: "Americano Night #12 — Bity", date: "12 mar", revenue: 420, viewers: 987, type: "bits" },
    ],
  },
};

const PERIODS = [
  { key: "30d", label: "30 dni" },
  { key: "90d", label: "90 dni" },
  { key: "12m", label: "12 mies." },
];

const INITIAL_PAYOUTS: PayoutEntry[] = [
  { date: "2026-02-28", amount: "1 420 zł", amountNum: 1420, status: "completed", method: "Przelew bankowy" },
  { date: "2026-01-31", amount: "987 zł", amountNum: 987, status: "completed", method: "Przelew bankowy" },
  { date: "2025-12-31", amount: "1 245 zł", amountNum: 1245, status: "completed", method: "Przelew bankowy" },
  { date: "2025-11-30", amount: "892 zł", amountNum: 892, status: "completed", method: "Przelew bankowy" },
  { date: "2025-10-31", amount: "1 102 zł", amountNum: 1102, status: "completed", method: "Przelew bankowy" },
  { date: "2025-09-30", amount: "756 zł", amountNum: 756, status: "completed", method: "Przelew bankowy" },
];

const ICON_MAP = {
  users: Users,
  coins: Coins,
  film: Film,
  zap: Zap,
};

/* ─── SVG Stacked Bar Chart ──────────────────────── */

function RevenueChart({ data }: { data: MonthlyData[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxTotal = Math.max(...data.map((d) => d.total));
  const chartW = 600;
  const chartH = 220;
  const padL = 50;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const usableW = chartW - padL - padR;
  const usableH = chartH - padT - padB;
  const barW = Math.min(40, (usableW / data.length) * 0.6);
  const gap = usableW / data.length;

  const yScale = (v: number) => padT + usableH - (v / maxTotal) * usableH;

  // Grid lines
  const gridLines = 4;
  const gridStep = maxTotal / gridLines;

  const colors = {
    subs: "#C8FF00",
    bits: "#f97316",
    ppv: "#3b82f6",
    ads: "#8b5cf6",
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const val = Math.round(gridStep * i);
          const y = yScale(val);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="JetBrains Mono, monospace">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = padL + gap * i + gap / 2;
          const bx = cx - barW / 2;
          const isHovered = hoveredIdx === i;

          // Stack: subs → bits → ppv → ads (bottom to top)
          const segments = [
            { key: "subs", val: d.subs, color: colors.subs },
            { key: "bits", val: d.bits, color: colors.bits },
            { key: "ppv", val: d.ppv, color: colors.ppv },
            { key: "ads", val: d.ads, color: colors.ads },
          ];

          let cumY = 0;
          const bars = segments.map((seg) => {
            const h = (seg.val / maxTotal) * usableH;
            const y = yScale(cumY + seg.val);
            cumY += seg.val;
            return { ...seg, y, h };
          });

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Hover background */}
              {isHovered && (
                <rect
                  x={cx - gap / 2}
                  y={padT}
                  width={gap}
                  height={usableH}
                  fill="rgba(255,255,255,0.03)"
                  rx="4"
                />
              )}

              {/* Stacked bars */}
              {bars.map((b) => (
                <rect
                  key={b.key}
                  x={bx}
                  y={b.y}
                  width={barW}
                  height={Math.max(0, b.h)}
                  fill={b.color}
                  opacity={isHovered ? 1 : 0.8}
                  rx="3"
                />
              ))}

              {/* Month label */}
              <text
                x={cx}
                y={chartH - 6}
                textAnchor="middle"
                fill={isHovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"}
                fontSize="10"
                fontWeight={isHovered ? "600" : "400"}
              >
                {d.shortMonth}
              </text>

              {/* Total on top when hovered */}
              {isHovered && (
                <text
                  x={cx}
                  y={yScale(d.total) - 6}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.total.toLocaleString()} zł
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-bg2 px-3 py-2 shadow-xl"
          style={{
            left: `${((padL + gap * hoveredIdx + gap / 2) / chartW) * 100}%`,
            top: "10px",
            transform: "translateX(-50%)",
          }}
        >
          <p className="mb-1 text-xs font-semibold text-text">{data[hoveredIdx].month}</p>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors.subs }} />
              <span className="text-muted">Subskrypcje:</span>
              <span className="font-mono text-text">{data[hoveredIdx].subs} zł</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors.bits }} />
              <span className="text-muted">Piłki:</span>
              <span className="font-mono text-text">{data[hoveredIdx].bits} zł</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors.ppv }} />
              <span className="text-muted">PPV:</span>
              <span className="font-mono text-text">{data[hoveredIdx].ppv} zł</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors.ads }} />
              <span className="text-muted">Reklamy:</span>
              <span className="font-mono text-text">{data[hoveredIdx].ads} zł</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-[11px]">
        {[
          { label: "Subskrypcje", color: colors.subs },
          { label: "Piłki", color: colors.bits },
          { label: "PPV", color: colors.ppv },
          { label: "Reklamy", color: colors.ads },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
            <span className="text-muted">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Donut Chart ────────────────────────────────── */

function DonutChart({ sources }: { sources: PeriodData["sources"] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = sources.reduce((s, src) => s + src.net, 0);
  const colorMap: Record<string, string> = {
    users: "#C8FF00",
    coins: "#f97316",
    film: "#3b82f6",
    zap: "#8b5cf6",
  };

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  const strokeW = 20;

  let cumAngle = -90; // start from top
  const arcs = sources.map((src, i) => {
    const pct = src.net / total;
    const angle = pct * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: colorMap[src.icon],
      pct: Math.round(pct * 100),
      idx: i,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        {arcs.map((arc) => (
          <path
            key={arc.idx}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={hoveredIdx === arc.idx ? strokeW + 4 : strokeW}
            strokeLinecap="round"
            opacity={hoveredIdx !== null && hoveredIdx !== arc.idx ? 0.3 : 1}
            onMouseEnter={() => setHoveredIdx(arc.idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer transition-all duration-200"
          />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Bebas Neue, sans-serif">
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">
          netto (zł)
        </text>
      </svg>

      <div className="flex-1 space-y-2">
        {sources.map((src, i) => {
          const Icon = ICON_MAP[src.icon];
          const pct = Math.round((src.net / total) * 100);
          return (
            <div
              key={src.source}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                hoveredIdx === i ? "bg-bg3" : ""
              )}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                style={{ background: colorMap[src.icon] }}
              />
              <span className="flex-1 text-xs text-text truncate">{src.source}</span>
              <span className="font-mono text-xs text-muted">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Growth Line (mini sparkline) ───────────────── */

function GrowthSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const growing = data[data.length - 1] > data[0];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={growing ? "#C8FF00" : "#ef4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Toast ──────────────────────────────────────── */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-border bg-bg2 px-4 py-3 shadow-2xl">
      {type === "success" ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-red-400" />
      )}
      <span className="text-sm text-text">{message}</span>
      <button onClick={onClose} className="ml-2 text-muted hover:text-text">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Payout Modal ───────────────────────────────── */

function PayoutModal({
  availableAmount,
  onConfirm,
  onClose,
  isLoading,
}: {
  availableAmount: number;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [payoutAmount, setPayoutAmount] = useState(availableAmount);
  const [error, setError] = useState("");

  const handleAmountChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setPayoutAmount(0);
      return;
    }
    setPayoutAmount(num);
    if (num < 200) setError("Minimalna kwota wypłaty to 200 zł");
    else if (num > availableAmount) setError(`Maksymalna kwota to ${availableAmount} zł`);
    else setError("");
  };

  const isValid = payoutAmount >= 200 && payoutAmount <= availableAmount && !error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-lime" />
            <h3 className="text-display text-lg">Wypłać środki</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4 rounded-lg bg-bg3 p-3 text-center">
            <p className="text-xs text-muted">Dostępne do wypłaty</p>
            <p className="text-display text-2xl text-lime">{availableAmount.toLocaleString()} zł</p>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted">Kwota wypłaty</label>
            <div className="relative">
              <input
                type="number"
                min={200}
                max={availableAmount}
                value={payoutAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2.5 pr-10 font-mono text-lg text-text focus:border-lime focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">zł</span>
            </div>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          <div className="mb-4 flex gap-2">
            {[availableAmount, Math.round(availableAmount * 0.75), Math.round(availableAmount * 0.5)]
              .filter((v) => v >= 200)
              .map((v) => (
                <button
                  key={v}
                  onClick={() => { setPayoutAmount(v); setError(""); }}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                    payoutAmount === v ? "bg-lime text-black" : "bg-bg3 text-muted hover:bg-bg4"
                  )}
                >
                  {v.toLocaleString()} zł
                </button>
              ))}
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-bg3 px-3 py-2">
            <CreditCard className="h-4 w-4 text-muted" />
            <div className="text-xs">
              <span className="text-muted">Na konto: </span>
              <span className="text-text">**** **** **** 4242 — Bank Pekao</span>
            </div>
          </div>

          <p className="mb-4 text-xs text-muted">
            Środki pojawią się na koncie w ciągu 2-3 dni roboczych.
          </p>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
              Anuluj
            </button>
            <button
              onClick={() => isValid && onConfirm(payoutAmount)}
              disabled={!isValid || isLoading}
              className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4" />
                  Wypłać {payoutAmount.toLocaleString()} zł
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────── */

export default function EarningsPage() {
  const [period, setPeriod] = useState("30d");
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBalance, setPendingBalance] = useState(2847);
  const [payouts, setPayouts] = useState<PayoutEntry[]>(INITIAL_PAYOUTS);
  const [showAllPayouts, setShowAllPayouts] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const data = DATA_BY_PERIOD[period];

  const handlePayout = useCallback(
    async (amount: number) => {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/stripe/payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clubId: "demo-club-1", amount }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        setPendingBalance((prev) => prev - amount);
        const today = new Date().toISOString().split("T")[0];
        setPayouts((prev) => [
          { date: today, amount: `${amount.toLocaleString()} zł`, amountNum: amount, status: "pending", method: "Przelew bankowy" },
          ...prev,
        ]);
        setToast({ message: result.message, type: "success" });
      } catch (err: any) {
        setToast({ message: err.message || "Nie udało się zlecić wypłaty", type: "error" });
      } finally {
        setIsProcessing(false);
        setPayoutOpen(false);
      }
    },
    []
  );

  const visiblePayouts = showAllPayouts ? payouts : payouts.slice(0, 4);

  // Sparkline data from monthly totals
  const sparklineData = useMemo(
    () => data.monthly.map((m) => m.total),
    [data.monthly]
  );

  const totalNetRevenue = data.sources.reduce((s, src) => s + src.net, 0);
  const maxSourceNet = Math.max(...data.sources.map((s) => s.net));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display text-2xl">ZAROBKI</h1>
          <p className="text-sm text-muted">Racket Club Katowice</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period switcher */}
          <div className="flex rounded-lg border border-border bg-bg2">
            {PERIODS.map((p) => (
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
          <button
            onClick={() => setPayoutOpen(true)}
            disabled={pendingBalance < 200}
            className={cn(
              "flex items-center gap-2 text-sm",
              pendingBalance >= 200
                ? "btn-primary"
                : "cursor-not-allowed rounded-xl bg-bg3 px-4 py-2.5 text-muted opacity-60"
            )}
          >
            <Wallet className="h-4 w-4" />
            Wypłać środki
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Balance */}
        <div className="glass-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <Wallet className="h-5 w-5 text-lime" />
            <GrowthSparkline data={sparklineData} />
          </div>
          <p className="text-display text-3xl text-lime">{pendingBalance.toLocaleString()} <span className="text-lg text-muted">zł</span></p>
          <p className="text-xs text-muted">Do wypłaty</p>
        </div>

        {/* Total revenue */}
        <div className="glass-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              data.stats.totalRevenueChange >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {data.stats.totalRevenueChange >= 0 ? "↑" : "↓"} {Math.abs(data.stats.totalRevenueChange)}%
            </span>
          </div>
          <p className="text-display text-3xl">{data.stats.totalRevenue.toLocaleString()} <span className="text-lg text-muted">zł</span></p>
          <p className="text-xs text-muted">Łączne przychody ({period === "30d" ? "30 dni" : period === "90d" ? "90 dni" : "12 mies."})</p>
        </div>

        {/* Active subs */}
        <div className="glass-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              ↑ {data.stats.subsChange}%
            </span>
          </div>
          <p className="text-display text-3xl">{data.stats.activeSubs}</p>
          <p className="text-xs text-muted">Aktywne subskrypcje</p>
          <p className="mt-0.5 text-[10px] text-muted">× 9 zł = {(data.stats.activeSubs * 9).toLocaleString()} zł MRR</p>
        </div>

        {/* Avg per stream */}
        <div className="glass-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <BarChart3 className="h-5 w-5 text-orange" />
            <span className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              data.stats.avgChange >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            )}>
              {data.stats.avgChange >= 0 ? "↑" : "↓"} {Math.abs(data.stats.avgChange)}%
            </span>
          </div>
          <p className="text-display text-3xl">{data.stats.avgRevenuePerStream} <span className="text-lg text-muted">zł</span></p>
          <p className="text-xs text-muted">Śr. przychód / stream</p>
        </div>
      </div>

      {/* Revenue Chart + Donut */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Stacked Bar Chart */}
        <div className="glass-card p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
              <BarChart3 className="h-4 w-4 text-muted" />
              Przychody miesięczne
            </h2>
            <span className="font-mono text-xs text-lime">{totalNetRevenue.toLocaleString()} zł netto</span>
          </div>
          <RevenueChart data={data.monthly} />
        </div>

        {/* Donut */}
        <div className="glass-card p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
            <PieChart className="h-4 w-4 text-muted" />
            Podział źródeł
          </h2>
          <DonutChart sources={data.sources} />
        </div>
      </div>

      {/* Revenue Sources Detail + Top Events */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Detailed source breakdown */}
        <div className="glass-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-text">
            Źródła przychodu — szczegóły
          </h2>
          <div className="space-y-3">
            {data.sources.map((src) => {
              const Icon = ICON_MAP[src.icon];
              const barPct = (src.net / maxSourceNet) * 100;
              return (
                <div key={src.source} className="rounded-lg bg-bg3 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-lime" />
                      <span className="text-sm font-medium text-text">{src.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-semibold",
                        src.change >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {src.change >= 0 ? "+" : ""}{src.change}%
                      </span>
                      <span className="font-mono text-sm text-lime">{src.net.toLocaleString()} zł</span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
                    <span>{src.count}</span>
                    <span>Brutto: {src.gross.toLocaleString()} zł → Netto: {src.net.toLocaleString()} zł ({src.pct}%)</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg4">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barPct}%`,
                        background: src.icon === "users" ? "#C8FF00" : src.icon === "coins" ? "#f97316" : src.icon === "film" ? "#3b82f6" : "#8b5cf6",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-4 rounded-lg bg-lime/10 p-3 text-center">
            <p className="text-xs text-muted">Łączny netto ({period === "30d" ? "30 dni" : period === "90d" ? "90 dni" : "12 mies."})</p>
            <p className="text-display text-2xl text-lime">{totalNetRevenue.toLocaleString()} zł</p>
          </div>
        </div>

        {/* Top Revenue Events */}
        <div className="glass-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
              <DollarSign className="h-4 w-4 text-muted" />
              Top wydarzenia przychodowe
              <span className="ml-auto text-[11px] font-normal text-muted">{data.topEvents.length} wydarzeń</span>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {data.topEvents.map((ev, i) => {
              const isExpanded = expandedEvent === i;
              return (
                <button
                  key={i}
                  onClick={() => setExpandedEvent(isExpanded ? null : i)}
                  className="flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-bg3/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-bg4 font-mono text-xs text-muted">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-text">{ev.name}</p>
                      <p className="text-[10px] text-muted flex items-center gap-2">
                        <Calendar className="h-3 w-3 inline" /> {ev.date}
                        <span className={cn(
                          "rounded px-1 py-0.5 text-[9px] font-semibold uppercase",
                          ev.type === "ppv" ? "bg-blue-500/20 text-blue-400" : ev.type === "bits" ? "bg-orange-500/20 text-orange-400" : "bg-lime/20 text-lime"
                        )}>
                          {ev.type}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-lime">{ev.revenue.toLocaleString()} zł</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-muted" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 ml-10 grid grid-cols-2 gap-3 text-[11px]">
                      <div className="rounded bg-bg4 px-2 py-1.5">
                        <span className="text-muted">Widzowie:</span>
                        <span className="ml-1 font-mono text-text">{ev.viewers.toLocaleString()}</span>
                      </div>
                      <div className="rounded bg-bg4 px-2 py-1.5">
                        <span className="text-muted">Przychód / widz:</span>
                        <span className="ml-1 font-mono text-text">{(ev.revenue / ev.viewers).toFixed(2)} zł</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Stripe + Payouts + Split */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stripe Connect */}
        <div className="glass-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">Stripe Connect</h2>
          <div className="flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <CreditCard className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">Konto połączone</p>
                <p className="text-xs text-muted">**** **** **** 4242 — Bank Pekao</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Aktywne
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Automatyczny przelew co 30 dni dla salda &gt; 200 zł
          </p>

          {/* Revenue Split */}
          <div className="mt-4 space-y-2 text-xs">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Podział przychodów</h3>
            {[
              { src: "Subskrypcje kanału", pct: 70 },
              { src: "Piłki (Bits)", pct: 70 },
              { src: "PPV", pct: 88 },
              { src: "Reklamy", pct: 70 },
            ].map((s) => (
              <div key={s.src} className="flex justify-between rounded bg-bg3 px-3 py-2">
                <span className="text-muted">{s.src}</span>
                <span className="text-text">
                  <span className="text-lime">{s.pct}%</span> klub / {100 - s.pct}% platforma
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payout History */}
        <div className="glass-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
              <Clock className="h-4 w-4 text-muted" />
              Historia wypłat
            </h2>
            <span className="text-[11px] text-muted">{payouts.length} wypłat łącznie</span>
          </div>

          {/* Summary bar */}
          <div className="grid grid-cols-3 border-b border-border">
            <div className="px-4 py-2.5 text-center">
              <p className="text-[10px] text-muted">Łącznie wypłacono</p>
              <p className="font-mono text-sm font-semibold text-text">
                {payouts.reduce((s, p) => s + (p.status === "completed" ? p.amountNum : 0), 0).toLocaleString()} zł
              </p>
            </div>
            <div className="border-l border-r border-border px-4 py-2.5 text-center">
              <p className="text-[10px] text-muted">Średnia wypłata</p>
              <p className="font-mono text-sm font-semibold text-text">
                {Math.round(
                  payouts.filter((p) => p.status === "completed").reduce((s, p) => s + p.amountNum, 0) /
                    payouts.filter((p) => p.status === "completed").length
                ).toLocaleString()}{" "}
                zł
              </p>
            </div>
            <div className="px-4 py-2.5 text-center">
              <p className="text-[10px] text-muted">W toku</p>
              <p className="font-mono text-sm font-semibold text-yellow-400">
                {payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amountNum, 0).toLocaleString()} zł
              </p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {visiblePayouts.map((payout, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      payout.status === "completed"
                        ? "bg-emerald-500/20"
                        : payout.status === "pending"
                        ? "bg-yellow-500/20"
                        : "bg-red-500/20"
                    )}
                  >
                    {payout.status === "completed" ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : payout.status === "pending" ? (
                      <Clock className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-text">{payout.method}</p>
                    <p className="text-xs text-muted">{payout.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-lime">{payout.amount}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      payout.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : payout.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {payout.status === "completed" ? "Zrealizowana" : payout.status === "pending" ? "W toku" : "Błąd"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {payouts.length > 4 && (
            <button
              onClick={() => setShowAllPayouts(!showAllPayouts)}
              className="flex w-full items-center justify-center gap-1 border-t border-border py-2.5 text-xs text-muted hover:text-text transition-colors"
            >
              {showAllPayouts ? (
                <>Zwiń <ChevronUp className="h-3.5 w-3.5" /></>
              ) : (
                <>Pokaż wszystkie ({payouts.length}) <ChevronDown className="h-3.5 w-3.5" /></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modals & Toast */}
      {payoutOpen && (
        <PayoutModal
          availableAmount={pendingBalance}
          onConfirm={handlePayout}
          onClose={() => setPayoutOpen(false)}
          isLoading={isProcessing}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
