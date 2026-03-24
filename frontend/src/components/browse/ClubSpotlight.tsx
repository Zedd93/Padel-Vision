import { Link } from "react-router-dom";
import {
  Star,
  TrendingUp,
  Users,
  MapPin,
  Radio,
  Eye,
  Trophy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";

/* ─── Types ────────────────────────────────────── */

interface SpotlightClub {
  slug: string;
  name: string;
  location: string;
  followers: number;
  liveViewers: number;
  isLive: boolean;
  category: string;
  totalStreams: number;
  growthPercent: number;
  badge: "trending" | "new" | "pick";
  description: string;
}

/* ─── Mock Data ────────────────────────────────── */

const SPOTLIGHT_CLUBS: SpotlightClub[] = [
  {
    slug: "racket-club-katowice",
    name: "Racket Club Katowice",
    location: "Katowice",
    followers: 1854,
    liveViewers: 2847,
    isLive: true,
    category: "OPEN",
    totalStreams: 45,
    growthPercent: 340,
    badge: "trending",
    description:
      "Najszybciej rosnący klub na Padel Vision! Profesjonalne turnieje i świetna atmosfera.",
  },
  {
    slug: "padel-city-lodz",
    name: "Padel City Łódź",
    location: "Łódź",
    followers: 342,
    liveViewers: 0,
    isLive: false,
    category: "OPEN",
    totalStreams: 8,
    growthPercent: 0,
    badge: "new",
    description:
      "Nowy klub na platformie! 4 korty padel, regularne turnieje weekendowe.",
  },
  {
    slug: "smash-padel-wroclaw",
    name: "Smash Padel Wrocław",
    location: "Wrocław",
    followers: 3210,
    liveViewers: 967,
    isLive: true,
    category: "KOBIETY",
    totalStreams: 89,
    growthPercent: 45,
    badge: "pick",
    description:
      "Wybór redakcji Padel Vision. Najlepsze turnieje kobiet w Polsce.",
  },
];

const BADGE_CONFIG = {
  trending: {
    label: "Trending",
    icon: TrendingUp,
    color: "text-orange bg-orange/10 border-orange/20",
  },
  new: {
    label: "Nowy klub",
    icon: Sparkles,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  pick: {
    label: "Padel Vision Pick",
    icon: Star,
    color: "text-lime bg-lime/10 border-lime/20",
  },
};

/* ─── Component ────────────────────────────────── */

export function ClubSpotlight() {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/10">
          <Star className="h-4 w-4 text-lime" />
        </div>
        <div>
          <h2 className="text-display text-lg">PADEL VISION PICKS</h2>
          <p className="text-xs text-muted">
            Wyróżnione kluby tygodnia — odkryj nowe transmisje
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPOTLIGHT_CLUBS.map((club) => {
          const badge = BADGE_CONFIG[club.badge];
          const BadgeIcon = badge.icon;

          return (
            <Link
              key={club.slug}
              to={`/club/${club.slug}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-bg2 transition-all hover:border-lime hover:-translate-y-1"
            >
              {/* Badge */}
              <div className="absolute right-3 top-3 z-10">
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    badge.color
                  )}
                >
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                </span>
              </div>

              {/* Club header — gradient bg */}
              <div className="relative h-28 bg-gradient-to-br from-bg3 to-bg4">
                {/* Live indicator */}
                {club.isLive && (
                  <div className="absolute left-3 top-3">
                    <span className="badge-live flex items-center gap-1 text-[10px]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      NA ŻYWO
                    </span>
                  </div>
                )}

                {/* Club initials */}
                <div className="absolute bottom-0 left-4 translate-y-1/2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-bg2 bg-bg4 text-display text-lg text-lime">
                    {club.slug.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-4 pt-9">
                <h3 className="text-sm font-semibold text-text group-hover:text-lime transition-colors">
                  {club.name}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {club.location}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {club.followers.toLocaleString("pl-PL")}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs text-muted/80">
                  {club.description}
                </p>

                {/* Stats row */}
                <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                  {club.isLive && (
                    <span className="flex items-center gap-1 text-xs text-lime">
                      <Eye className="h-3 w-3" />
                      {club.liveViewers.toLocaleString("pl-PL")} widzów
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Radio className="h-3 w-3" />
                    {club.totalStreams} transmisji
                  </span>
                  {club.badge === "trending" && (
                    <span className="flex items-center gap-1 text-xs text-orange">
                      <TrendingUp className="h-3 w-3" />
                      +{club.growthPercent}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
