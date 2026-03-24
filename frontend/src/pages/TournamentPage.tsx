import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  MapPin,
  Users,
  Trophy,
  Tag,
  CreditCard,
  ChevronLeft,
  Monitor,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { formatDate, formatCurrency } from '@/utils/format';
import Navbar from '@/components/layout/Navbar';
import { cn } from '@/utils/cn';

interface Tournament {
  id: string;
  name: string;
  format: string;
  category: string;
  level: string;
  description: string | null;
  location: string;
  startDate: string;
  endDate: string | null;
  entryFee: number | null;
  ppvPrice: number | null;
  maxTeams: number | null;
  registeredTeams: number;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  matches: TournamentMatch[];
}

interface TournamentMatch {
  id: string;
  round: number;
  courtNumber: number | null;
  team1Name: string;
  team2Name: string;
  score: { sets: { t1: number; t2: number }[] } | null;
  winnerId: string | null;
  scheduledAt: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
}

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>();

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () =>
      apiClient
        .get<{ data: Tournament }>(`/api/tournaments/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pv-obsidian">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-pv-lime border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-pv-obsidian">
        <Navbar />
        <div className="text-center py-32">
          <p className="text-pv-muted font-body text-lg">Turniej nie znaleziony</p>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    UPCOMING: { text: 'Nadchodzący', color: 'bg-pv-lime/20 text-pv-lime' },
    IN_PROGRESS: { text: 'W trakcie', color: 'bg-pv-red/20 text-pv-red' },
    COMPLETED: { text: 'Zakończony', color: 'bg-pv-muted/20 text-pv-muted' },
  };

  const status = statusLabel[tournament.status] ?? statusLabel.UPCOMING;

  // Group matches by round
  const rounds = new Map<number, TournamentMatch[]>();
  tournament.matches?.forEach((m) => {
    const list = rounds.get(m.round) ?? [];
    list.push(m);
    rounds.set(m.round, list);
  });

  return (
    <div className="min-h-screen bg-pv-obsidian">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          to="/browse"
          className="inline-flex items-center gap-1 text-pv-muted hover:text-pv-lime text-sm font-body mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Powrót
        </Link>

        {/* Header */}
        <div className="bg-pv-surface rounded-2xl border border-pv-border p-6 mb-6">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <h1 className="font-display text-3xl text-pv-white tracking-wider flex-1">
              {tournament.name}
            </h1>
            <span className={cn('px-3 py-1 rounded-full text-xs font-display tracking-wider', status.color)}>
              {status.text}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="bg-pv-surface-2 text-pv-white text-xs font-body px-3 py-1 rounded-full flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-pv-lime" />
              {tournament.format}
            </span>
            <span className="bg-pv-surface-2 text-pv-white text-xs font-body px-3 py-1 rounded-full flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-pv-lime" />
              {tournament.category}
            </span>
            <span className="bg-pv-surface-2 text-pv-white text-xs font-body px-3 py-1 rounded-full">
              Poziom: {tournament.level}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-pv-lime flex-shrink-0" />
              <div>
                <p className="text-pv-muted text-xs font-body">Data</p>
                <p className="text-pv-white text-sm font-body">
                  {formatDate(tournament.startDate)}
                  {tournament.endDate && ` — ${formatDate(tournament.endDate)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-pv-lime flex-shrink-0" />
              <div>
                <p className="text-pv-muted text-xs font-body">Lokalizacja</p>
                <p className="text-pv-white text-sm font-body">{tournament.location}</p>
              </div>
            </div>

            {tournament.entryFee != null && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-pv-lime flex-shrink-0" />
                <div>
                  <p className="text-pv-muted text-xs font-body">Wpisowe</p>
                  <p className="text-pv-white text-sm font-body">
                    {formatCurrency(tournament.entryFee)}
                  </p>
                </div>
              </div>
            )}

            {tournament.ppvPrice != null && (
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-pv-lime flex-shrink-0" />
                <div>
                  <p className="text-pv-muted text-xs font-body">PPV</p>
                  <p className="text-pv-white text-sm font-body">
                    {formatCurrency(tournament.ppvPrice)}
                  </p>
                </div>
              </div>
            )}

            {tournament.maxTeams && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-pv-lime flex-shrink-0" />
                <div>
                  <p className="text-pv-muted text-xs font-body">Drużyny</p>
                  <p className="text-pv-white text-sm font-body">
                    {tournament.registeredTeams} / {tournament.maxTeams}
                  </p>
                </div>
              </div>
            )}
          </div>

          {tournament.description && (
            <p className="text-pv-muted font-body text-sm mt-4 leading-relaxed">
              {tournament.description}
            </p>
          )}
        </div>

        {/* Bracket / Matches */}
        <h2 className="font-display text-2xl text-pv-white tracking-wider mb-4">
          DRABINKA
        </h2>

        {rounds.size === 0 ? (
          <div className="bg-pv-surface rounded-xl border border-pv-border p-8 text-center">
            <p className="text-pv-muted font-body">
              Drabinka zostanie opublikowana wkrótce
            </p>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from(rounds.entries())
              .sort(([a], [b]) => a - b)
              .map(([round, matches]) => (
                <div key={round} className="flex-shrink-0 w-72">
                  <h3 className="text-pv-muted text-xs font-display tracking-wider mb-3">
                    RUNDA {round}
                  </h3>
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MatchCard({ match }: { match: TournamentMatch }) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  return (
    <div
      className={cn(
        'bg-pv-surface rounded-xl border p-3',
        isLive ? 'border-pv-red/50' : 'border-pv-border'
      )}
    >
      {/* Status */}
      <div className="flex items-center justify-between mb-2">
        {match.courtNumber && (
          <span className="text-pv-muted text-xs font-body">
            Kort {match.courtNumber}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-pv-red text-xs font-display tracking-wider">
            <span className="w-1.5 h-1.5 bg-pv-red rounded-full animate-pulse" />
            LIVE
          </span>
        )}
        {isCompleted && (
          <span className="text-pv-muted text-xs font-body">Zakończony</span>
        )}
      </div>

      {/* Team 1 */}
      <div className={cn(
        'flex items-center justify-between py-1.5',
        isCompleted && match.winnerId && match.winnerId === match.id
          ? 'text-pv-lime'
          : 'text-pv-white'
      )}>
        <span className="font-body text-sm truncate flex-1">
          {match.team1Name || 'TBD'}
        </span>
        {match.score?.sets && (
          <div className="flex gap-2 ml-2">
            {match.score.sets.map((set, i) => (
              <span key={i} className="font-mono text-sm w-4 text-center">
                {set.t1}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-pv-border my-0.5" />

      {/* Team 2 */}
      <div className="flex items-center justify-between py-1.5 text-pv-white">
        <span className="font-body text-sm truncate flex-1">
          {match.team2Name || 'TBD'}
        </span>
        {match.score?.sets && (
          <div className="flex gap-2 ml-2">
            {match.score.sets.map((set, i) => (
              <span key={i} className="font-mono text-sm w-4 text-center">
                {set.t2}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
