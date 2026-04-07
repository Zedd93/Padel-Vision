import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Coins,
  Film,
  Building2,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  Wallet,
  Receipt,
  FileText,
  Mail,
  Printer,
  Copy,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Link } from "react-router-dom";
import {
  Button,
  Badge,
  KpiCard,
  Modal,
  FilterTabs,
  SectionHeader,
  EmptyState,
  type FilterTabOption,
} from "@/components/ui";

/* ─── Data ───────────────────────────────────────────── */

type DateRange = "7d" | "30d" | "90d" | "12m";
type ChartMetric = "mrr" | "transactions" | "payouts";
type TxFilter = "all" | "sub" | "ppv" | "bits" | "payout" | "club_plan";

interface PayoutData {
  id: string;
  club: string;
  slug: string;
  amount: string;
  amountNum: number;
  date: string;
  method: string;
  status: "pending" | "approved" | "rejected" | "paid";
}

interface TransactionData {
  id: string;
  date: string;
  type: TxFilter;
  desc: string;
  amount: string;
  amountNum: number;
  user?: string;
  detail?: string;
}

const FINANCE_KPIS: Record<DateRange, { label: string; value: string; change: string; positive: boolean; icon: typeof DollarSign; color: string; href: string }[]> = {
  "7d": [
    { label: "MRR", value: "48 320 zł", change: "+12.4%", positive: true, icon: DollarSign, color: "text-lime", href: "#mrr" },
    { label: "ARR", value: "579 840 zł", change: "+18.2%", positive: true, icon: TrendingUp, color: "text-emerald-400", href: "#mrr" },
    { label: "Churn Rate", value: "3.2%", change: "-0.8%", positive: true, icon: Users, color: "text-blue-400", href: "/admin/users" },
    { label: "ARPU", value: "12.56 zł", change: "+1.2%", positive: true, icon: CreditCard, color: "text-orange", href: "#revenue" },
  ],
  "30d": [
    { label: "MRR", value: "48 320 zł", change: "+14.1%", positive: true, icon: DollarSign, color: "text-lime", href: "#mrr" },
    { label: "ARR", value: "579 840 zł", change: "+19.8%", positive: true, icon: TrendingUp, color: "text-emerald-400", href: "#mrr" },
    { label: "Churn Rate", value: "3.5%", change: "-1.1%", positive: true, icon: Users, color: "text-blue-400", href: "/admin/users" },
    { label: "ARPU", value: "11.90 zł", change: "+0.8%", positive: true, icon: CreditCard, color: "text-orange", href: "#revenue" },
  ],
  "90d": [
    { label: "MRR", value: "48 320 zł", change: "+22.6%", positive: true, icon: DollarSign, color: "text-lime", href: "#mrr" },
    { label: "ARR", value: "579 840 zł", change: "+28.4%", positive: true, icon: TrendingUp, color: "text-emerald-400", href: "#mrr" },
    { label: "Churn Rate", value: "4.1%", change: "+0.3%", positive: false, icon: Users, color: "text-blue-400", href: "/admin/users" },
    { label: "ARPU", value: "10.85 zł", change: "+2.4%", positive: true, icon: CreditCard, color: "text-orange", href: "#revenue" },
  ],
  "12m": [
    { label: "MRR", value: "48 320 zł", change: "+156%", positive: true, icon: DollarSign, color: "text-lime", href: "#mrr" },
    { label: "ARR", value: "579 840 zł", change: "+180%", positive: true, icon: TrendingUp, color: "text-emerald-400", href: "#mrr" },
    { label: "Churn Rate", value: "3.8%", change: "-2.1%", positive: true, icon: Users, color: "text-blue-400", href: "/admin/users" },
    { label: "ARPU", value: "8.20 zł", change: "+53%", positive: true, icon: CreditCard, color: "text-orange", href: "#revenue" },
  ],
};

const CHART_DATA: Record<ChartMetric, { month: string; amount: number }[]> = {
  mrr: [
    { month: "Wrz", amount: 32400 },
    { month: "Paź", amount: 35200 },
    { month: "Lis", amount: 38100 },
    { month: "Gru", amount: 41600 },
    { month: "Sty", amount: 43800 },
    { month: "Lut", amount: 45900 },
    { month: "Mar", amount: 48320 },
  ],
  transactions: [
    { month: "Wrz", amount: 1240 },
    { month: "Paź", amount: 1380 },
    { month: "Lis", amount: 1510 },
    { month: "Gru", amount: 1890 },
    { month: "Sty", amount: 1720 },
    { month: "Lut", amount: 1950 },
    { month: "Mar", amount: 2180 },
  ],
  payouts: [
    { month: "Wrz", amount: 8200 },
    { month: "Paź", amount: 9100 },
    { month: "Lis", amount: 10400 },
    { month: "Gru", amount: 12800 },
    { month: "Sty", amount: 11900 },
    { month: "Lut", amount: 13200 },
    { month: "Mar", amount: 14500 },
  ],
};

