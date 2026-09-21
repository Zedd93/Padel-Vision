import { Radio } from "lucide-react";
import { HlsPlayer } from "./HlsPlayer";
import { YouTubePlayer } from "./YouTubePlayer";
import type { StreamMarker } from "./types";

interface StreamPlayerProps {
  /** Identyfikator filmu na YouTube — ma pierwszeństwo, gdy jest ustawiony. */
  youtubeVideoId?: string | null;
  /** Ścieżka wycofywana wraz z migracją na YouTube (docs/YOUTUBE_MIGRATION_PLAN.md §9). */
  hlsUrl?: string | null;
  isLive: boolean;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  markers?: StreamMarker[];
  onClipRequest?: (currentTime: number) => void;
}

/**
 * Wybiera odtwarzacz odpowiedni dla danej transmisji.
 *
 * Dopóki trwa migracja, w bazie mogą istnieć jednocześnie transmisje
 * youtube'owe i stare z `hlsUrl`. YouTube wygrywa, gdy oba są ustawione.
 */
export function StreamPlayer({
  youtubeVideoId,
  hlsUrl,
  isLive,
  poster,
  autoPlay = true,
  muted = true,
  markers = [],
  onClipRequest,
}: StreamPlayerProps) {
  if (youtubeVideoId) {
    return (
      <YouTubePlayer
        videoId={youtubeVideoId}
        isLive={isLive}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        markers={markers}
        onClipRequest={onClipRequest}
      />
    );
  }

  if (hlsUrl) {
    return (
      <HlsPlayer
        hlsUrl={hlsUrl}
        isLive={isLive}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        markers={markers}
        onClipRequest={onClipRequest}
      />
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-black text-center">
      <Radio className="h-8 w-8 text-muted" />
      <p className="text-sm font-medium text-text">Transmisja jeszcze nie wystartowała</p>
      <p className="text-xs text-muted">Odtwarzacz pojawi się, gdy klub rozpocznie nadawanie</p>
    </div>
  );
}
