import { useState } from 'react';
import {
  Check,
  Building2,
  Radio,
  Trophy,
  BarChart3,
  Users,
  Globe,
  Banknote,
  Camera,
  Send,
  MapPin,
  Phone,
  Mail,
  User,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

const BENEFITS = [
  {
    icon: Radio,
    title: 'Streaming na żywo',
    desc: 'Transmituj mecze w jakości HD bezpośrednio z kortów. Automatyczne przełączanie kamer i nakładki z wynikami.',
  },
  {
    icon: Trophy,
    title: 'Turnieje online',
    desc: 'Twórz drabinki turniejowe, zarządzaj wynikami i przyciągaj graczy z całej Polski.',
  },
  {
    icon: BarChart3,
    title: 'Analityki i statystyki',
    desc: 'Śledź oglądalność, zaangażowanie widzów i przychody w czasie rzeczywistym.',
  },
  {
    icon: Users,
    title: 'Budowanie społeczności',
    desc: 'Czat na żywo, emotes klubowe i powiadomienia push. Twoi fani zawsze będą na bieżąco.',
  },
  {
    icon: Globe,
    title: 'Widoczność na mapie',
    desc: 'Twój klub na interaktywnej mapie Padel Vision — lokalni gracze znajdą Cię w kilka sekund.',
  },
  {
    icon: Banknote,
    title: 'Monetyzacja',
    desc: 'Zarabiaj na subskrypcjach, PPV i Piłkach (bitach). 70% przychodów trafia do Ciebie.',
  },
];

const CLUB_PLANS = [
  {
    name: 'Starter',
    slug: 'starter',
    price: '99',
    features: [
      '3 aktywne korty',
      '5 streamów/miesiąc',
      '720p max',
      'VOD 30 dni retention',
      'Czat na żywo',
      'Profil klubu na mapie',
    ],
    cta: 'Wybierz Starter',
    trial: '14 dni gratis',
  },
  {
    name: 'Pro',
    slug: 'club-pro',
    price: '249',
    popular: true,
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
    cta: 'Wybierz Pro',
    trial: '14 dni gratis',
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: '599',
    features: [
      'Wszystko z Pro',
      'White label (własna domena)',
      'API dostęp',
      'Dedykowany manager',
      'SLA 99.9%',
      'Custom overlay branding',
      'Szkolenie dla personelu',
    ],
    cta: 'Kontakt',
  },
];

export default function ForClubsPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('Starter');
  const [form, setForm] = useState({
    clubName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    courts: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
    if (error) setError('');
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.clubName.trim()) errs.clubName = 'Nazwa klubu jest wymagana';
    if (!form.contactName.trim()) errs.contactName = 'Podaj osobę kontaktową';
    if (!form.email.trim()) errs.email = 'Email jest wymagany';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Podaj poprawny email';
    if (!form.city.trim()) errs.city = 'Miasto jest wymagane';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Wystąpił błąd. Spróbuj ponownie.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Błąd połączenia z serwerem. Spróbuj ponownie.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-border bg-bg3 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime/30';

  return (
    <div className="px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-4 py-1.5 text-sm font-medium text-lime">
            <Camera className="h-4 w-4" />
            Program pilotażowy — Śląsk 2026
          </div>
          <h1 className="text-display text-4xl leading-tight text-text md:text-5xl">
            Transmituj mecze.{' '}
            <span className="text-lime">Buduj społeczność.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Padel Vision to platforma streamingowa stworzona specjalnie dla klubów
            padlowych. Docieraj do tysięcy widzów, organizuj turnieje online i
            zarabiaj na transmisjach.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="mb-20">
          <h2 className="mb-8 text-center text-display text-2xl">
            Dlaczego warto dołączyć?
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="glass-card p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-lime/10">
                    <Icon className="h-5 w-5 text-lime" />
                  </div>
                  <h3 className="mb-1 font-semibold text-text">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mb-20 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { value: '70%', label: 'przychodów dla klubu' },
            { value: '1080p', label: 'jakość streamingu' },
            { value: '24/7', label: 'dostęp do VOD' },
            { value: '0 zł', label: 'na start (14 dni trial)' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5 text-center">
              <div className="text-display text-2xl text-lime">{stat.value}</div>
              <div className="mt-1 text-xs text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Club Plans */}
        <div className="mb-20">
          <h2 className="mb-2 text-center text-display text-2xl">
            Plany dla klubów
          </h2>
          <p className="mb-8 text-center text-sm text-muted">
            Wszystkie plany zawierają profil klubu, stronę na mapie i podstawowy czat
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {CLUB_PLANS.map((plan) => {
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
                  <Building2
                    className={cn(
                      'mb-3 h-8 w-8',
                      isSelected ? 'text-lime' : plan.popular ? 'text-lime' : 'text-muted'
                    )}
                  />
                  <h3 className="text-display text-xl">Plan {plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-display text-4xl text-text">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted">zł/mies.</span>
                  </div>
                  {plan.trial && (
                    <p className="mt-1 text-xs text-lime">{plan.trial}</p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                        <span className="text-text">{f}</span>
                      </li>
                    ))}
                  </ul>
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div id="contact" className="mx-auto max-w-2xl scroll-mt-8">
          <div className="mb-8 text-center">
            <h2 className="text-display text-2xl">Dołącz do programu</h2>
            <p className="mt-2 text-sm text-muted">
              Wypełnij formularz — odezwiemy się w ciągu 24 godzin
            </p>
          </div>

          {submitted ? (
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lime/10">
                <Check className="h-8 w-8 text-lime" />
              </div>
              <h3 className="text-display text-xl">Dziękujemy!</h3>
              <p className="mt-2 text-muted">
                Twoje zgłoszenie zostało wysłane. Skontaktujemy się z Tobą
                w ciągu 24 godzin, aby omówić szczegóły współpracy.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card space-y-5 p-6 md:p-8" noValidate>
              {error && (
                <div className="rounded-lg border border-live/30 bg-live/10 px-4 py-3 text-sm text-live">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                    <Building2 className="h-3 w-3" />
                    Nazwa klubu *
                  </label>
                  <input
                    type="text"
                    value={form.clubName}
                    onChange={handleChange('clubName')}
                    disabled={loading}
                    className={cn(inputClass, fieldErrors.clubName && 'border-live')}
                    placeholder="np. Padel Gliwice"
                  />
                  {fieldErrors.clubName && <p className="mt-1 text-xs text-live">{fieldErrors.clubName}</p>}
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                    <User className="h-3 w-3" />
                    Osoba kontaktowa *
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={handleChange('contactName')}
                    disabled={loading}
                    className={cn(inputClass, fieldErrors.contactName && 'border-live')}
                    placeholder="Imię i nazwisko"
                  />
                  {fieldErrors.contactName && <p className="mt-1 text-xs text-live">{fieldErrors.contactName}</p>}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                    <Mail className="h-3 w-3" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    disabled={loading}
                    className={cn(inputClass, fieldErrors.email && 'border-live')}
                    placeholder="kontakt@klub.pl"
                  />
                  {fieldErrors.email && <p className="mt-1 text-xs text-live">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                    <Phone className="h-3 w-3" />
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    disabled={loading}
                    className={inputClass}
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="h-3 w-3" />
                    Miasto *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={handleChange('city')}
                    disabled={loading}
                    className={cn(inputClass, fieldErrors.city && 'border-live')}
                    placeholder="np. Gliwice"
                  />
                  {fieldErrors.city && <p className="mt-1 text-xs text-live">{fieldErrors.city}</p>}
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                    <Camera className="h-3 w-3" />
                    Liczba kortów
                  </label>
                  <select
                    value={form.courts}
                    onChange={handleChange('courts')}
                    disabled={loading}
                    className={inputClass}
                  >
                    <option value="">Wybierz</option>
                    <option value="1-2">1–2 korty</option>
                    <option value="3-4">3–4 korty</option>
                    <option value="5-6">5–6 kortów</option>
                    <option value="7+">7+ kortów</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted">
                  Wiadomość (opcjonalnie)
                </label>
                <textarea
                  value={form.message}
                  onChange={handleChange('message')}
                  disabled={loading}
                  rows={3}
                  className={inputClass}
                  placeholder="Opowiedz o swoim klubie, organizowanych turniejach..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Wyślij zgłoszenie
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-muted">
                Wysyłając formularz, wyrażasz zgodę na kontakt w sprawie oferty Padel Vision.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
