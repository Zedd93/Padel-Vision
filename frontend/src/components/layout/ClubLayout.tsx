import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Radio,
  Trophy,
  BarChart3,
  Settings,
  Film,
  Wallet,
  ChevronLeft,
  LogOut,
  User,
  CreditCard,
  Shield,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/studio", label: "Studio", icon: Radio },
  { href: "/tournaments", label: "Turnieje", icon: Trophy },
  { href: "/vods", label: "Nagrania", icon: Film },
  { href: "/analytics", label: "Analityki", icon: BarChart3 },
  { href: "/earnings", label: "Zarobki", icon: Wallet },
  { href: "/settings", label: "Ustawienia", icon: Settings },
];

export default function ClubLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // In production: redirect to login if not authenticated
  // if (!isAuthenticated) { navigate to /login }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top Bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-bg2 px-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted transition-colors hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-display text-lg text-lime">PADEL VISION</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm font-medium text-text">Panel Klubu</span>
        </div>
        <ClubUserMenu />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="hidden w-56 flex-shrink-0 border-r border-border bg-bg2 py-4 md:block">
          <div className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-lime/10 text-lime"
                      : "text-muted hover:bg-bg3 hover:text-text"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ClubUserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const role = user?.role;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-bg3"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg4 text-xs font-bold text-lime">
          RC
        </div>
        <span className="text-sm text-text">Racket Club</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-bg2 py-1 shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-text">{user?.name || "Racket Club"}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
          <div className="py-1">
            <Link
              to="/subscriptions"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              <CreditCard className="h-4 w-4" />
              Moje konto
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              <Settings className="h-4 w-4" />
              Ustawienia klubu
            </Link>
            {role === "ADMIN" && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
              >
                <Shield className="h-4 w-4" />
                Panel admina
              </Link>
            )}
          </div>
          <div className="border-t border-border py-1">
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-bg3"
            >
              <LogOut className="h-4 w-4" />
              Wyloguj się
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