const CHART_LABELS: Record<ChartMetric, string> = {
  mrr: "MRR (zł)",
  transactions: "Transakcje",
  payouts: "Wypłaty (zł)",
};

const CHART_COLORS: Record<ChartMetric, string> = {
  mrr: "bg-lime/60",
  transactions: "bg-blue-500/60",
  payouts: "bg-orange/60",
};

const REVENUE_STREAMS = [
  { source: "Subskrypcje platformy", icon: CreditCard, amount: "28 450 zł", amountNum: 28450, pct: 59, color: "bg-lime/60" },
  { source: "Subskrypcje kanałów (30%)", icon: Users, amount: "8 920 zł", amountNum: 8920, pct: 18, color: "bg-emerald-500/60" },
  { source: "Piłki/Bits (30%)", icon: Coins, amount: "5 340 zł", amountNum: 5340, pct: 11, color: "bg-yellow-500/60" },
  { source: "PPV (12%)", icon: Film, amount: "3 890 zł", amountNum: 3890, pct: 8, color: "bg-blue-500/60" },
  { source: "Plany klubowe (B2B)", icon: Building2, amount: "1 720 zł", amountNum: 1720, pct: 4, color: "bg-purple-500/60" },
];

const INITIAL_PAYOUTS: PayoutData[] = [
  { id: "p1", club: "Racket Club Katowice", slug: "racket-club", amount: "2 847 zł", amountNum: 2847, date: "2025-03-28", method: "Stripe Connect", status: "pending" },
  { id: "p2", club: "Padel Kraków", slug: "padel-krakow", amount: "1 340 zł", amountNum: 1340, date: "2025-03-28", method: "Stripe Connect", status: "pending" },
  { id: "p3", club: "Smash Arena Warszawa", slug: "smash-arena", amount: "980 zł", amountNum: 980, date: "2025-03-28", method: "Stripe Connect", status: "pending" },
  { id: "p4", club: "Court Masters Gdańsk", slug: "court-masters", amount: "560 zł", amountNum: 560, date: "2025-03-28", method: "Stripe Connect", status: "pending" },
  { id: "p5", club: "Viva Padel Poznań", slug: "viva-padel", amount: "420 zł", amountNum: 420, date: "2025-03-25", method: "Stripe Connect", status: "paid" },
  { id: "p6", club: "Padel Wrocław", slug: "padel-wroclaw", amount: "310 zł", amountNum: 310, date: "2025-03-20", method: "Przelew", status: "paid" },
];

const INITIAL_TRANSACTIONS: TransactionData[] = [
  { id: "t1", date: "12 Mar", type: "sub", desc: "Padel Vision Pro — anna_k", amount: "+39,00 zł", amountNum: 39, user: "anna_k", detail: "Subskrypcja Pro miesięczna" },
  { id: "t2", date: "11 Mar", type: "ppv", desc: "PPV Silesia Open — 12 zakupów", amount: "+179,88 zł", amountNum: 179.88, detail: "12 × 14,99 zł" },
  { id: "t3", date: "11 Mar", type: "bits", desc: "500 Piłek — jan_nowak", amount: "+19,99 zł", amountNum: 19.99, user: "jan_nowak", detail: "Pakiet 500 Piłek" },
  { id: "t4", date: "10 Mar", type: "sub", desc: "Padel Vision Pass — 8 nowych", amount: "+152,00 zł", amountNum: 152, detail: "8 × 19 zł (Pass miesięczny)" },
  { id: "t5", date: "10 Mar", type: "payout", desc: "Wypłata → Racket Club", amount: "-1 420 zł", amountNum: -1420, detail: "Stripe Connect payout" },
  { id: "t6", date: "09 Mar", type: "club_plan", desc: "Plan Pro — Viva Padel", amount: "+249,00 zł", amountNum: 249, detail: "Plan Pro klubowy miesięczny" },
  { id: "t7", date: "09 Mar", type: "bits", desc: "1000 Piłek — kasia_w", amount: "+34,99 zł", amountNum: 34.99, user: "kasia_w", detail: "Pakiet 1000 Piłek" },
  { id: "t8", date: "08 Mar", type: "sub", desc: "Padel Vision Pro — tomek_l", amount: "+39,00 zł", amountNum: 39, user: "tomek_l", detail: "Subskrypcja Pro upgrade z Pass" },
  { id: "t9", date: "08 Mar", type: "payout", desc: "Wypłata → Padel Kraków", amount: "-890 zł", amountNum: -890, detail: "Stripe Connect payout" },
  { id: "t10", date: "07 Mar", type: "ppv", desc: "PPV Kraków Open — 8 zakupów", amount: "+119,92 zł", amountNum: 119.92, detail: "8 × 14,99 zł" },
];

