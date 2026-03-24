import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

interface SidebarClub {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isLive: boolean;
}

// Mock data for now — will be replaced with real data from API
const mockClubs: SidebarClub[] = [
  { id: "1", name: "Racket Club", slug: "racket-club", logo: null, isLive: true },
  { id: "2", name: "Padel Kraków", slug: "padel-krakow", logo: null, isLive: true },
  { id: "3", name: "Smash Arena", slug: "smash-arena", logo: null, isLive: false },
  { id: "4", name: "Court Master", slug: "court-master", logo: null, isLive: false },
  { id: "5", name: "Vamos Padel", slug: "vamos-padel", logo: null, isLive: false },
];

export function Sidebar() {
  return (
    <aside className="hidden w-[60px] flex-shrink-0 flex-col border-r border-border bg-bg2 lg:flex">
      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3">
        <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          Live
        </span>
        {mockClubs
          .filter((c) => c.isLive)
          .map((club) => (
            <SidebarClubAvatar key={club.id} club={club} />
          ))}

        <div className="my-2 h-px w-8 bg-border" />

        <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          Obserwowane
        </span>
        {mockClubs
          .filter((c) => !c.isLive)
          .map((club) => (
            <SidebarClubAvatar key={club.id} club={club} />
          ))}
      </div>
    </aside>
  );
}

function SidebarClubAvatar({ club }: { club: SidebarClub }) {
  const initials = club.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <Link
      to={`/club/${club.slug}`}
      className="group relative flex flex-col items-center"
      title={club.name}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all",
          club.isLive
            ? "bg-bg4 text-lime ring-2 ring-live/60"
            : "bg-bg3 text-muted group-hover:text-text"
        )}
      >
        {initials}
      </div>
      {club.isLive && (
        <span className="mt-0.5 text-[9px] font-bold uppercase text-live animate-live-pulse">
          Live
        </span>
      )}
    </Link>
  );
}
