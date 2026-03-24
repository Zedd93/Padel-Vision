import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Eye, Radio, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { streamsApi } from '@/api/streams';
import { matchesApi } from '@/api/matches';
import { useWebSocket } from '@/hooks/useWebSocket';
import ChatPanel from '@/components/stream/ChatPanel';
import { formatViewerCount } from '@/utils/format';
import { cn } from '@/utils/cn';

interface LiveScore {
  team1: string;
  team2: string;
  sets: { t1: number; t2: number }[];
  serving: 1 | 2;
}

export default function LivePage() {
  const { id } = useParams<{ id: string }>();
  const [score, setScore] = useState<LiveScore | null>(null);
  const { connected, subscribe } = useWebSocket();

  const { data: stream, isLoading } = useQuery({
    queryKey: ['stream', id],
    queryFn: () => streamsApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: match } = useQuery({
    queryKey: ['match', stream?.matchId],
    queryFn: () => matchesApi.getById(stream!.matchId!).then((r) => r.data.data),
    enabled: !!stream?.matchId,
  });

  // Subscribe to live score updates
  useEffect(() => {
    if (!connected || !id) return;

    const sub = subscribe(`/topic/stream.${id}.score`, (message) => {
      try {
        setScore(JSON.parse(message.body) as LiveScore);
      } catch {
        // ignore
      }
    });

    return () => {
      sub?.unsubscribe();
    };
  }, [connected, id, subscribe]);

  const isLive = stream?.status === 'LIVE';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pv-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pv-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pv-obsidian">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-pv-border">
        <Link to="/browse" className="text-pv-muted hover:text-pv-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-pv-white font-body font-medium text-sm truncate">
            {stream?.title || 'Stream'}
          </h1>
          <p className="text-pv-muted text-xs font-body">
            {stream?.club?.name || 'Nieznany klub'}
          </p>
        </div>
        {isLive && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-pv-red/20 text-pv-red px-2 py-1 rounded-md">
              <Radio className="w-3.5 h-3.5" />
              <span className="text-xs font-display tracking-wider">LIVE</span>
            </div>
            <div className="flex items-center gap-1 text-pv-muted">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">
                {formatViewerCount(stream?.viewerCount ?? 0)}
              </span>
            </div>
          </div>
        )}
        {!isLive && stream?.status === 'VOD' && (
          <div className="flex items-center gap-1 bg-pv-orange/20 text-pv-orange px-2 py-1 rounded-md">
            <span className="text-xs font-display tracking-wider">VOD</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-57px)]">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video player placeholder */}
          <div className="relative aspect-video bg-pv-surface-2 lg:aspect-auto lg:flex-1">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm hover:bg-pv-lime/20 transition-colors group">
                <Play className="w-10 h-10 text-pv-white group-hover:text-pv-lime fill-current ml-1 transition-colors" />
              </button>
            </div>
            {stream?.thumbnailUrl && (
              <img
                src={stream.thumbnailUrl}
                alt={stream.title}
                className="w-full h-full object-cover opacity-40"
              />
            )}
          </div>

          {/* Live score widget */}
          {(score || match) && (
            <div className="bg-pv-surface border-t border-pv-border px-4 py-3">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="text-center flex-1">
                  <p className={cn(
                    'font-display text-lg',
                    score?.serving === 1 ? 'text-pv-lime' : 'text-pv-white'
                  )}>
                    {score?.team1 || 'Drużyna 1'}
                  </p>
                </div>
                <div className="flex items-center gap-3 px-4">
                  {score?.sets.map((set, i) => (
                    <div key={i} className="text-center">
                      <span className="text-pv-muted text-xs font-body block">Set {i + 1}</span>
                      <span className="font-mono text-pv-white text-lg">
                        {set.t1} - {set.t2}
                      </span>
                    </div>
                  )) ?? (
                    <span className="font-mono text-pv-muted text-lg">vs</span>
                  )}
                </div>
                <div className="text-center flex-1">
                  <p className={cn(
                    'font-display text-lg',
                    score?.serving === 2 ? 'text-pv-lime' : 'text-pv-white'
                  )}>
                    {score?.team2 || 'Drużyna 2'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stream info (mobile) */}
          <div className="lg:hidden p-4 border-t border-pv-border">
            <h2 className="text-pv-white font-body font-medium">
              {stream?.title}
            </h2>
            <p className="text-pv-muted text-sm font-body mt-1">
              {stream?.description || stream?.club?.name}
            </p>
          </div>
        </div>

        {/* Chat panel */}
        <div className="lg:w-96 h-80 lg:h-full border-t lg:border-t-0 lg:border-l border-pv-border">
          {id && <ChatPanel streamId={id} />}
        </div>
      </div>
    </div>
  );
}
