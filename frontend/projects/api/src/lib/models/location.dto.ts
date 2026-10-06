/**
 * Where a catalog place is (L2-099). Mirrors
 * `Saturdaze.Application.Contracts.LocationDto`.
 */
export interface LocationDto {
  readonly latitude: number;
  readonly longitude: number;
  readonly address: string;
}
