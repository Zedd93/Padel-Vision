import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play } from 'lucide-react';
import type { FeedPost } from '@/api/posts';
import { postsApi } from '@/api/posts';
import { timeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';

interface PostCardProps {
  post: FeedPost;
  onLikeToggle?: (postId: string, isLiked: boolean) => void;
}

export default function PostCard({ post, onLikeToggle }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked);

  async function handleLike() {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    try {
      if (newLiked) {
        await postsApi.like(post.id);
      } else {
        await postsApi.unlike(post.id);
      }
      onLikeToggle?.(post.id, newLiked);
    } catch {
      setLiked(!newLiked);
      setLikesCount((c) => c + (newLiked ? -1 : 1));
    }
  }

  return (
    <div className="bg-pv-surface rounded-2xl overflow-hidden border border-pv-border">
      {/* User header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-pv-surface-2 flex items-center justify-center overflow-hidden flex-shrink-0">
          {post.user.image ? (
            <img
              src={post.user.image}
              alt={post.user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-pv-lime font-display text-lg">
              {(post.user.name || post.user.username).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-pv-white font-body font-medium text-sm truncate">
            {post.user.name || post.user.username}
          </p>
          <p className="text-pv-muted text-xs font-body">
            @{post.user.username} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Video thumbnail */}
      <div className="relative aspect-video bg-pv-obsidian">
        {post.thumbnailUrl ? (
          <img
            src={post.thumbnailUrl}
            alt={post.description}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-pv-surface-2" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-7 h-7 text-pv-white fill-pv-white ml-1" />
          </div>
        </div>
      </div>

      {/* Description */}
      {post.description && (
        <p className="px-4 pt-3 text-pv-white font-body text-sm leading-relaxed">
          {post.description}
        </p>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="bg-pv-lime/10 text-pv-lime text-xs font-body px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          <button onClick={handleLike} className="flex items-center gap-1.5 group">
            <Heart
              className={cn(
                'w-5 h-5 transition-colors',
                liked ? 'text-pv-red fill-pv-red' : 'text-pv-muted group-hover:text-pv-white'
              )}
            />
            <span className={cn('text-sm font-body', liked ? 'text-pv-red' : 'text-pv-muted')}>
              {likesCount}
            </span>
          </button>

          <button className="flex items-center gap-1.5 group">
            <MessageCircle className="w-5 h-5 text-pv-muted group-hover:text-pv-white transition-colors" />
            <span className="text-sm font-body text-pv-muted">{post.commentsCount}</span>
          </button>

          <button className="group">
            <Share2 className="w-5 h-5 text-pv-muted group-hover:text-pv-white transition-colors" />
          </button>
        </div>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className="group"
        >
          <Bookmark
            className={cn(
              'w-5 h-5 transition-colors',
              bookmarked
                ? 'text-pv-lime fill-pv-lime'
                : 'text-pv-muted group-hover:text-pv-white'
            )}
          />
        </button>
      </div>
    </div>
  );
}
