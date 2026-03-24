import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { streamsApi, type Stream } from '@/api/streams';
import StreamCard from '@/components/stream/StreamCard';
import Navbar from '@/components/layout/Navbar';

export default function BrowsePage() {
  const { data: liveStreams, isLoading: loadingLive } = useQuery({
    queryKey: ['streams', 'live'],
    queryFn: () => streamsApi.getLive().then((r) => r.data.data),
  });

  const { data: archivedData, isLoading: loadingArchived } = useQuery({
    queryKey: ['streams', 'archived'],
    queryFn: () => streamsApi.getArchived({ page: 0, size: 12 }).then((r) => r.data),
  });

  const archived: Stream[] = archivedData?.data ?? [];

  return (
    <div className="min-h-screen bg-pv-obsidian">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Live section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-pv-white tracking-wider">
              NA ŻYWO
            </h2>
            {liveStreams && liveStreams.length > 4 && (
              <Link
                to="/browse?tab=live"
                className="flex items-center gap-1 text-pv-lime text-sm font-body hover:underline"
              >
                Pokaż wszystkie
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {loadingLive ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-72 animate-pulse">
                  <div className="aspect-video rounded-xl bg-pv-surface-2" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3 bg-pv-surface-2 rounded w-3/4" />
                    <div className="h-2.5 bg-pv-surface-2 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : liveStreams && liveStreams.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {liveStreams.map((stream: Stream) => (
                <StreamCard key={stream.id} stream={stream} variant="horizontal" />
              ))}
            </div>
          ) : (
            <div className="bg-pv-surface rounded-xl border border-pv-border p-8 text-center">
              <p className="text-pv-muted font-body">
                Brak transmisji na żywo w tej chwili
              </p>
              <p className="text-pv-muted/60 font-body text-sm mt-1">
                Sprawdź później lub przejrzyj archiwum
              </p>
            </div>
          )}
        </section>

        {/* VOD section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-pv-white tracking-wider">
              VOD
            </h2>
          </div>

          {loadingArchived ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video rounded-xl bg-pv-surface-2" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3 bg-pv-surface-2 rounded w-3/4" />
                    <div className="h-2.5 bg-pv-surface-2 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : archived.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {archived.map((stream: Stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          ) : (
            <div className="bg-pv-surface rounded-xl border border-pv-border p-8 text-center">
              <p className="text-pv-muted font-body">Brak archiwalnych transmisji</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
