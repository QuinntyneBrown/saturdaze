/**
 * Map Pin — one numbered stop on the day map (L2-091), linked to its block.
 */
export interface MapPin {
  readonly n: number;
  readonly blockId: string;
  readonly title: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** A point on the map without a number (home). */
export interface MapPoint {
  readonly latitude: number;
  readonly longitude: number;
}
