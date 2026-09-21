/** Znacznik wydarzenia na osi czasu transmisji. */
export interface StreamMarker {
  /** Sekundy od początku transmisji */
  time: number;
  type: "ace" | "break" | "match_point" | "golden_point" | "set_end";
  label: string;
  color: string;
}
