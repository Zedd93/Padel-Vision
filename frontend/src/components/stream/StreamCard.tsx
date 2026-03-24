import { Link } from 'react-router-dom';
import { Eye, Clock } from 'lucide-react';
import type { Stream } from '@/api/streams';
import { formatViewerCount, formatDuration } from '@/utils/format';

interface StreamCardProps {
  stream: Stream;
  variant?: 'horizontal' | 'vertical';
}

export default function StreamCard({ stream, variant = 'vertical' }: StreamCardProps) {
  const isLive = stream.status === 'LIVE';

  if (variant === 'horizontal') {
    return (
      <Link
        to={`/stream/${stream.id}`}
        className="flex-shrink-0 w-72 group"
      >
        <div className="relative aspect-video rounded-xl overflow-hidden bg-pv-surface-2">
          {stream.thumbnailUrl ? (
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pv-surface-2 to-pv-obsidian" />
          )}
          {/* Live badge */}
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-pv-red px-2 py-0.5 rounded-md">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-display tracking-wider">LIVE</span>
            </div>
          )}
          {/* Viewer count */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <Eye className="w-3.5 h-3.5 text-pv-white" />
            <span className="text-pv-white text-xs font-mono">
              {formatViewerCount(stream.viewerCount)}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-pv-white font-body text-sm font-medium truncate group-hover:text-pv-lime transition-colors">
            {stream.title}
          </p>
          <p className="text-pv-muted text-xs font-body truncate">
            {stream.club?.name || 'Nieznany klub'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/stream/${stream.id}`} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-pv-surface-2">
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pv-surface-2 to-pv-obsidian" />
        )}
        {isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-pv-red px-2 py-0.5 rounded-md">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-display tracking-wider">LIVE</span>
          </div>
        )}
        {!isLive && stream.endedAt && stream.startedAt && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <Clock className="w-3.5 h-3.5 text-pv-white" />
            <span className="text-pv-white text-xs font-mono">
              {formatDuration(
                Math.round(
                  (new Date(stream.endedAt).getTime() - new Date(stream.startedAt).getTime()) / 1000
                )
              )}
            </span>
          </div>
        )}
        {isLive && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <Eye className="w-3.5 h-3.5 text-pv-white" />
            <span className="text-pv-white text-xs font-mono">
              {formatViewerCount(stream.viewerCount)}
            </span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-pv-white font-body text-sm font-medium truncate group-hover:text-pv-lime transition-colors">
          {stream.title}
        </p>
        <p className="text-pv-muted text-xs font-body truncate">
          {stream.club?.name || 'Nieznany klub'} {stream.club?.city && `· ${stream.club.city}`}
        </p>
      </div>
    </Link>
  );
}
