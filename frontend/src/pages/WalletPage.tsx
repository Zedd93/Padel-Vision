import { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  Zap,
  ArrowRight,
  History,
  Loader2,
  Check,
  X,
  AlertTriangle,
  ShoppingCart,
  Radio,
  Users,
} from 'lucide-react';
import { cn } from '@/utils/cn';

/* --- Types & Data --- */

interface Transaction {
  date: string;
  type: 'purchase' | 'send';
  desc: string;
  amount: string;
  cost: string | null;
}

const BITS_PACKAGES = [
  { amount: 100, price: '4,99', priceNum: 499, label: 'Starter', icon: '\uD83C\uDFBE' },
  { amount: 500, price: '19,99', priceNum: 1999, label: 'Popularne', icon: '\uD83D\uDD25', popular: true },
  { amount: 2000, price: '69,99', priceNum: 6999, label: 'Mega Pack', icon: '\uD83C\uDFC6' },
];

const EFFECTS = [
  { name: 'ACE!', cost: 100, icon: '\uD83C\uDFBE', description: 'Animacja ace na ekranie' },
  { name: 'SMASH!', cost: 500, icon: '\uD83D\uDCA5', description: 'Wielki smash z efektem dźwiękowym' },
  { name: 'MATCH POINT!', cost: 2000, icon: '\uD83C\uDFC6', description: 'Pełnoekranowa animacja + specjalny badge' },
];

