import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Medal,
  ChevronRight,
  BarChart3,
  Zap,
  Flame,
  Play,
  ArrowLeft,
  GitCompare,
} from 'lucide-react';
import { cn } from '@/utils/cn';

/* --- Types --- */

interface FormMatch {
  result: 'W' | 'L';
  score: string;
  date: string;
  opponent: string;
}

/* --- Mock Data --- */

const PLAYER = {
  name: 'Marcin Kowalski',
  slug: 'marcin-kowalski',
  avatar: null,
  club: { name: 'Racket Club Katowice', slug: 'racket-club-katowice' },
  ranking: 12,
  level: 'A',
  joinedDate: '2023-06-15',
  stats: {
    matchesPlayed: 187,
    matchesWon: 124,
    winRate: 66.3,
    tournamentsPlayed: 23,
    tournamentsWon: 5,
    aces: 342,
    currentStreak: 4,
  },
  categoryStats: [
    { category: 'OPEN', played: 45, won: 32, rate: 71.1 },
    { category: 'A', played: 82, won: 58, rate: 70.7 },
    { category: 'B1', played: 40, won: 24, rate: 60.0 },
    { category: 'B2', played: 20, won: 10, rate: 50.0 },
  ],
};

const STATS = [
  { label: 'Mecze', value: PLAYER.stats.matchesPlayed, icon: Target },
  { label: 'Wygrane', value: PLAYER.stats.matchesWon, icon: Trophy, color: 'text-lime' },
  { label: 'Win Rate', value: `${PLAYER.stats.winRate}%`, icon: TrendingUp, color: 'text-emerald-400' },
  { label: 'Turnieje', value: PLAYER.stats.tournamentsPlayed, icon: Calendar },
];

const FORM_LAST_10: FormMatch[] = [
  { result: 'W', score: '6-4, 6-3', date: '08.03', opponent: 'Wiśniewski/Zieliński' },
  { result: 'W', score: '6-2, 6-3', date: '06.03', opponent: 'Lewandowski/Mazur' },
  { result: 'L', score: '4-6, 6-4, 3-6', date: '22.02', opponent: 'Dąbrowski/Szymański' },
  { result: 'W', score: '6-3, 7-6', date: '15.02', opponent: 'Kamiński/Pawlak' },
  { result: 'W', score: '6-1, 6-4', date: '08.02', opponent: 'Król/Piotrowski' },
  { result: 'L', score: '3-6, 6-7', date: '01.02', opponent: 'Nowicki/Olszewski' },
  { result: 'W', score: '6-4, 7-5', date: '25.01', opponent: 'Jankowski/Kubiak' },
  { result: 'W', score: '6-2, 6-1', date: '18.01', opponent: 'Wróbel/Sikora' },
  { result: 'W', score: '7-6, 6-4', date: '11.01', opponent: 'Czarnecki/Krawczyk' },
  { result: 'L', score: '4-6, 2-6', date: '04.01', opponent: 'Baran/Zawadzki' },
];

const MATCH_HISTORY = [
  { date: '2026-03-08', tournament: 'Silesia Open 2026', round: 'Półfinał', partner: 'Jan Nowak', opponents: 'K. Wiśniewski / P. Zieliński', score: '6-4, 3-6, 7-5', won: true },
  { date: '2026-03-06', tournament: 'Silesia Open 2026', round: 'Ćwierćfinał', partner: 'Jan Nowak', opponents: 'T. Lewandowski / R. Mazur', score: '6-2, 6-3', won: true },
  { date: '2026-02-22', tournament: 'Liga Klubowa', round: 'Runda 8', partner: 'Adam Wójcik', opponents: 'M. Dąbrowski / S. Szymański', score: '4-6, 6-4, 3-6', won: false },
  { date: '2026-02-15', tournament: 'Kraków Open', round: 'Finał', partner: 'Jan Nowak', opponents: 'D. Kamiński / A. Pawlak', score: '6-3, 7-6', won: true },
  { date: '2026-02-08', tournament: 'Liga Klubowa', round: 'Runda 7', partner: 'Adam Wójcik', opponents: 'J. Król / M. Piotrowski', score: '6-1, 6-4', won: true },
];

const TOP_PARTNERS = [
  { name: 'Jan Nowak', slug: 'jan-nowak', matches: 45, wins: 34, winRate: 75.6 },
  { name: 'Adam Wójcik', slug: 'adam-wojcik', matches: 28, wins: 16, winRate: 57.1 },
  { name: 'Piotr Zieliński', slug: 'piotr-zielinski', matches: 12, wins: 8, winRate: 66.7 },
];

