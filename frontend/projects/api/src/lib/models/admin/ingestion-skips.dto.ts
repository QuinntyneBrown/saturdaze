/** `GET /api/admin/ingestion-runs/photo-skips` (L2-120 AC5). Mirrors `IngestionPhotoSkipsDto`. */
export interface IngestionPhotoSkipDto {
  readonly placeName: string;
  readonly url: string;
  readonly reason: string;
  /** Set when a place of the run's catalog has that name. */
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent' | null;
  readonly placeId: string | null;
}

export interface IngestionPhotoSkipsDto {
  readonly runId: string;
  readonly startedUtc: string;
  readonly type: 'Events' | 'Activities' | 'Restaurants';
  readonly status: 'Running' | 'Succeeded' | 'PartialSuccess' | 'Failed';
  readonly skips: readonly IngestionPhotoSkipDto[];
}
