import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-pv-surface border-t border-pv-border py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logos/logo-icon.svg" alt="PV" className="h-5 w-5" />
            <p className="text-pv-muted text-sm font-body">
              &copy; 2026 Padel Vision
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/terms"
              className="text-pv-muted text-sm font-body hover:text-pv-white transition-colors"
            >
              Regulamin
            </Link>
            <Link
              to="/privacy"
              className="text-pv-muted text-sm font-body hover:text-pv-white transition-colors"
            >
              Polityka prywatności
            </Link>
            <Link
              to="/contact"
              className="text-pv-muted text-sm font-body hover:text-pv-white transition-colors"
            >
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
