import { useState } from 'react';
import { Check, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

const VIEWER_PLANS = [
  {
    name: 'Free',
    slug: 'free',
    price: '0',
    icon: Zap,
    features: [
      'Streaming 720p',
      'Czat (z reklamami pre-roll)',
      'VOD z ostatnich 7 dni',
    ],
    cta: 'Aktualne',
    current: true,
  },
  {
    name: 'Pass',
    slug: 'pass',
    price: '19',
    icon: Crown,
    popular: true,
    features: [
      'Streaming 1080p',
      'Brak reklam',
      'Pełne VOD (archiwum)',
      'Ekskluzywne emotes',
    ],
    cta: 'Wybierz Pass',
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: '39',
    icon: Crown,
    features: [
      'Wszystko z Pass',
      'Multi-stream (4 mecze jednocześnie)',
      'Zaawansowane statystyki meczów',
      'Early access do nowych funkcji',
    ],
    cta: 'Wybierz Pro',
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Free');

  return (
    <div className="px-4 py-12 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-display text-4xl text-lime">Cennik</h1>
          <p className="mt-2 text-muted">
            Wybierz plan dopasowany do Twoich potrzeb
          </p>
        </div>

        {/* Viewer Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {VIEWER_PLANS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.name;
            return (
              <div
                key={plan.name}
                onClick={() => setSelectedPlan(plan.name)}
                className={cn(
                  'glass-card relative cursor-pointer overflow-hidden p-6 transition-all duration-200',
                  isSelected
                    ? 'border-lime ring-2 ring-lime/30 scale-[1.02]'
                    : plan.popular
                    ? 'border-lime/40 ring-1 ring-lime/20 hover:border-lime/60'
                    : 'hover:border-border'
                )}
              >
                {plan.popular && (
                  <div className="absolute right-4 top-4 rounded-full bg-lime px-3 py-0.5 text-[10px] font-bold text-black">
                    POPULARNE
                  </div>
                )}
                <Icon
                  className={cn(
                    'mb-3 h-8 w-8',
                    isSelected ? 'text-lime' : plan.popular ? 'text-lime' : 'text-muted'
                  )}
                />
                <h3 className="text-display text-xl">
                  Padel Vision {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-display text-4xl text-text">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted">
                    {plan.price === '0' ? '' : 'zł/mies.'}
                  </span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                      <span className="text-text">{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <button
                    className={cn(
                      'mt-6 w-full py-2.5 text-sm',
                      isSelected
                        ? 'btn-primary'
                        : 'btn-secondary cursor-default opacity-50'
                    )}
                  >
                    {isSelected ? `Wybrany: ${plan.name}` : plan.cta}
                  </button>
                ) : (
                  <Link
                    to={`/checkout?plan=${plan.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'mt-6 block w-full py-2.5 text-center text-sm',
                      isSelected ? 'btn-primary' : 'btn-secondary'
                    )}
                  >
                    {isSelected ? `Wybrany: ${plan.name}` : plan.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Channel Subscription */}
        <div className="mt-12 glass-card p-8 text-center">
          <h2 className="text-display text-2xl">Subskrypcja kanału klubu</h2>
          <p className="mt-2 text-muted">
            Subskrybuj ulubiony klub za 9 zł/mies. — brak reklam + ekskluzywne
            emotes
          </p>
          <div className="mt-3 text-sm text-muted">
            Podział: 70% dla klubu, 30% dla platformy
          </div>
        </div>

        {/* CTA for clubs */}
        <div className="mt-8 text-center">
          <p className="text-muted">
            Prowadzisz klub padlowy?{' '}
            <Link to="/for-clubs" className="font-semibold text-lime hover:underline">
              Sprawdź ofertę dla klubów →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
