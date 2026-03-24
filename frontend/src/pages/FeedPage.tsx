import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import { postsApi, type FeedFilter, type FeedPost } from '@/api/posts';
import PostCard from '@/components/feed/PostCard';
import Navbar from '@/components/layout/Navbar';
import { cn } from '@/utils/cn';

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'akcje', label: 'Akcje' },
  { key: 'montaze', label: 'Montaże' },
  { key: 'turnieje', label: 'Turnieje' },
];

export default function FeedPage() {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', filter],
    queryFn: ({ pageParam = 0 }) =>
      postsApi.getFeed({ filter, page: pageParam, size: 10 }).then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage: { data: FeedPost[]; hasMore: boolean }, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const posts = data?.pages.flatMap((page) => page.data ?? page) ?? [];

  return (
    <div className="min-h-screen bg-pv-obsidian">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        {/* Pull to refresh */}
        <button
          onClick={handleRefresh}
          className="w-full flex items-center justify-center gap-2 py-2 mb-4 text-pv-muted hover:text-pv-lime transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          <span className="text-sm font-body">Odśwież</span>
        </button>

        {/* Filter chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full font-body text-sm transition-all',
                filter === f.key
                  ? 'bg-pv-lime text-black font-medium'
                  : 'bg-pv-surface border border-pv-border text-pv-muted hover:text-pv-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-pv-surface rounded-2xl overflow-hidden border border-pv-border animate-pulse">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-pv-surface-2" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-pv-surface-2 rounded w-28" />
                    <div className="h-2.5 bg-pv-surface-2 rounded w-20" />
                  </div>
                </div>
                <div className="aspect-video bg-pv-surface-2" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-pv-surface-2 rounded w-3/4" />
                  <div className="h-8" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed */}
        <div className="space-y-6">
          {posts.map((post: FeedPost) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="w-6 h-6 border-2 border-pv-lime border-t-transparent rounded-full animate-spin" />
          )}
          {!hasNextPage && posts.length > 0 && (
            <p className="text-pv-muted text-sm font-body">Nie ma więcej postów</p>
          )}
        </div>

        {/* Empty state */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-pv-muted font-body text-lg mb-2">Brak postów</p>
            <p className="text-pv-muted/60 font-body text-sm">
              Dodaj pierwszy klip lub zmień filtr
            </p>
          </div>
        )}
      </main>

      {/* Floating upload button */}
      <Link
        to="/record"
        className="fixed bottom-6 right-6 w-14 h-14 bg-pv-lime rounded-full flex items-center justify-center shadow-lg shadow-pv-lime/20 hover:scale-110 active:scale-95 transition-transform z-50"
      >
        <Plus className="w-7 h-7 text-black" />
      </Link>
    </div>
  );
}
