import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, MapPin, Shield, Film, Swords, Eye, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usersApi, type UserProfile } from '@/api/users';
import { postsApi, type FeedPost } from '@/api/posts';
import { matchesApi, type MatchRecord } from '@/api/matches';
import Navbar from '@/components/layout/Navbar';
import PostCard from '@/components/feed/PostCard';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';

type ProfileTab = 'clips' | 'matches';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('clips');
  const currentUser = useAuthStore((s) => s.user);

  const { data: profile } = useQuery({
    queryKey: ['profile', currentUser?.id],
    queryFn: () =>
      usersApi.getById(currentUser!.id).then((r) => r.data.data),
    enabled: !!currentUser?.id,
  });

  const { data: postsData } = useQuery({
    queryKey: ['userPosts', currentUser?.id],
    queryFn: () =>
      usersApi.getPosts(currentUser!.id, { page: 0, size: 20 }).then((r) => r.data),
    enabled: !!currentUser?.id && activeTab === 'clips',
  });

  const { data: matchesData } = useQuery({
    queryKey: ['userMatches'],
    queryFn: () =>
      matchesApi.getMine({ page: 0, size: 20 }).then((r) => r.data),
    enabled: activeTab === 'matches',
  });

  const posts: FeedPost[] = postsData?.data ?? [];
  const matches: MatchRecord[] = matchesData?.data ?? [];

  const user = profile ?? currentUser;
  const roleBadge: Record<string, { label: string; color: string }> = {
    VIEWER: { label: 'Gracz', color: 'bg-pv-surface-2 text-pv-white' },
    CLUB: { label: 'Klub', color: 'bg-pv-lime/20 text-pv-lime' },
    ADMIN: { label: 'Admin', color: 'bg-pv-red/20 text-pv-red' },
  };

  const badge = roleBadge[user?.role ?? 'VIEWER'] ?? roleBadge.VIEWER;

  return (
    <div className="min-h-screen bg-pv-obsidian">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Avatar + basic info */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-pv-surface-2 border-2 border-pv-lime/30 flex items-center justify-center overflow-hidden">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.username ?? ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-pv-lime font-display text-3xl">
                  {(user?.name || user?.username || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-pv-lime rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all">
              <Camera className="w-4 h-4 text-black" />
            </button>
          </div>

          <h1 className="font-display text-2xl text-pv-white tracking-wider">
            {user?.name || user?.username}
          </h1>
          <p className="text-pv-muted font-body text-sm mt-0.5">
            @{user?.username}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {(user as UserProfile)?.clubName && (
              <span className="text-pv-muted text-xs font-body flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                {(user as UserProfile).clubName}
              </span>
            )}
            {user?.city && (
              <span className="text-pv-muted text-xs font-body flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {user.city}
              </span>
            )}
            <span className={cn('text-xs font-display tracking-wider px-2 py-0.5 rounded-full', badge.color)}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            {
              label: 'Mecze',
              value: (profile as UserProfile)?.matchesPlayed ?? 0,
              icon: Swords,
            },
            {
              label: 'Win Rate',
              value: `${((profile as UserProfile)?.winRate ?? 0).toFixed(0)}%`,
              icon: TrendingUp,
            },
            {
              label: 'Klipy',
              value: (profile as UserProfile)?.clipsCount ?? 0,
              icon: Film,
            },
            {
              label: 'Wyświetlenia',
              value: (profile as UserProfile)?.totalViews ?? 0,
              icon: Eye,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-pv-surface rounded-xl border border-pv-border p-3 text-center"
            >
              <stat.icon className="w-4 h-4 text-pv-lime mx-auto mb-1" />
              <p className="text-pv-white font-mono text-lg font-medium">
                {stat.value}
              </p>
              <p className="text-pv-muted text-xs font-body">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-pv-border mb-6">
          {[
            { key: 'clips' as ProfileTab, label: 'Klipy' },
            { key: 'matches' as ProfileTab, label: 'Mecze' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 py-3 font-display text-sm tracking-wider transition-colors relative',
                activeTab === tab.key ? 'text-pv-lime' : 'text-pv-muted hover:text-pv-white'
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pv-lime" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'clips' && (
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-16">
                <Film className="w-10 h-10 text-pv-muted mx-auto mb-3" />
                <p className="text-pv-muted font-body">Brak klipów</p>
                <p className="text-pv-muted/60 font-body text-sm mt-1">
                  Dodaj swój pierwszy klip!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-3">
            {matches.length > 0 ? (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-pv-surface rounded-xl border border-pv-border p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-pv-muted text-xs font-body">
                      {match.round ? `Runda ${match.round}` : 'Mecz'}
                    </span>
                    <span className="text-pv-muted text-xs font-body">
                      {match.scheduledAt ? formatDate(match.scheduledAt) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pv-white font-body text-sm">
                      {match.team1Player1 ?? 'Gracz 1'} / {match.team1Player2 ?? 'Gracz 2'}
                    </span>
                    <span className="text-pv-muted font-mono text-xs">vs</span>
                    <span className="text-pv-white font-body text-sm text-right">
                      {match.team2Player1 ?? 'Gracz 3'} / {match.team2Player2 ?? 'Gracz 4'}
                    </span>
                  </div>
                  {match.score && (
                    <div className="text-center mt-2">
                      <span className="text-pv-lime font-mono text-sm">
                        {JSON.stringify(match.score)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <Swords className="w-10 h-10 text-pv-muted mx-auto mb-3" />
                <p className="text-pv-muted font-body">Brak meczów</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
