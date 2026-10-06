/**
 * The drive into a block from the previous place (L2-090). Mirrors
 * `Saturdaze.Application.Contracts.TravelLegDto`.
 */
export interface TravelLegDto {
  readonly minutes: number;
  readonly distanceKm: number;
  /** Directions for legs over 10 minutes; null otherwise. */
  readonly directionsUrl: string | null;
}
