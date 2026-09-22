/**
 * Wynik meczu rozgłaszany widzom na /topic/stream.{id}.score.
 * Wysyła go Studio (PUT /api/club/stream/{id}/score), odbiera strona
 * transmisji — ten typ jest kontraktem między nimi.
 */
export interface LiveScore {
  team1: string;
  team2: string;
  /** Gemy w bieżącym secie */
  score1: number;
  score2: number;
  currentSet: number;
  /** Zakończone sety */
  sets: { team1: number; team2: number }[];
  /** Punkty w bieżącym gemie: "0" | "15" | "30" | "40" | "ADV" albo punkty tie-breaka */
  gameScore: { team1: string; team2: string };
  /** Czas od startu transmisji, np. "01:24:07" */
  elapsedTime: string;
}

/** Znacznik wydarzenia na osi czasu transmisji. */
export interface StreamMarker {
  /** Sekundy od początku transmisji */
  time: number;
  type: "ace" | "break" | "match_point" | "golden_point" | "set_end";
  label: string;
  color: string;
}