const LIVE_STREAMS = [
  { id: '1', title: 'Warsaw Padel Masters — Finał', clubName: 'Warsaw Padel Club', viewerCount: 1243 },
  { id: '2', title: 'Liga Weekendowa — Mecz 3', clubName: 'Padel Kraków', viewerCount: 432 },
  { id: '3', title: 'Turniej Kobiet — Półfinał', clubName: 'Smash Arena Wrocław', viewerCount: 289 },
  { id: '4', title: 'Americano Night — Kort 2', clubName: 'Vamos Padel Gdańsk', viewerCount: 156 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { date: '15 Mar', type: 'purchase', desc: 'Zakup 500 Piłek', amount: '+500', cost: '19,99 zł' },
  { date: '14 Mar', type: 'send', desc: 'SMASH! \u2192 Racket Club', amount: '-500', cost: null },
  { date: '10 Mar', type: 'purchase', desc: 'Zakup 100 Piłek', amount: '+100', cost: '4,99 zł' },
  { date: '10 Mar', type: 'send', desc: 'ACE! \u2192 Padel Kraków', amount: '-100', cost: null },
  { date: '8 Mar', type: 'purchase', desc: 'Zakup 100 Piłek', amount: '+100', cost: '4,99 zł' },
];

/* --- Toast --- */

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

/* --- Confirm Purchase Modal --- */

function PurchaseModal({
  pkg,
  onConfirm,
  onClose,
  isLoading,
}: {
  pkg: (typeof BITS_PACKAGES)[0];
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-bg2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-display text-lg">Potwierdź zakup</h3>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-bg3 p-4">
            <span className="text-4xl">{pkg.icon}</span>
            <div className="text-center">
              <p className="text-display text-2xl">{pkg.amount} Piłek</p>
              <p className="text-sm text-muted">{pkg.label}</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between rounded-lg bg-bg3 px-4 py-3">
            <span className="text-sm text-muted">Do zapłaty</span>
            <span className="text-display text-xl text-lime">{pkg.price} zł</span>
          </div>

          <p className="mb-4 text-center text-xs text-muted">
            Płatność zostanie pobrana z Twojej karty via Stripe
          </p>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
              Anuluj
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Płacę...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Kup teraz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Stream Picker Modal --- */

function StreamPickerModal({
  effect,
  onConfirm,
  onClose,
}: {
  effect: (typeof EFFECTS)[0];
  onConfirm: (stream: (typeof LIVE_STREAMS)[0]) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-display text-lg">
            Wyślij {effect.icon} {effect.name}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="mb-4 text-sm text-muted">
            Wybierz stream, na którym chcesz użyć efektu:
          </p>
          {LIVE_STREAMS.length > 0 ? (
            <div className="space-y-2">
              {LIVE_STREAMS.map((stream) => (
                <button
                  key={stream.id}
                  onClick={() => onConfirm(stream)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-bg3 px-4 py-3 text-left transition-colors hover:border-lime/40 hover:bg-bg3/80"
                >
                  <Radio className="h-4 w-4 shrink-0 text-live animate-pulse" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{stream.title}</p>
                    <p className="text-xs text-muted">{stream.clubName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3 w-3" />
                    {stream.viewerCount}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-bg3 px-4 py-6 text-center">
              <p className="text-sm text-muted">Brak aktywnych streamów. Poczekaj na live!</p>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-bg3 px-4 py-2.5">
            <span className="text-xs text-muted">Koszt efektu</span>
            <span className="flex items-center gap-1 font-mono text-sm text-lime">
              <Coins className="h-3 w-3 text-yellow-400" />
              {effect.cost} Piłek
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Main Page --- */

export default function WalletPage() {
  const [balance, setBalance] = useState(247);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [confirmPkg, setConfirmPkg] = useState<(typeof BITS_PACKAGES)[0] | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [effectToPick, setEffectToPick] = useState<(typeof EFFECTS)[0] | null>(null);

  const handleBuyClick = useCallback(() => {
    const pkg = BITS_PACKAGES.find((p) => p.amount === selectedPackage);
    if (pkg) setConfirmPkg(pkg);
  }, [selectedPackage]);

  const handlePurchase = useCallback(async () => {
    if (!confirmPkg) return;
    setIsPurchasing(true);

    try {
      const res = await fetch('/api/stripe/buy-bits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user-1', amount: confirmPkg.amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setBalance(data.newBalance);

      const now = new Date();
      const dateStr = `${now.getDate()} ${['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'][now.getMonth()]}`;
      setTransactions((prev) => [
        {
          date: dateStr,
          type: 'purchase',
          desc: `Zakup ${confirmPkg.amount} Piłek`,
          amount: `+${confirmPkg.amount}`,
          cost: `${confirmPkg.price} zł`,
        },
        ...prev,
      ]);

      setToast({
        message: `Dodano ${confirmPkg.amount} Piłek do portfela! Nowe saldo: ${data.newBalance}`,
        type: 'success',
      });
      setSelectedPackage(null);
    } catch (err: any) {
      setToast({
        message: err.message || 'Nie udało się zakupić Piłek',
        type: 'error',
      });
    } finally {
      setIsPurchasing(false);
      setConfirmPkg(null);
    }
  }, [confirmPkg]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-display text-2xl">Portfel Piłek</h1>

      {/* Balance Card */}
      <div className="glass-card mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-lime/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Twoje saldo</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-display text-5xl text-lime">
                  {balance.toLocaleString()}
                </span>
                <span className="text-display text-xl text-muted">Piłek</span>
              </div>
            </div>
            <Coins className="h-16 w-16 text-lime/30" />
          </div>
        </div>
      </div>

      {/* Buy Packages */}
      <div className="mb-8">
        <h2 className="mb-4 text-display text-lg">Kup Piłki</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {BITS_PACKAGES.map((pkg) => (
            <button
              key={pkg.amount}
              onClick={() => setSelectedPackage(pkg.amount)}
              className={cn(
                'glass-card relative p-5 text-center transition-all',
                selectedPackage === pkg.amount
                  ? 'border-lime ring-1 ring-lime/30'
                  : 'hover:border-lime/40',
                pkg.popular && 'border-lime/20'
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-lime px-3 py-0.5 text-[10px] font-bold text-black">
                  POPULARNE
                </div>
              )}
              <span className="text-3xl">{pkg.icon}</span>
              <p className="mt-2 text-display text-2xl">{pkg.amount}</p>
              <p className="text-xs text-muted">Piłek</p>
              <p className="mt-2 font-mono text-lg text-text">{pkg.price} zł</p>
            </button>
          ))}
        </div>
        {selectedPackage && (
          <button
            onClick={handleBuyClick}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2"
          >
            Kup {selectedPackage} Piłek
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Effects */}
      <div className="mb-8">
        <h2 className="mb-4 text-display text-lg">Efekty</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {EFFECTS.map((effect) => (
            <div key={effect.name} className="glass-card p-4 text-center">
              <span className="text-3xl">{effect.icon}</span>
              <p className="mt-2 text-display text-base text-lime">{effect.name}</p>
              <p className="text-xs text-muted">{effect.description}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Coins className="h-3 w-3 text-yellow-400" />
                <span className="font-mono text-sm text-text">{effect.cost}</span>
              </div>
              <button
                disabled={balance < effect.cost}
                onClick={() => setEffectToPick(effect)}
                className={cn(
                  'mt-2 w-full rounded-lg py-1.5 text-xs font-medium transition-colors',
                  balance >= effect.cost
                    ? 'bg-lime/10 text-lime hover:bg-lime/20'
                    : 'cursor-not-allowed bg-bg3 text-muted'
                )}
              >
                {balance >= effect.cost ? 'Użyj na streamie' : 'Za mało Piłek'}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Podział: 70% dla klubu, 30% dla platformy
        </p>
      </div>

      {/* Transaction History */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
            <History className="h-4 w-4 text-muted" />
            Historia transakcji
          </h2>
        </div>
        <div className="divide-y divide-border">
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    tx.type === 'purchase'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-orange/20 text-orange'
                  )}
                >
                  {tx.type === 'purchase' ? (
                    <Coins className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-text">{tx.desc}</p>
                  <p className="text-xs text-muted">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'font-mono text-sm font-semibold',
                    tx.amount.startsWith('+')
                      ? 'text-emerald-400'
                      : 'text-orange'
                  )}
                >
                  {tx.amount}
                </p>
                {tx.cost && <p className="text-xs text-muted">{tx.cost}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmPkg && (
        <PurchaseModal
          pkg={confirmPkg}
          onConfirm={handlePurchase}
          onClose={() => setConfirmPkg(null)}
          isLoading={isPurchasing}
        />
      )}

      {effectToPick && (
        <StreamPickerModal
          effect={effectToPick}
          onClose={() => setEffectToPick(null)}
          onConfirm={(stream) => {
            setBalance((prev) => prev - effectToPick.cost);
            const now = new Date();
            const dateStr = `${now.getDate()} ${['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'][now.getMonth()]}`;
            setTransactions((prev) => [
              {
                date: dateStr,
                type: 'send' as const,
                desc: `${effectToPick.name} \u2192 ${stream.clubName}`,
                amount: `-${effectToPick.cost}`,
                cost: null,
              },
              ...prev,
            ]);
            setToast({
              message: `${effectToPick.icon} Efekt ${effectToPick.name} wysłany na ${stream.title}!`,
              type: 'success',
            });
            setEffectToPick(null);
          }}
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
