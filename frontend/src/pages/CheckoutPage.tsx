import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Check,
  CreditCard,
  Lock,
  ArrowLeft,
  Loader2,
  Shield,
  Zap,
  Crown,
} from 'lucide-react';
import { cn } from '@/utils/cn';

/* --- Plan Definitions --- */

interface PlanDef {
  name: string;
  price: string;
  period: string;
  features: string[];
  type: 'viewer' | 'club';
  trial?: string;
}

const ALL_PLANS: Record<string, PlanDef> = {
  pass: {
    name: 'Padel Vision Pass',
    price: '19',
    period: 'mies.',
    type: 'viewer',
    features: [
      'Streaming 1080p',
      'Brak reklam',
      'Pełne VOD (archiwum)',
      'Ekskluzywne emotes',
    ],
  },
  pro: {
    name: 'Padel Vision Pro',
    price: '39',
    period: 'mies.',
    type: 'viewer',
    features: [
      'Wszystko z Pass',
      'Multi-stream (4 mecze jednocześnie)',
      'Zaawansowane statystyki meczów',
      'Early access do nowych funkcji',
    ],
  },
  starter: {
    name: 'Plan Starter',
    price: '99',
    period: 'mies.',
    type: 'club',
    trial: '14 dni gratis',
    features: [
      '3 aktywne korty',
      '5 streamów/miesiąc',
      '720p max',
      'VOD 30 dni retention',
      'Czat na żywo',
      'Profil klubu na mapie',
    ],
  },
  'club-pro': {
    name: 'Plan Pro',
    price: '249',
    period: 'mies.',
    type: 'club',
    trial: '14 dni gratis',
    features: [
      'Nieograniczone korty',
      'Nieograniczone streamy',
      '1080p max',
      'VOD 365 dni retention',
      'Multistream (YouTube + Facebook)',
      'Priorytetowe wsparcie',
      'Nakładki z wynikami',
      'Zaawansowane analityki',
    ],
  },
  enterprise: {
    name: 'Plan Enterprise',
    price: '599',
    period: 'mies.',
    type: 'club',
    features: [
      'Wszystko z Pro',
      'White label (własna domena)',
      'API dostęp',
      'Dedykowany manager',
      'SLA 99.9%',
      'Custom overlay branding',
      'Szkolenie dla personelu',
    ],
  },
};

/* --- Billing Cycle --- */

type BillingCycle = 'monthly' | 'yearly';

function getPrice(base: string, cycle: BillingCycle): string {
  const num = parseInt(base, 10);
  if (cycle === 'yearly') {
    return String(Math.round(num * 10));
  }
  return base;
}

function getSaving(base: string): string {
  const num = parseInt(base, 10);
  return String(num * 2);
}

