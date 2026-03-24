import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Wallet, Settings, ChevronLeft, User, Radio, LogOut, Shield } from "lucide-react";
import { cn } from "@/utils/cn";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/subscriptions", label: "Subskrypcje", icon: CreditCard },
  { href: "/wallet", label: "Portfel Piłek", icon: Wallet },
  { href: "/account", label: "Ustawienia", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <img src="/logos/logo-full-dark.svg" alt="Padel Vision" className="h-10 animate-pulse" />
      </div>
    );
  }

  const role = user?.role;
  const hasClubAccess = role === "CLUB" || role === "ADMIN";

  return (
    <div className="flex h-screen flex-col bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-border bg-bg2 px-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted transition-colors hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" />
            <img src="/logos/logo-full-dark.svg" alt="Padel Vision" className="h-8" />
          </Link>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm font-medium text-text">Moje konto</span>
        </div>
        <DashboardUserMenu />
      </header>

      <div className="flex flex-1 overflow-hidden">
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

          {/* Panel Klubowy — only for CLUB and ADMIN roles */}
          {hasClubAccess && (
            <div className="mt-4 border-t border-border px-3 pt-4">
              <Link
                to="/studio"
                className="flex items-center gap-3 rounded-lg bg-lime/10 px-3 py-2.5 text-sm font-medium text-lime transition-colors hover:bg-lime/20"
              >
                <Radio className="h-4 w-4" />
                Panel Klubowy
              </Link>
            </div>
          )}

          {/* Panel Admina — only for ADMIN role */}
          {role === "ADMIN" && (
            <div className={cn("border-t border-border px-3 pt-4", hasClubAccess ? "mt-2" : "mt-4")}>
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Shield className="h-4 w-4" />
                Panel Admina
              </Link>
            </div>
          )}
        </nav>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DashboardUserMenu() {
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
        className="flex h-8 w-8 items-center justify-center rounded-full bg-bg4 transition-colors hover:bg-bg3"
      >
        <User className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-bg2 py-1 shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-text">{user?.name || "Użytkownik"}</p>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
          <div className="py-1">
            <Link
              to="/subscriptions"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              <CreditCard className="h-4 w-4" />
              Subskrypcje
            </Link>
            <Link
              to="/wallet"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              <Wallet className="h-4 w-4" />
              Portfel Piłek
            </Link>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-muted transition-colors hover:bg-bg3 hover:text-text"
            >
              <Settings className="h-4 w-4" />
              Ustawienia
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