const TX_TYPE_LABELS: Record<string, { label: string; color: string; icon: typeof CreditCard }> = {
  all: { label: "Wszystkie", color: "text-text", icon: Receipt },
  sub: { label: "Subskrypcje", color: "text-lime", icon: CreditCard },
  ppv: { label: "PPV", color: "text-blue-400", icon: Film },
  bits: { label: "Piłki", color: "text-yellow-400", icon: Coins },
  payout: { label: "Wypłaty", color: "text-orange", icon: Wallet },
  club_plan: { label: "Plany klubowe", color: "text-purple-400", icon: Building2 },
};

const DATE_RANGE_OPTIONS: FilterTabOption<DateRange>[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12m", label: "12m" },
];

const CHART_METRIC_OPTIONS: FilterTabOption<ChartMetric>[] = [
  { value: "mrr", label: "MRR" },
  { value: "transactions", label: "Transakcje" },
  { value: "payouts", label: "Wypłaty" },
];

const TX_FILTER_OPTIONS: FilterTabOption<TxFilter>[] = (Object.keys(TX_TYPE_LABELS) as TxFilter[]).map((t) => ({
  value: t,
  label: TX_TYPE_LABELS[t].label,
}));

/* ─── Invoice ─────────────────────────────────────── */

interface Invoice {
  id: string;
  number: string;
  payoutId: string;
  club: string;
  clubAddress: string;
  clubNip: string;
  clubEmail: string;
  amountGross: number;
  amountNet: number;
  vatAmount: number;
  vatRate: number;
  issuedAt: string;
  dueAt: string;
  status: "sent" | "paid";
  method: string;
}

const CLUB_BILLING: Record<string, { address: string; nip: string; email: string }> = {
  "racket-club":  { address: "ul. Sportowa 5, 40-001 Katowice",     nip: "6482345678", email: "kontakt@racketclub.pl" },
  "padel-krakow": { address: "al. Kijowska 22, 30-079 Kraków",       nip: "6761234567", email: "biuro@padelkrakow.pl" },
  "smash-arena":  { address: "ul. Wołoska 18, 02-675 Warszawa",      nip: "5213456789", email: "info@smasharena.pl" },
  "court-masters":{ address: "ul. Gdańska 43, 80-001 Gdańsk",        nip: "5831234567", email: "kontakt@courtmasters.pl" },
  "viva-padel":   { address: "ul. Roosevelta 3, 60-829 Poznań",      nip: "7781234567", email: "hello@vivapadel.pl" },
  "padel-wroclaw":{ address: "ul. Legnicka 65, 54-206 Wrocław",      nip: "8991234567", email: "biuro@padelwroclaw.pl" },
};

const SELLER = {
  name: "PadelVision sp. z o.o.",
  address: "ul. Technologiczna 1, 00-001 Warszawa",
  nip: "5252345678",
  bank: "PL61 1090 1014 0000 0712 1981 2874",
};

let _invoiceSeq = 3;

function buildInvoice(payout: PayoutData): Invoice {
  const billing = CLUB_BILLING[payout.slug] ?? {
    address: "ul. Nieznana 1, 00-001 Polska",
    nip: "0000000000",
    email: "kontakt@klub.pl",
  };
  const gross = payout.amountNum;
  const net = Math.round((gross / 1.23) * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 14);
  const seq = String(++_invoiceSeq).padStart(3, "0");
  const num = `FV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${seq}`;
  return {
    id: `inv-${payout.id}-${Date.now()}`,
    number: num,
    payoutId: payout.id,
    club: payout.club,
    clubAddress: billing.address,
    clubNip: billing.nip,
    clubEmail: billing.email,
    amountGross: gross,
    amountNet: net,
    vatAmount: vat,
    vatRate: 23,
    issuedAt: now.toISOString().slice(0, 10),
    dueAt: due.toISOString().slice(0, 10),
    status: "sent",
    method: payout.method,
  };
}

