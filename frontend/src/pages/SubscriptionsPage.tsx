import { useState, useRef, useEffect } from 'react';
import {
  Crown,
  CreditCard,
  RefreshCw,
  XCircle,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface SubData {
  id: string;
  type: string;
  name: string;
  price: string;
  nextBilling: string;
  status: 'active' | 'canceling';
  cancelDate?: string;
}

const INITIAL_SUBS: SubData[] = [
  {
    id: 'sub_pass',
    type: 'platform',
    name: 'Padel Vision Pass',
    price: '19 zł/mies.',
    nextBilling: '2025-04-15',
    status: 'active',
  },
  {
    id: 'sub_club_1',
    type: 'club',
    name: 'Racket Club Katowice',
    price: '9 zł/mies.',
    nextBilling: '2025-04-10',
    status: 'active',
  },
];

const BILLING_HISTORY = [
  { date: '2025-03-15', description: 'Padel Vision Pass — marzec', amount: '19,00 zł', status: 'paid' },
  { date: '2025-03-10', description: 'Subskrypcja — Racket Club', amount: '9,00 zł', status: 'paid' },
  { date: '2025-03-08', description: '100 Piłek', amount: '4,99 zł', status: 'paid' },
  { date: '2025-02-15', description: 'Padel Vision Pass — luty', amount: '19,00 zł', status: 'paid' },
  { date: '2025-02-10', description: 'Subskrypcja — Racket Club', amount: '9,00 zł', status: 'paid' },
  { date: '2025-02-01', description: 'PPV: Kraków Open Finał', amount: '14,99 zł', status: 'paid' },
];

/* --- Toast Component --- */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-border bg-bg2 px-4 py-3 shadow-2xl">
      {type === 'success' ? (
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

/* --- Cancel Modal --- */

function CancelModal({
  sub,
  onConfirm,
  onClose,
  isLoading,
}: {
  sub: SubData;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-display text-lg">Anuluj subskrypcję</h3>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4 rounded-lg bg-orange/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange" />
              <div className="text-sm text-text">
                <p className="font-semibold">Czy na pewno chcesz anulować?</p>
                <p className="mt-1 text-xs text-muted">
                  Subskrypcja <strong className="text-text">{sub.name}</strong>{' '}
                  ({sub.price}) zostanie anulowana na koniec bieżącego okresu
                  rozliczeniowego ({sub.nextBilling}).
                </p>
              </div>
            </div>
          </div>
          <p className="mb-4 text-xs text-muted">
            Zachowasz dostęp do końca opłaconego okresu. Po tej dacie
            utracisz dostęp do funkcji premium.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
              Zachowaj subskrypcję
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {isLoading ? 'Anulowanie...' : 'Anuluj subskrypcję'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Manage Dropdown --- */

function ManageDropdown({
  sub,
  onCancelClick,
}: {
  sub: SubData;
  onCancelClick: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary py-1.5 text-xs"
      >
        Zarządzaj
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-bg2 shadow-2xl">
          <Link
            to="/pricing"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Zmień plan
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onCancelClick();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-bg3"
          >
            <XCircle className="h-3.5 w-3.5" />
            Anuluj subskrypcję
          </button>
        </div>
      )}
    </div>
  );
}

/* --- Main Page --- */

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubData[]>(INITIAL_SUBS);
  const [cancelTarget, setCancelTarget] = useState<SubData | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCanceling(true);

    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: cancelTarget.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSubs((prev) =>
        prev.map((s) =>
          s.id === cancelTarget.id
            ? {
                ...s,
                status: 'canceling' as const,
                cancelDate: data.currentPeriodEnd?.split('T')[0],
              }
            : s
        )
      );

      setToast({
        message: `Subskrypcja "${cancelTarget.name}" zostanie anulowana ${cancelTarget.nextBilling}`,
        type: 'success',
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Nie udało się anulować subskrypcji',
        type: 'error',
      });
    } finally {
      setIsCanceling(false);
      setCancelTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-display text-2xl">Moje subskrypcje</h1>

      {/* Active Subscriptions */}
      <div className="mb-8 space-y-3">
        {subs.map((sub) => (
          <div
            key={sub.id}
            className={cn(
              'glass-card flex items-center justify-between p-4',
              sub.status === 'canceling' && 'opacity-75'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime/10">
                <Crown className="h-5 w-5 text-lime" />
              </div>
              <div>
                <p className="font-semibold text-text">{sub.name}</p>
                <p className="text-xs text-muted">
                  {sub.price} — następna płatność: {sub.nextBilling}
                </p>
                {sub.status === 'canceling' && (
                  <p className="mt-0.5 text-xs text-orange">
                    Anulowana — aktywna do {sub.cancelDate || sub.nextBilling}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  sub.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-orange/20 text-orange'
                )}
              >
                {sub.status === 'active' ? 'Aktywna' : 'Anulowana'}
              </span>
              {sub.status === 'active' && (
                <ManageDropdown
                  sub={sub}
                  onCancelClick={() => setCancelTarget(sub)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/pricing"
          className="flex items-center gap-1 text-sm text-lime hover:underline"
        >
          Zobacz dostępne plany
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Billing History */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
            <CreditCard className="h-4 w-4 text-muted" />
            Historia płatności
          </h2>
        </div>
        <div className="divide-y divide-border">
          {BILLING_HISTORY.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-text">{item.description}</p>
                <p className="text-xs text-muted">{item.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-text">{item.amount}</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">
                  Opłacone
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cancelTarget && (
        <CancelModal
          sub={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          isLoading={isCanceling}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
