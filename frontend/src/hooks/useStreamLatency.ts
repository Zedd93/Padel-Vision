import { useEffect, useRef, useState } from "react";

/**
 * Opóźnienia orientacyjne dla ustawień YouTube — używane, dopóki nie da się
 * zmierzyć rzeczywistego (patrz docs/YOUTUBE_MIGRATION_PLAN.md §5.3).
 */
const FALLBACK_SECONDS: Record<string, number> = {
  ultraLow: 4,
  low: 20,
  normal: 45,
};

const DEFAULT_FALLBACK = 20;

/** Poza tym zakresem pomiar uznajemy za śmieciowy (pauza, DVR, zły zegar). */
const MIN_PLAUSIBLE = 0;
const MAX_PLAUSIBLE = 120;

/** Wygładzanie wykładnicze — pojedynczy odczyt potrafi skakać. */
const SMOOTHING = 0.2;

const MEASURE_INTERVAL = 2000;

interface UseStreamLatencyOptions {
  /** Kiedy transmisja ruszyła (ISO z API). */
  startedAt?: string | null;
  /** normal | low | ultraLow */
  latencyPreference?: string | null;
  /** Pozycja odtwarzacza w sekundach od początku transmisji. */
  getPlayerTime?: () => number | null;
  enabled?: boolean;
}

/**
 * Szacuje, o ile obraz jest w tyle za rzeczywistością.
 *
 * Gdy znamy `startedAt` i pozycję odtwarzacza, liczymy to wprost:
 * ile czasu minęło od startu transmisji minus ile widz już obejrzał.
 * Bez tych danych schodzimy na stałą zależną od ustawienia latencji.
 */
export function useStreamLatency({
  startedAt,
  latencyPreference,
  getPlayerTime,
  enabled = true,
}: UseStreamLatencyOptions) {
  // Ternary, nie `&&` — przy pustym stringu `&&` zwrocilby string zamiast liczby
  const fallbackSeconds =
    (latencyPreference ? FALLBACK_SECONDS[latencyPreference] : undefined) ?? DEFAULT_FALLBACK;

  const [latencySeconds, setLatencySeconds] = useState(fallbackSeconds);
  const [measured, setMeasured] = useState(false);
  const smoothedRef = useRef<number | null>(null);
  const getPlayerTimeRef = useRef(getPlayerTime);

  getPlayerTimeRef.current = getPlayerTime;

  // Zmiana ustawienia latencji resetuje szacunek do nowej wartości bazowej
  useEffect(() => {
    smoothedRef.current = null;
    setMeasured(false);
    setLatencySeconds(fallbackSeconds);
  }, [fallbackSeconds, startedAt]);

  useEffect(() => {
    if (!enabled || !startedAt) return;

    const startedAtMs = new Date(startedAt).getTime();
    if (Number.isNaN(startedAtMs)) return;

    const id = setInterval(() => {
      const playerTime = getPlayerTimeRef.current?.();
      if (playerTime === null || playerTime === undefined || playerTime <= 0) return;

      const wallElapsed = (Date.now() - startedAtMs) / 1000;
      const sample = wallElapsed - playerTime;

      if (sample < MIN_PLAUSIBLE || sample > MAX_PLAUSIBLE) return;

      smoothedRef.current =
        smoothedRef.current === null
          ? sample
          : smoothedRef.current * (1 - SMOOTHING) + sample * SMOOTHING;

      setLatencySeconds(smoothedRef.current);
      setMeasured(true);
    }, MEASURE_INTERVAL);

    return () => clearInterval(id);
  }, [enabled, startedAt]);

  return {
    latencySeconds,
    latencyMs: Math.round(latencySeconds * 1000),
    /** false = szacunek z ustawienia, true = zmierzone na żywo */
    measured,
  };
}