function buildInvoiceHtml(inv: Invoice): string {
  return `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8">
<title>Faktura ${inv.number}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:13px;color:#1a202c;padding:40px;max-width:800px;margin:0 auto}
  h1{font-size:22px;font-weight:700;margin-bottom:4px}
  .subtitle{color:#64748b;font-size:12px;margin-bottom:32px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}
  .party-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}
  .party-name{font-weight:700;font-size:14px;margin-bottom:2px}
  .party-detail{color:#64748b;font-size:12px;line-height:1.6}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  th{background:#f8fafc;text-align:left;padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;border-bottom:2px solid #e2e8f0}
  td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
  .totals{margin-left:auto;width:260px}
  .totals tr td:first-child{color:#64748b}
  .totals tr td:last-child{text-align:right;font-weight:600}
  .totals .grand td{font-size:16px;font-weight:700;color:#1a202c;border-top:2px solid #e2e8f0;padding-top:10px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
  .badge{display:inline-block;background:#dcfce7;color:#16a34a;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700}
</style></head><body>
<h1>FAKTURA VAT</h1>
<p class="subtitle">Nr: <strong>${inv.number}</strong> &nbsp;·&nbsp; Data wystawienia: ${inv.issuedAt} &nbsp;·&nbsp; Termin płatności: ${inv.dueAt}</p>
<div class="parties">
  <div><div class="party-label">Sprzedawca</div><div class="party-name">${SELLER.name}</div><div class="party-detail">${SELLER.address}<br>NIP: ${SELLER.nip}<br>Nr konta: ${SELLER.bank}</div></div>
  <div><div class="party-label">Nabywca</div><div class="party-name">${inv.club}</div><div class="party-detail">${inv.clubAddress}<br>NIP: ${inv.clubNip}<br>${inv.clubEmail}</div></div>
</div>
<table>
  <thead><tr><th>Lp.</th><th>Nazwa usługi</th><th>Netto</th><th>VAT</th><th>Brutto</th></tr></thead>
  <tbody><tr><td>1</td><td>Wypłata przychodów z platformy PadelVision<br><small style="color:#94a3b8">Metoda: ${inv.method}</small></td><td>${inv.amountNet.toFixed(2)} zł</td><td>${inv.vatRate}%</td><td>${inv.amountGross.toFixed(2)} zł</td></tr></tbody>
</table>
<table class="totals">
  <tr><td>Netto:</td><td>${inv.amountNet.toFixed(2)} zł</td></tr>
  <tr><td>VAT (${inv.vatRate}%):</td><td>${inv.vatAmount.toFixed(2)} zł</td></tr>
  <tr class="grand"><td>Do zapłaty:</td><td>${inv.amountGross.toFixed(2)} zł</td></tr>
</table>
<div class="footer"><span>Wygenerowano automatycznie przez PadelVision · ${new Date().toLocaleString("pl-PL")}</span><span class="badge">WYSŁANA</span></div>
</body></html>`;
}

const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-p5-0", number: "FV/2026/03/001", payoutId: "p5",
    club: "Viva Padel Poznań", clubAddress: "ul. Roosevelta 3, 60-829 Poznań",
    clubNip: "7781234567", clubEmail: "hello@vivapadel.pl",
    amountGross: 420, amountNet: 341.46, vatAmount: 78.54, vatRate: 23,
    issuedAt: "2026-03-25", dueAt: "2026-04-08", status: "paid", method: "Stripe Connect",
  },
  {
    id: "inv-p6-0", number: "FV/2026/03/002", payoutId: "p6",
    club: "Padel Wrocław", clubAddress: "ul. Legnicka 65, 54-206 Wrocław",
    clubNip: "8991234567", clubEmail: "biuro@padelwroclaw.pl",
    amountGross: 310, amountNet: 252.03, vatAmount: 57.97, vatRate: 23,
    issuedAt: "2026-03-20", dueAt: "2026-04-03", status: "paid", method: "Przelew",
  },
];

/* ─── Component ──────────────────────────────────────── */

