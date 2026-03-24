import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || '';
  const sessionId = searchParams.get('session') || '';

  const isClub = ['starter', 'club-pro', 'enterprise'].includes(
    plan.toLowerCase()
  );

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass-card max-w-lg p-8 text-center md:p-12">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-lime/10">
          <CheckCircle2 className="h-10 w-10 text-lime" />
        </div>

        <h1 className="text-display text-3xl">Płatność zakończona!</h1>
        <p className="mt-3 text-muted">
          Twoja subskrypcja została aktywowana. Możesz teraz korzystać ze
          wszystkich funkcji wybranego planu.
        </p>

        {sessionId && (
          <div className="mt-4 rounded-lg bg-bg3 px-4 py-2 text-xs text-muted">
            ID transakcji:{' '}
            <span className="font-mono text-text">{sessionId}</span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          {isClub ? (
            <Link
              to="/studio"
              className="btn-primary flex items-center justify-center gap-2 py-3 text-sm"
            >
              Przejdź do Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/"
              className="btn-primary flex items-center justify-center gap-2 py-3 text-sm"
            >
              Zacznij oglądać
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            to="/"
            className="btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Home className="h-4 w-4" />
            Strona główna
          </Link>
        </div>
      </div>
    </div>
  );
}
