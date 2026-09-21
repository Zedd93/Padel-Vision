import { useEffect, useState } from "react";

/* ─── Minimalne typy IFrame API ────────────────────────────────
   Zamiast ciągnąć @types/youtube opisujemy tylko to, czego używamy. */

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export interface YouTubePlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setPlaybackRate(rate: number): void;
  getVideoLoadedFraction(): number;
  loadVideoById(videoId: string): void;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YouTubePlayerInstance }) => void;
    onStateChange?: (event: { data: number; target: YouTubePlayerInstance }) => void;
    onError?: (event: { data: number }) => void;
  };
}

export interface YouTubeApi {
  Player: new (
    element: HTMLElement | string,
    options: YouTubePlayerOptions
  ) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SCRIPT_SRC = "https://www.youtube.com/iframe_api";

/**
 * Skrypt IFrame API ładujemy raz na całą aplikację i trzymamy obietnicę,
 * żeby kilka odtwarzaczy naraz (np. Multiview) nie wstawiało go kilka razy.
 */
let apiPromise: Promise<YouTubeApi> | null = null;

export function loadYouTubeIframeApi(): Promise<YouTubeApi> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    // YouTube woła ten globalny callback dokładnie raz, po załadowaniu skryptu.
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("IFrame API załadowane, ale window.YT jest puste"));
      }
    };

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onerror = () => reject(new Error("Nie udało się załadować YouTube IFrame API"));
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

/** Zwraca API po załadowaniu albo błąd, jeśli skrypt nie wstał. */
export function useYouTubeIframeApi(): { api: YouTubeApi | null; error: Error | null } {
  const [api, setApi] = useState<YouTubeApi | null>(() => window.YT?.Player ? window.YT : null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (api) return;
    let active = true;

    loadYouTubeIframeApi()
      .then((loaded) => active && setApi(loaded))
      .catch((e: Error) => active && setError(e));

    return () => {
      active = false;
    };
  }, [api]);

  return { api, error };
}