export default function AdminFinancePage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("mrr");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [payouts, setPayouts] = useState<PayoutData[]>(INITIAL_PAYOUTS);
  const [transactions] = useState<TransactionData[]>(INITIAL_TRANSACTIONS);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [showRevenueDetail, setShowRevenueDetail] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showPayoutConfirm, setShowPayoutConfirm] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [showTxDetail, setShowTxDetail] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  /* ─── Chart ──────────────────────────────────── */

  const chartData = CHART_DATA[chartMetric];
  const maxChart = Math.max(...chartData.map((m) => m.amount));
  const totalChart = chartData.reduce((s, m) => s + m.amount, 0);
  const avgChart = Math.round(totalChart / chartData.length);

  /* ─── Payouts ────────────────────────────────── */

  const sortedPayouts = [...payouts].sort((a, b) => {
    const order = { pending: 0, approved: 1, paid: 2, rejected: 3 };
    return order[a.status] - order[b.status];
  });

  const pendingTotal = payouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amountNum, 0);

  const handlePayoutAction = (id: string, action: "approve" | "reject") => {
    const payout = payouts.find((p) => p.id === id);
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p
      )
    );
    if (action === "approve" && payout) {
      const inv = buildInvoice(payout);
      setInvoices((prev) => [inv, ...prev]);
      showToast(`Zatwierdzono wypłatę · Faktura ${inv.number} wysłana na ${CLUB_BILLING[payout.slug]?.email ?? "email klubu"}`);
    } else {
      showToast(`Odrzucono wypłatę dla ${payout?.club}`);
    }
    setShowPayoutConfirm(null);
  };

  const handleApproveAll = () => {
    const pending = payouts.filter((p) => p.status === "pending");
    setPayouts((prev) =>
      prev.map((p) => (p.status === "pending" ? { ...p, status: "approved" } : p))
    );
    const newInvoices = pending.map(buildInvoice);
    setInvoices((prev) => [...newInvoices, ...prev]);
    showToast(`Zatwierdzono ${pending.length} wypłat · Wystawiono ${pending.length} faktur`);
  };

  const handlePrintInvoice = (inv: Invoice) => {
    const html = buildInvoiceHtml(inv);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => { win.print(); setTimeout(() => URL.revokeObjectURL(url), 5000); };
    }
  };

  const handleCopyInvoiceNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedInvoice(num);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  /* ─── Transactions ───────────────────────────── */

  const filteredTx = transactions
    .filter((tx) => txFilter === "all" || tx.type === txFilter)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  /* ─── Export ─────────────────────────────────── */

  const handleExportCSV = () => {
    const headers = "Data,Typ,Opis,Kwota\n";
    const rows = filteredTx
      .map((tx) => `${tx.date},${TX_TYPE_LABELS[tx.type]?.label || tx.type},"${tx.desc}",${tx.amount}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "padelvision-finance.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Wyeksportowano CSV");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Dane odświeżone");
    }, 1000);
  };

  /* ─── Render ───────────────────────────────────── */

  const kpis = FINANCE_KPIS[dateRange];
  const detailTx = showTxDetail ? transactions.find((t) => t.id === showTxDetail) : null;
  const payoutModal = showPayoutConfirm && payouts.find((p) => p.id === showPayoutConfirm.id);
  const isApprove = showPayoutConfirm?.action === "approve";

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
        title="Finanse"
        subtitle="Przegląd finansowy platformy"
        actions={
          <>
            <FilterTabs
              options={DATE_RANGE_OPTIONS}
              value={dateRange}
              onChange={setDateRange}
              size="sm"
            />
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={isRefreshing}
              aria-label="Odśwież"
            />
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
              CSV
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            positive={kpi.positive}
            icon={kpi.icon}
            iconColor={kpi.color}
            href={kpi.href}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue Chart */}
          <div id="mrr" className="glass-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">
                {CHART_LABELS[chartMetric]} — ostatnie 7 miesięcy
              </h2>
              <FilterTabs
                options={CHART_METRIC_OPTIONS}
                value={chartMetric}
                onChange={setChartMetric}
                size="sm"
              />
            </div>
            <div className="flex items-end gap-3" style={{ height: 180 }}>
              {chartData.map((m, i) => (
                <div
                  key={m.month}
                  className="group relative flex flex-1 flex-col items-center gap-1"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {hoveredBar === i && (
                    <div className="absolute -top-10 z-10 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs shadow-lg">
                      <span className="font-mono font-semibold text-text">
                        {chartMetric === "transactions"
                          ? m.amount.toLocaleString()
                          : (m.amount / 1000).toFixed(1) + "k zł"}
                      </span>
                    </div>
                  )}
                  <span className="font-mono text-[10px] text-muted">
                    {chartMetric === "transactions" ? m.amount : (m.amount / 1000).toFixed(1) + "k"}
                  </span>
                  <div
                    className={cn(
                      "w-full cursor-pointer rounded-t transition-all",
                      CHART_COLORS[chartMetric],
                      hoveredBar === i && "opacity-100 ring-2 ring-lime/30",
                      hoveredBar !== null && hoveredBar !== i && "opacity-50"
                    )}
                    style={{ height: `${(m.amount / maxChart) * 140}px` }}
                  />
                  <span className={cn(
                    "text-[10px] transition-colors",
                    hoveredBar === i ? "font-semibold text-lime" : "text-muted"
                  )}>{m.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-4 border-t border-border pt-3">
              <div>
                <p className="text-[10px] text-muted">Suma</p>
                <p className="font-mono text-xs font-semibold text-text">
                  {chartMetric === "transactions"
                    ? totalChart.toLocaleString()
                    : (totalChart / 1000).toFixed(1) + "k zł"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted">Średnia</p>
                <p className="font-mono text-xs font-semibold text-text">
                  {chartMetric === "transactions"
                    ? avgChart.toLocaleString()
                    : (avgChart / 1000).toFixed(1) + "k zł"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted">Zmiana</p>
                <p className="font-mono text-xs font-semibold text-emerald-400">
                  +{((chartData[chartData.length - 1].amount / chartData[0].amount - 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Streams */}
          <div id="revenue" className="glass-card p-4">
            <h2 className="mb-4 text-sm font-semibold text-text">Źródła przychodu</h2>
            <div className="space-y-3">
              {REVENUE_STREAMS.map((src, i) => {
                const Icon = src.icon;
                const isExpanded = showRevenueDetail === i;
                return (
                  <div key={src.source}>
                    <button
                      onClick={() => setShowRevenueDetail(isExpanded ? null : i)}
                      className="mb-1 flex w-full items-center justify-between transition-colors hover:text-lime"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <Icon className="h-3.5 w-3.5 text-muted" />
                        <span className="text-muted">{src.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text">{src.amount}</span>
                        <Badge variant="neutral" size="xs">{src.pct}%</Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3 text-lime" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-muted" />
                        )}
                      </div>
                    </button>
                    <div className="h-2 overflow-hidden rounded-full bg-bg4">
                      <div
                        className={cn("h-full rounded-full transition-all", src.color)}
                        style={{ width: `${src.pct}%` }}
                      />
                    </div>
                    {isExpanded && (
                      <div className="mt-2 rounded-lg bg-bg3 p-3">
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-[10px] text-muted">Miesięcznie</p>
                            <p className="font-mono font-semibold text-text">{src.amount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted">Rocznie (est.)</p>
                            <p className="font-mono font-semibold text-text">{(src.amountNum * 12 / 1000).toFixed(0)}k zł</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted">Udział</p>
                            <p className="font-mono font-semibold text-lime">{src.pct}%</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                          Wzrost +{(Math.random() * 15 + 5).toFixed(1)}% vs poprzedni miesiąc
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted">Łączny przychód</span>
              <span className="font-mono text-sm font-bold text-lime">
                {REVENUE_STREAMS.reduce((s, r) => s + r.amountNum, 0).toLocaleString()} zł
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pending Payouts */}
          <div className="glass-card overflow-visible">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-text">Oczekujące wypłaty</h2>
              {payouts.filter((p) => p.status === "pending").length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={CheckCircle2}
                  onClick={handleApproveAll}
                  className="!text-emerald-400 hover:!bg-emerald-500/20"
                >
                  Zatwierdź wszystkie
                </Button>
              )}
            </div>
            <div className="divide-y divide-border">
              {sortedPayouts.map((p) => {
                const isPending = p.status === "pending";
                const variant =
                  p.status === "pending" ? "warning"
                  : p.status === "approved" ? "success"
                  : p.status === "paid" ? "info"
                  : "danger";
                const label =
                  p.status === "pending" ? "Oczekuje"
                  : p.status === "approved" ? "Zatwierdzona"
                  : p.status === "paid" ? "Wypłacona"
                  : "Odrzucona";
                return (
                  <div key={p.id} className="px-4 py-2.5 transition-colors hover:bg-bg3/50">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/club/${p.slug}`}
                        className="text-xs font-medium text-text transition-colors hover:text-lime"
                      >
                        {p.club}
                      </Link>
                      <span className="font-mono text-xs text-orange">{p.amount}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-muted">{p.date} · {p.method}</p>
                        <Badge variant={variant} size="xs">{label}</Badge>
                      </div>
                      {isPending && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setShowPayoutConfirm({ id: p.id, action: "approve" })}
                            className="rounded p-1 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            title="Zatwierdź"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setShowPayoutConfirm({ id: p.id, action: "reject" })}
                            className="rounded p-1 text-red-400 transition-colors hover:bg-red-500/20"
                            title="Odrzuć"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Do wypłaty (oczekujące)</span>
                <span className="font-mono text-sm font-bold text-orange">
                  {pendingTotal.toLocaleString()} zł
                </span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-card overflow-visible">
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text">Transakcje</h2>
                <Badge variant="neutral" size="xs">{filteredTx.length}</Badge>
              </div>
              <div className="mt-2">
                <FilterTabs
                  options={TX_FILTER_OPTIONS}
                  value={txFilter}
                  onChange={setTxFilter}
                  size="sm"
                  variant="pills"
                  className="flex-wrap"
                />
              </div>
            </div>
            <div className="divide-y divide-border">
              {filteredTx.map((tx) => {
                const typeInfo = TX_TYPE_LABELS[tx.type];
                const Icon = typeInfo?.icon || Receipt;
                return (
                  <button
                    key={tx.id}
                    onClick={() => setShowTxDetail(tx.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-bg3/50"
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-bg4">
                      <Icon className={cn("h-3.5 w-3.5", typeInfo?.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs text-text">{tx.desc}</p>
                      <p className="text-[10px] text-muted">{tx.date}</p>
                    </div>
                    <span
                      className={cn(
                        "flex-shrink-0 font-mono text-xs font-semibold",
                        tx.amountNum >= 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {tx.amount}
                    </span>
                  </button>
                );
              })}
              {filteredTx.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-muted">
                  Brak transakcji tego typu
                </div>
              )}
            </div>
            <div className="border-t border-border px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Suma widocznych</span>
                <span className={cn(
                  "font-mono text-sm font-bold",
                  filteredTx.reduce((s, t) => s + t.amountNum, 0) >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {filteredTx.reduce((s, t) => s + t.amountNum, 0) >= 0 ? "+" : ""}
                  {filteredTx.reduce((s, t) => s + t.amountNum, 0).toFixed(2)} zł
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Invoices Section ───────────────────── */}
      <div className="mt-8">
        <SectionHeader
          title="Faktury"
          subtitle="Automatycznie wystawiane przy zatwierdzeniu wypłaty"
          level="h3"
          actions={<Badge variant="neutral" size="md">{invoices.length} faktur</Badge>}
        />

        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Brak faktur"
            description="Pojawią się tu po zatwierdzeniu pierwszej wypłaty."
          />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-x-4 border-b border-border px-4 py-2 text-[10px] font-bold uppercase text-muted">
              <span>Nr faktury</span>
              <span>Klub</span>
              <span className="text-right">Brutto</span>
              <span className="text-right">Data</span>
              <span>Status</span>
              <span />
            </div>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center gap-x-4 border-b border-border px-4 py-3 last:border-0 hover:bg-bg3/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 flex-shrink-0 text-lime" />
                  <span className="truncate font-mono text-xs text-text">{inv.number}</span>
                  <button
                    onClick={() => handleCopyInvoiceNumber(inv.number)}
                    className="flex-shrink-0 text-muted hover:text-text"
                    title="Kopiuj numer"
                  >
                    {copiedInvoice === inv.number
                      ? <CheckCircle2 className="h-3 w-3 text-lime" />
                      : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-text">{inv.club}</p>
                  <p className="truncate text-[10px] text-muted">{inv.clubEmail}</p>
                </div>
                <span className="font-mono text-xs font-semibold text-orange">
                  {inv.amountGross.toLocaleString("pl-PL")} zł
                </span>
                <span className="text-[11px] text-muted">{inv.issuedAt}</span>
                <Badge variant={inv.status === "paid" ? "info" : "success"} size="xs">
                  {inv.status === "paid" ? "Opłacona" : "Wysłana"}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewInvoice(inv)}
                    className="rounded p-1.5 text-muted hover:bg-bg4 hover:text-text"
                    title="Podgląd"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handlePrintInvoice(inv)}
                    className="rounded p-1.5 text-muted hover:bg-bg4 hover:text-text"
                    title="Drukuj / Pobierz PDF"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Invoice Preview Modal ───────────────── */}
      <Modal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        size="lg"
        icon={FileText}
        title={previewInvoice ? `Faktura ${previewInvoice.number}` : ""}
        subtitle={previewInvoice ? `Wystawiona: ${previewInvoice.issuedAt}` : undefined}
      >
        {previewInvoice && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-bg3 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase text-muted">Sprzedawca</p>
                <p className="text-sm font-semibold text-text">{SELLER.name}</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {SELLER.address}<br />
                  NIP: {SELLER.nip}<br />
                  <span className="font-mono text-[10px]">{SELLER.bank}</span>
                </p>
              </div>
              <div className="rounded-lg bg-bg3 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase text-muted">Nabywca</p>
                <p className="text-sm font-semibold text-text">{previewInvoice.club}</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {previewInvoice.clubAddress}<br />
                  NIP: {previewInvoice.clubNip}<br />
                  <span className="text-lime">{previewInvoice.clubEmail}</span>
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 bg-bg3 px-4 py-2 text-[10px] font-bold uppercase text-muted">
                <span>Usługa</span>
                <span className="text-right">Netto</span>
                <span className="text-right">VAT</span>
                <span className="text-right">Brutto</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-text">Wypłata przychodów z platformy PadelVision</p>
                  <p className="text-[11px] text-muted">Metoda: {previewInvoice.method}</p>
                </div>
                <span className="font-mono text-text">{previewInvoice.amountNet.toFixed(2)} zł</span>
                <span className="font-mono text-muted">{previewInvoice.vatRate}%</span>
                <span className="font-mono font-semibold text-lime">{previewInvoice.amountGross.toFixed(2)} zł</span>
              </div>
            </div>
            <div className="ml-auto w-56 space-y-1.5 rounded-lg bg-bg3 p-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Netto</span>
                <span className="font-mono text-text">{previewInvoice.amountNet.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">VAT ({previewInvoice.vatRate}%)</span>
                <span className="font-mono text-text">{previewInvoice.vatAmount.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                <span className="text-text">Do zapłaty</span>
                <span className="font-mono text-lime">{previewInvoice.amountGross.toFixed(2)} zł</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <Mail className="h-4 w-4 flex-shrink-0 text-emerald-400" />
              <p className="text-xs text-emerald-400">
                Faktura została automatycznie wysłana na adres{" "}
                <span className="font-semibold">{previewInvoice.clubEmail}</span>{" "}
                w dniu {previewInvoice.issuedAt}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Data wystawienia</p>
                <p className="text-sm font-medium text-text">{previewInvoice.issuedAt}</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Termin płatności</p>
                <p className="text-sm font-medium text-text">{previewInvoice.dueAt}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" icon={Printer} onClick={() => handlePrintInvoice(previewInvoice)}>
                Drukuj
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Payout Confirm Modal ───────────────── */}
      <Modal
        isOpen={!!showPayoutConfirm}
        onClose={() => setShowPayoutConfirm(null)}
        size="sm"
        icon={isApprove ? Send : XCircle}
        iconColor={isApprove ? "text-emerald-400" : "text-red-400"}
        iconBgColor={isApprove ? "bg-emerald-500/20" : "bg-red-500/20"}
        title={isApprove ? "Zatwierdź wypłatę" : "Odrzuć wypłatę"}
        subtitle={payoutModal ? payoutModal.club : undefined}
        footer={
          payoutModal && (
            <>
              <Button variant="secondary" onClick={() => setShowPayoutConfirm(null)}>
                Anuluj
              </Button>
              <Button
                variant={isApprove ? "primary" : "danger"}
                onClick={() => handlePayoutAction(payoutModal.id, showPayoutConfirm!.action)}
              >
                {isApprove ? "Zatwierdź" : "Odrzuć"}
              </Button>
            </>
          )
        }
      >
        {payoutModal && (
          <>
            <div className="rounded-lg bg-bg3 p-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-muted">Kwota</p>
                  <p className="font-mono font-semibold text-orange">{payoutModal.amount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted">Data</p>
                  <p className="text-text">{payoutModal.date}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-muted">Metoda</p>
                  <p className="text-text">{payoutModal.method}</p>
                </div>
              </div>
            </div>
            {isApprove && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
                <Mail className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <p className="text-xs text-emerald-400">
                  Faktura VAT zostanie automatycznie wystawiona i wysłana na adres email klubu.
                </p>
              </div>
            )}
            <p className="mt-3 text-sm text-muted">
              {isApprove
                ? "Wypłata zostanie przetworzona przez Stripe Connect. Środki trafią na konto klubu w ciągu 2-3 dni roboczych."
                : "Odrzucona wypłata wróci do salda klubu. Czy na pewno chcesz odrzucić tę wypłatę?"}
            </p>
          </>
        )}
      </Modal>

      {/* ─── Transaction Detail Modal ───────────── */}
      <Modal
        isOpen={!!showTxDetail}
        onClose={() => setShowTxDetail(null)}
        size="sm"
        icon={detailTx ? (TX_TYPE_LABELS[detailTx.type]?.icon || Receipt) : Receipt}
        iconColor={detailTx ? TX_TYPE_LABELS[detailTx.type]?.color : "text-text"}
        iconBgColor="bg-bg4"
        title="Szczegóły transakcji"
        subtitle={detailTx ? `ID: ${detailTx.id}` : undefined}
        footer={
          <Button variant="secondary" onClick={() => setShowTxDetail(null)}>
            Zamknij
          </Button>
        }
      >
        {detailTx && (
          <div className="space-y-3">
            <div className="rounded-lg bg-bg3 p-3">
              <p className="text-[10px] text-muted">Opis</p>
              <p className="text-sm text-text">{detailTx.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Kwota</p>
                <p className={cn(
                  "font-mono text-lg font-semibold",
                  detailTx.amountNum >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {detailTx.amount}
                </p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Data</p>
                <p className="text-sm text-text">{detailTx.date} 2025</p>
              </div>
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Typ</p>
                <span className={cn("text-sm font-semibold", TX_TYPE_LABELS[detailTx.type]?.color)}>
                  {TX_TYPE_LABELS[detailTx.type]?.label}
                </span>
              </div>
              {detailTx.user && (
                <div className="rounded-lg bg-bg3 p-3">
                  <p className="text-[10px] text-muted">Użytkownik</p>
                  <p className="text-sm text-text">{detailTx.user}</p>
                </div>
              )}
            </div>
            {detailTx.detail && (
              <div className="rounded-lg bg-bg3 p-3">
                <p className="text-[10px] text-muted">Szczegóły</p>
                <p className="text-sm text-text">{detailTx.detail}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
