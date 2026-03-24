import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  X,
  Home,
  Radio,
  Video,
  User,
  MoreHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const NAV_LINKS = [
  { to: '/', label: 'Ściana', icon: Home },
  { to: '/browse', label: 'Na żywo', icon: Radio },
  { to: '/record', label: 'Nagraj', icon: Video },
  { to: '/account', label: 'Profil', icon: User },
  { to: '/rankings', label: 'Więcej', icon: MoreHorizontal },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <nav className="bg-pv-surface border-b border-pv-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-display text-xl text-pv-lime tracking-wider">
              PADEL VISION
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body transition-colors',
                    isActive
                      ? 'text-pv-lime bg-pv-lime/10'
                      : 'text-pv-muted hover:text-pv-white hover:bg-pv-surface-2'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-pv-muted hover:text-pv-white transition-colors rounded-lg hover:bg-pv-surface-2">
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated && (
              <button className="p-2 text-pv-muted hover:text-pv-white transition-colors rounded-lg hover:bg-pv-surface-2 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pv-red rounded-full" />
              </button>
            )}

            {isAuthenticated && user ? (
              <Link
                to="/account"
                className="w-8 h-8 rounded-full bg-pv-surface-2 border border-pv-border flex items-center justify-center overflow-hidden hover:border-pv-lime/40 transition-colors"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-pv-lime font-display text-xs">
                    {(user.name || user.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-pv-lime text-black font-display text-sm tracking-wider px-4 py-1.5 rounded-lg hover:brightness-110 transition-all"
              >
                ZALOGUJ
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-pv-muted hover:text-pv-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pv-border bg-pv-surface">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors',
                    isActive
                      ? 'text-pv-lime bg-pv-lime/10'
                      : 'text-pv-muted hover:text-pv-white hover:bg-pv-surface-2'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
