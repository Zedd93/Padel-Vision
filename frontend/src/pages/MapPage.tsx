import { useState, lazy, Suspense } from 'react';
import { MapPin, Radio, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

const ClubMap = lazy(() =>
  import('@/components/map/ClubMap').then((mod) => ({ default: mod.ClubMap }))
);

function MapSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-bg3">
      <div className="text-center">
        <MapPin className="mx-auto mb-2 h-8 w-8 animate-pulse text-lime" />
        <p className="text-sm text-muted">Ładowanie mapy...</p>
      </div>
    </div>
  );
}

const CLUB_LIST = [
  { name: 'Racket Club Katowice', city: 'Katowice', isLive: true, viewers: 342 },
  { name: 'Padel Kraków', city: 'Kraków', isLive: true, viewers: 187 },
  { name: 'Smash Arena Warszawa', city: 'Warszawa', isLive: false },
  { name: 'Court Masters Gdańsk', city: 'Gdańsk', isLive: false },
  { name: 'Viva Padel Poznań', city: 'Poznań', isLive: false },
  { name: 'Padel Wrocław', city: 'Wrocław', isLive: false },
  { name: 'Ace Padel Łódź', city: 'Łódź', isLive: false },
  { name: 'Silesia Padel', city: 'Gliwice', isLive: false },
  { name: 'Padel Zone Lublin', city: 'Lublin', isLive: false },
  { name: 'Net Point Szczecin', city: 'Szczecin', isLive: false },
];

export default function MapPage() {
  const [filter, setFilter] = useState<'all' | 'live'>('all');
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  const filteredClubs = CLUB_LIST.filter((c) => {
    if (filter === 'live' && !c.isLive) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const liveCount = CLUB_LIST.filter((c) => c.isLive).length;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top Controls */}
      <div className="flex items-center justify-between border-b border-border bg-bg2 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-display text-lg">Mapa Klubów</h1>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                filter === 'all'
                  ? 'bg-lime/20 text-lime'
                  : 'bg-bg3 text-muted hover:text-text'
              )}
            >
              Wszystkie ({CLUB_LIST.length})
            </button>
            <button
              onClick={() => setFilter('live')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                filter === 'live'
                  ? 'bg-live/20 text-live'
                  : 'bg-bg3 text-muted hover:text-text'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-live" />
              Na żywo ({liveCount})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5" />
          <span>{CLUB_LIST.length} klubów w Polsce</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Club List */}
        <div className="hidden w-72 flex-shrink-0 border-r border-border bg-bg2 md:flex md:flex-col">
          {/* Search */}
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Szukaj klubu lub miasta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg3 py-2 pl-8 pr-3 text-xs text-text placeholder:text-muted focus:border-lime focus:outline-none"
              />
            </div>
          </div>

          {/* Club list */}
          <div className="flex-1 overflow-y-auto">
            {filteredClubs.map((club, i) => (
              <button
                key={i}
                onClick={() => setSelectedClub(club.name)}
                className={cn(
                  'flex w-full items-center justify-between border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-bg3',
                  selectedClub === club.name && 'bg-bg3 border-l-2 border-l-lime'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold',
                      club.isLive
                        ? 'bg-live/20 text-live ring-2 ring-live/40'
                        : 'bg-bg4 text-muted'
                    )}
                  >
                    {club.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text">{club.name}</p>
                    <p className="text-[10px] text-muted">{club.city}</p>
                  </div>
                </div>
                {club.isLive && (
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-live" />
                    <span className="font-mono text-[10px] text-live">
                      {club.viewers}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="border-t border-border p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Legenda
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="h-2.5 w-2.5 rounded-full bg-live shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                <span className="text-muted">Transmisja na żywo</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="h-2.5 w-2.5 rounded-full bg-lime" />
                <span className="text-muted">Aktywny klub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="relative z-0 flex-1">
          <Suspense fallback={<MapSkeleton />}>
            <ClubMap filter={filter} selectedClubName={selectedClub} />
          </Suspense>

          {/* Mobile filter pills (over map) */}
          <div className="absolute left-3 top-3 flex gap-2 sm:hidden">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md',
                filter === 'all'
                  ? 'bg-lime/90 text-black'
                  : 'bg-bg2/80 text-muted'
              )}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setFilter('live')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md',
                filter === 'live'
                  ? 'bg-live/90 text-white'
                  : 'bg-bg2/80 text-muted'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-live" />
              Na żywo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
