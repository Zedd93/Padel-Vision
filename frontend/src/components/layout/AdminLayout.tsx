import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  Shield,
  ChevronLeft,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Użytkownicy", icon: Users },
  { href: "/admin/clubs", label: "Kluby", icon: Building2 },
  { href: "/admin/finance", label: "Finanse", icon: DollarSign },
  { href: "/admin/moderation", label: "Moderacja", icon: Shield },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <span className="animate-pulse text-display text-3xl text-lime">PADEL VISION</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
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
          <span className="text-sm font-medium text-text">Panel Admina</span>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="hidden w-56 flex-shrink-0 border-r border-border bg-bg2 py-4 md:block">
          <div className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.href);
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
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