const TOURNAMENT_RESULTS = [
  { name: 'Kraków Open 2026', result: 'Zwycięzca', date: 'Luty 2026' },
  { name: 'Warszawa Masters', result: 'Finalista', date: 'Styczeń 2026' },
  { name: 'Silesia Cup', result: 'Zwycięzca', date: 'Grudzień 2025' },
  { name: 'Gdańsk Open', result: 'Półfinał', date: 'Listopad 2025' },
  { name: 'Liga Klubowa S2', result: '3. miejsce', date: 'Październik 2025' },
];

const HIGHLIGHT_CLIPS = [
  { id: 'c1', title: 'Smash z woleja — Silesia Open', views: 1234, duration: '0:18' },
  { id: 'c2', title: 'As serwisowy na match point', views: 892, duration: '0:12' },
  { id: 'c3', title: 'Rally 28 uderzeń — niesamowite!', views: 2105, duration: '0:45' },
  { id: 'c4', title: 'Vibora mistrzowska', views: 567, duration: '0:15' },
];

/* --- Component --- */

export default function PlayerProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'highlights'>('overview');

  const formWins = FORM_LAST_10.filter((m) => m.result === 'W').length;
  const formLosses = FORM_LAST_10.filter((m) => m.result === 'L').length;

  const tabs = [
    { key: 'overview' as const, label: 'Przegląd', icon: BarChart3 },
    { key: 'matches' as const, label: 'Mecze', icon: Target },
    { key: 'highlights' as const, label: 'Najlepsze momenty', icon: Zap },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <Link
          to="/rankings"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Ranking graczy
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-lime/10 text-display text-3xl text-lime sm:h-24 sm:w-24 sm:text-4xl">
            {PLAYER.name
              .split(' ')
              .map((w) => w[0])
              .join('')}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-display text-2xl lg:text-3xl">{PLAYER.name}</h1>
              <span className="rounded-full bg-lime/20 px-3 py-0.5 text-xs font-bold text-lime">
                Poziom {PLAYER.level}
              </span>
              <span className="rounded-full bg-orange/20 px-3 py-0.5 text-xs font-bold text-orange">
                #{PLAYER.ranking} w rankingu
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
              <Link
                to={`/club/${PLAYER.club.slug}`}
                className="flex items-center gap-1 text-lime hover:underline"
              >
                <Users className="h-3.5 w-3.5" />
                {PLAYER.club.name}
              </Link>
              <span>Dołączył: {PLAYER.joinedDate}</span>
              {PLAYER.stats.currentStreak > 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Flame className="h-3.5 w-3.5" />
                  Seria {PLAYER.stats.currentStreak} wygranych
                </span>
              )}
            </div>
            <Link
              to={`/player/${PLAYER.slug}/compare`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-bg3 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-bg4 hover:text-text"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Porównaj z innym graczem
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-card p-4">
                <Icon className={cn('mb-2 h-5 w-5', stat.color || 'text-muted')} />
                <p className="text-display text-2xl">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'border-lime text-lime'
                    : 'border-transparent text-muted hover:text-text'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Form Chart */}
              <div className="glass-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
                    <TrendingUp className="h-4 w-4 text-lime" />
                    Forma (ostatnie 10 meczów)
                  </h3>
                  <span className="font-mono text-sm text-text">
                    <span className="text-emerald-400">{formWins}W</span>
                    {' / '}
                    <span className="text-red-400">{formLosses}L</span>
                  </span>
                </div>

                <div className="mb-3 flex items-end gap-1">
                  {FORM_LAST_10.map((match, i) => (
                    <div key={i} className="group relative flex-1">
                      <div
                        className={cn(
                          'mx-auto w-full rounded-t-md transition-all',
                          match.result === 'W'
                            ? 'bg-emerald-500/70 group-hover:bg-emerald-500'
                            : 'bg-red-500/70 group-hover:bg-red-500'
                        )}
                        style={{
                          height: match.result === 'W' ? '40px' : '24px',
                        }}
                      />
                      <div className="pointer-events-none absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-bg2 px-2 py-1 text-[9px] text-text shadow-lg group-hover:block whitespace-nowrap border border-border">
                        <p className="font-bold">{match.result === 'W' ? 'Wygrana' : 'Przegrana'}</p>
                        <p className="text-muted">{match.score}</p>
                        <p className="text-muted">{match.date}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-[10px] text-muted">
                  <span>Starsze \u2190</span>
                  <span>\u2192 Nowsze</span>
                </div>
              </div>

              {/* Win/Loss per Category */}
              <div className="glass-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                  <BarChart3 className="h-4 w-4 text-lime" />
                  Win Rate per kategoria
                </h3>
                <div className="space-y-3">
                  {PLAYER.categoryStats.map((cat) => (
                    <div key={cat.category}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-text">{cat.category}</span>
                        <span className="text-xs text-muted">
                          {cat.won}W / {cat.played - cat.won}L —{' '}
                          <span className="font-mono text-lime">{cat.rate}%</span>
                        </span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-bg4">
                        <div
                          className="rounded-l-full bg-emerald-500/70"
                          style={{ width: `${cat.rate}%` }}
                        />
                        <div
                          className="rounded-r-full bg-red-500/40"
                          style={{ width: `${100 - cat.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Matches Quick */}
              <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
                    <Target className="h-4 w-4 text-muted" />
                    Ostatnie mecze
                  </h3>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="flex items-center gap-1 text-xs text-lime hover:underline"
                  >
                    Wszystkie
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-border/50">
                  {MATCH_HISTORY.slice(0, 3).map((match, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold',
                            match.won
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {match.won ? 'W' : 'L'}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-text">
                            {match.tournament} — {match.round}
                          </p>
                          <p className="text-[10px] text-muted">vs {match.opponents}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-text">{match.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Tournament Results */}
              <div className="glass-card p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                  <Trophy className="h-4 w-4 text-orange" />
                  Turnieje
                </h2>
                <div className="flex items-center gap-3 rounded-lg bg-lime/10 p-3 mb-3">
                  <Medal className="h-8 w-8 text-lime" />
                  <div>
                    <p className="text-display text-2xl text-lime">
                      {PLAYER.stats.tournamentsWon}
                    </p>
                    <p className="text-xs text-muted">Wygrane turnieje</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {TOURNAMENT_RESULTS.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-bg3 px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-medium text-text">{t.name}</p>
                        <p className="text-[10px] text-muted">{t.date}</p>
                      </div>
                      <span className="text-xs text-text">{t.result}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Partners */}
              <div className="glass-card p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                  <Users className="h-4 w-4 text-blue-400" />
                  Najczęstsi partnerzy
                </h2>
                <div className="space-y-2">
                  {TOP_PARTNERS.map((partner, i) => (
                    <Link
                      key={i}
                      to={`/player/${partner.slug}`}
                      className="block rounded-lg bg-bg3 p-3 transition-colors hover:bg-bg4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text">
                          {partner.name}
                        </span>
                        <span className="font-mono text-xs text-lime">
                          {partner.winRate}%
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                        <span>{partner.matches} meczów</span>
                        <span>•</span>
                        <span>{partner.wins} wygranych</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bg4">
                        <div
                          className="h-full rounded-full bg-lime/50"
                          style={{ width: `${partner.winRate}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Matches */}
        {activeTab === 'matches' && (
          <div className="glass-card overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
                <Target className="h-4 w-4 text-muted" />
                Pełna historia meczów
              </h2>
            </div>
            <div className="divide-y divide-border">
              {MATCH_HISTORY.map((match, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold',
                          match.won
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        )}
                      >
                        {match.won ? 'W' : 'L'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text">
                          {match.tournament}{' '}
                          <span className="text-muted">— {match.round}</span>
                        </p>
                        <p className="text-xs text-muted">
                          z {match.partner} vs {match.opponents}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-text">{match.score}</p>
                      <p className="text-[10px] text-muted">{match.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Highlights */}
        {activeTab === 'highlights' && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-lime" />
                <h3 className="text-sm font-semibold text-text">
                  Najlepsze momenty (AI)
                </h3>
              </div>
              <p className="text-xs text-muted">
                Automatycznie wygenerowane klipy z najlepszymi zagraniami gracza.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {HIGHLIGHT_CLIPS.map((clip) => (
                <Link
                  key={clip.id}
                  to={`/clips/${clip.id}`}
                  className="glass-card group overflow-hidden transition-all hover:border-lime/30"
                >
                  <div className="relative flex h-36 items-center justify-center bg-bg3">
                    <Play className="h-10 w-10 text-muted transition-colors group-hover:text-lime" />
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      {clip.duration}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-text group-hover:text-lime transition-colors">
                      {clip.title}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {clip.views.toLocaleString('pl-PL')} wyświetleń
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