/* --- Component --- */

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planKey = searchParams.get('plan') || '';

  const plan = ALL_PLANS[planKey.toLowerCase()];

  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  if (!plan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="glass-card max-w-md p-8 text-center">
          <h1 className="text-display text-2xl">Plan nie znaleziony</h1>
          <p className="mt-2 text-sm text-muted">
            Wybrany plan nie istnieje. Wróć do cennika i wybierz ponownie.
          </p>
          <Link
            to="/pricing"
            className="btn-primary mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do cennika
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = getPrice(plan.price, billing);
  const isClub = plan.type === 'club';
  const backHref = isClub ? '/for-clubs' : '/pricing';

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user-1',
          priceId: `price_${planKey}_${billing}`,
          mode: 'subscription',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Wystąpił błąd');
        setIsProcessing(false);
        return;
      }

      if (data.url) {
        setTimeout(() => {
          navigate(data.url);
        }, 1500);
      }
    } catch {
      setError('Nie udało się połączyć z serwerem płatności. Spróbuj ponownie.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          to={backHref}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do {isClub ? 'planów dla klubów' : 'cennika'}
        </Link>

        <div className="grid gap-8 md:grid-cols-5">
          {/* Left: Order Summary */}
          <div className="md:col-span-3">
            <h1 className="text-display text-3xl">Finalizuj zamówienie</h1>
            <p className="mt-1 text-sm text-muted">
              Krok 1 z 2 — wybierz cykl rozliczeniowy i potwierdź
            </p>

            {/* Billing Toggle */}
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-text">Cykl rozliczeniowy</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setBilling('monthly')}
                  className={cn(
                    'flex-1 rounded-xl border p-4 text-left transition-all',
                    billing === 'monthly'
                      ? 'border-lime bg-lime/5 ring-2 ring-lime/30'
                      : 'border-border bg-bg3 hover:border-border'
                  )}
                >
                  <div className="text-sm font-semibold text-text">Miesięcznie</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-display text-2xl text-text">{plan.price}</span>
                    <span className="text-xs text-muted">zł/mies.</span>
                  </div>
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={cn(
                    'relative flex-1 rounded-xl border p-4 text-left transition-all',
                    billing === 'yearly'
                      ? 'border-lime bg-lime/5 ring-2 ring-lime/30'
                      : 'border-border bg-bg3 hover:border-border'
                  )}
                >
                  <div className="absolute -top-2.5 right-3 rounded-full bg-lime px-2.5 py-0.5 text-[10px] font-bold text-black">
                    -17%
                  </div>
                  <div className="text-sm font-semibold text-text">Rocznie</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-display text-2xl text-text">{getPrice(plan.price, 'yearly')}</span>
                    <span className="text-xs text-muted">zł/rok</span>
                  </div>
                  <p className="mt-1 text-[11px] text-lime">
                    Oszczędzasz {getSaving(plan.price)} zł rocznie
                  </p>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-text">Metoda płatności</h2>
              <div className="glass-card flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">Karta kredytowa / debetowa</p>
                  <p className="text-xs text-muted">Visa, Mastercard, American Express</p>
                </div>
                <div className="rounded-full border border-lime bg-lime/10 p-1">
                  <Check className="h-3 w-3 text-lime" />
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                <Lock className="h-3 w-3" />
                Płatność obsługiwana przez Stripe — Twoje dane są bezpieczne
              </p>
            </div>

            {/* Terms */}
            <div className="mt-8">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border bg-bg3 text-lime accent-lime"
                />
                <span className="text-xs leading-relaxed text-muted">
                  Akceptuję{' '}
                  <span className="text-lime hover:underline cursor-pointer">Regulamin</span>{' '}
                  oraz{' '}
                  <span className="text-lime hover:underline cursor-pointer">Politykę Prywatności</span>
                  . Rozumiem, że subskrypcja będzie odnawiana automatycznie, a
                  mogę ją anulować w dowolnym momencie.
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!agreedToTerms || isProcessing}
              className={cn(
                'mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all',
                agreedToTerms && !isProcessing
                  ? 'btn-primary'
                  : 'cursor-not-allowed bg-bg3 text-muted opacity-60'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Przekierowywanie do płatności...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Zapłać {finalPrice} zł
                  {billing === 'yearly' ? ' / rok' : ' / mies.'}
                </>
              )}
            </button>
          </div>

          {/* Right: Plan Summary Card */}
          <div className="md:col-span-2">
            <div className="glass-card sticky top-24 overflow-hidden p-6">
              <div className="mb-4 flex items-center gap-3">
                {isClub ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime/10">
                    <Building2 className="h-5 w-5 text-lime" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime/10">
                    {planKey === 'pass' ? (
                      <Zap className="h-5 w-5 text-lime" />
                    ) : (
                      <Crown className="h-5 w-5 text-lime" />
                    )}
                  </div>
                )}
                <div>
                  <h3 className="text-display text-lg">{plan.name}</h3>
                  {plan.trial && <p className="text-xs text-lime">{plan.trial}</p>}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lime" />
                      <span className="text-text">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 space-y-2 border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{plan.name}</span>
                  <span className="text-text">{plan.price} zł/mies.</span>
                </div>
                {billing === 'yearly' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">× 10 miesięcy</span>
                    <span className="text-lime">2 mies. gratis</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span className="text-text">Razem</span>
                  <span className="text-display text-xl text-lime">
                    {finalPrice} zł
                    {billing === 'yearly' ? '/rok' : '/mies.'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 rounded-lg bg-bg3 px-3 py-1.5 text-[10px] text-muted">
                  <Shield className="h-3 w-3 text-lime" />
                  SSL Encrypted
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-bg3 px-3 py-1.5 text-[10px] text-muted">
                  <Lock className="h-3 w-3 text-lime" />
                  Stripe Secure
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-bg3 px-3 py-1.5 text-[10px] text-muted">
                  <CreditCard className="h-3 w-3 text-lime" />
                  PCI DSS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
