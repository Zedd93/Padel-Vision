import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/layout/Navbar';
import { cn } from '@/utils/cn';

interface RankedPlayer {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  clubName: string | null;
  eloRating: number;
  eloChange: number;
  rank: number;
}

export default function RankingsPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: players, isLoading } = useQuery({
    queryKey: ['rankings'],
    queryFn: () =>
      apiClient
        .get<{ data: RankedPlayer[] }>('/api/rankings')
        .then((r) => r.data.data),
  });

  function getRankDisplay(rank: number) {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-pv-muted font-mono text-sm">{rank}</span>;
  }

  function getChangeIndicator(change: number) {
    if (change > 0)
      return (
        <div className="flex items-center gap-0.5 text-green-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">+{change}</span>
        </div>
      );
    if (change < 0)
      return (
        <div className="flex items-center gap-0.5 text-pv-red">
          <TrendingDown className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{change}</span>
        </div>
      );
    return (
      <div className="flex items-center text-pv-muted">
        <Minus className="w-3.5 h-3.5" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pv-obsidian">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="font-display text-4xl text-pv-white tracking-wider mb-8">
          RANKING ELO
        </h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-pv-surface rounded-xl p-4 border border-pv-border animate-pulse flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-pv-surface-2" />
                <div className="w-10 h-10 rounded-full bg-pv-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-pv-surface-2 rounded w-32" />
                  <div className="h-2.5 bg-pv-surface-2 rounded w-20" />
                </div>
                <div className="h-4 bg-pv-surface-2 rounded w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_auto_5rem_3rem] items-center px-4 py-2 text-pv-muted text-xs font-body uppercase tracking-wider">
              <span>#</span>
              <span>Gracz</span>
              <span className="hidden sm:block">Klub</span>
              <span className="text-right">ELO</span>
              <span className="text-right">Zm.</span>
            </div>

            {players?.map((player) => {
              const isCurrentUser = player.id === currentUserId;
              return (
                <div
                  key={player.id}
                  className={cn(
                    'grid grid-cols-[3rem_1fr_auto_5rem_3rem] items-center px-4 py-3 rounded-xl border transition-colors',
                    isCurrentUser
                      ? 'bg-pv-lime/10 border-pv-lime/30'
                      : 'bg-pv-surface border-pv-border hover:border-pv-lime/20'
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8">
                    {getRankDisplay(player.rank)}
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-pv-surface-2 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={player.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-pv-lime font-display text-sm">
                          {(player.name || player.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        'font-body text-sm font-medium truncate',
                        isCurrentUser ? 'text-pv-lime' : 'text-pv-white'
                      )}>
                        {player.name || player.username}
                      </p>
                      <p className="text-pv-muted text-xs font-body truncate sm:hidden">
                        {player.clubName}
                      </p>
                    </div>
                  </div>

                  {/* Club */}
                  <span className="hidden sm:block text-pv-muted text-sm font-body pr-4 truncate max-w-[150px]">
                    {player.clubName || '—'}
                  </span>

                  {/* ELO */}
                  <span className="text-right font-mono text-pv-white text-sm font-medium">
                    {player.eloRating}
                  </span>

                  {/* Change */}
                  <div className="flex justify-end">
                    {getChangeIndicator(player.eloChange)}
                  </div>
                </div>
              );
            })}

            {(!players || players.length === 0) && (
              <div className="text-center py-16">
                <p className="text-pv-muted font-body">Brak danych rankingowych</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
