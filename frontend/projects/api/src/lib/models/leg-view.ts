/**
 * Leg View — the travel row (`sd-leg`) before a timeline block (L2-102).
 */
export interface LegView {
  readonly minutes: number;
  readonly km: number;
  /** "45 min · 52 km", or "5 min · 2 km home" when the leg ends at home. */
  readonly label: string;
  /** "Travel: 45 minutes, 52 kilometres to Lavender fields". */
  readonly ariaLabel: string;
  readonly directionsUrl: string | null;
}
