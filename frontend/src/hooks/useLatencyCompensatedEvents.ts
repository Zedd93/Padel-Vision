import { useCallback, useEffect, useRef, useState } from "react";

interface QueuedEvent<T> {
  event: T;
  receivedAt: number;
}

/** Jak często sprawdzamy, czy coś dojrzało do wydania. */
const TICK_INTERVAL = 150;

/**
 * Przytrzymuje zdarzenia czasu rzeczywistego, żeby trafiły do UI dopiero
 * wtedy, gdy widz zobaczy odpowiadający im fragment obrazu.
 *
 * Wynik meczu leci przez STOMP natychmiast, a transmisja z YouTube ma
 * 15–30 s opóźnienia. Bez tego bufora widz zobaczyłby punkt, zanim zobaczy
 * zagranie — overlay zdradzałby akcję.
 *
 * Termin wydania liczymy dynamicznie (`receivedAt + delayMs`), więc gdy
 * pomiar opóźnienia się uściśli, dotyczy to także zdarzeń już zakolejkowanych.
 */
export function useLatencyCompensatedEvents<T>(
  delayMs: number,
  onDue: (event: T) => void
) {
  const queueRef = useRef<QueuedEvent<T>[]>([]);
  const onDueRef = useRef(onDue);
  const delayRef = useRef(delayMs);
  const [pending, setPending] = useState(0);

  onDueRef.current = onDue;
  delayRef.current = delayMs;

  useEffect(() => {
    const id = setInterval(() => {
      if (queueRef.current.length === 0) return;

      const now = Date.now();
      const due: T[] = [];
      const rest: QueuedEvent<T>[] = [];

      for (const item of queueRef.current) {
        if (now - item.receivedAt >= delayRef.current) {
          due.push(item.event);
        } else {
          rest.push(item);
        }
      }

      if (due.length > 0) {
        queueRef.current = rest;
        setPending(rest.length);
        // kolejność wydania musi odpowiadać kolejności odebrania
        due.forEach((event) => onDueRef.current(event));
      }
    }, TICK_INTERVAL);

    return () => clearInterval(id);
  }, []);

  const push = useCallback((event: T) => {
    // Zerowe opóźnienie omija kolejkę, żeby nie dokładać jednego ticku
    if (delayRef.current <= 0) {
      onDueRef.current(event);
      return;
    }
    queueRef.current = [...queueRef.current, { event, receivedAt: Date.now() }];
    setPending(queueRef.current.length);
  }, []);

  /** Wydaje wszystko natychmiast — np. gdy widz przeskoczy do DVR. */
  const flush = useCallback(() => {
    const queued = queueRef.current;
    queueRef.current = [];
    setPending(0);
    queued.forEach((item) => onDueRef.current(item.event));
  }, []);

  const reset = useCallback(() => {
    queueRef.current = [];
    setPending(0);
  }, []);

  return { push, flush, reset, pending };
}
