/**
 * `GET /api/admin/photo-health` (L2-112). Mirrors
 * `Saturdaze.Application.Admin.Photos.PhotoHealthDto`.
 */
export interface CatalogPhotoHealthDto {
  readonly catalog: 'activities' | 'restaurants' | 'upcomingEvents';
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly places: number;
  /** Places whose primary photo projects for families (HTTPS on an allowed origin). */
  readonly withPrimary: number;
  readonly noPhoto: number;
  readonly blockedUrl: number;
  readonly unreviewed: number;
  readonly missingAlt: number;
}

export interface PhotoHealthDto {
  readonly catalogs: readonly CatalogPhotoHealthDto[];
  /** Provider photos waiting in the review queue. */
  readonly pendingReviews: number;
}
