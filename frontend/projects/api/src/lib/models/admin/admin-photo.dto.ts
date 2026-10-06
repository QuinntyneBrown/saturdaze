/**
 * One photo as `GET /api/admin/places/{kind}/{id}/photos` returns it (L2-114).
 * Mirrors `Saturdaze.Application.Admin.Photos.AdminPhotoDto`.
 */
export interface AdminPhotoDto {
  readonly id: string;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly attribution: string;
  readonly license: string;
  readonly source: 'Curated' | 'Provider' | 'Submitter';
  readonly isPrimary: boolean;
  readonly reviewState: 'Unreviewed' | 'Reviewed';
  readonly adminLocked: boolean;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
  /** True when the URL would project as `null` for families (not HTTPS on an allowed origin). */
  readonly blocked: boolean;
}

/** A place with every photo and its cover impact. Mirrors `PlacePhotosDto`. */
export interface PlacePhotosDto {
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly id: string;
  readonly name: string;
  /** Weekends whose chosen cover follows this place. */
  readonly coverImpact: number;
  readonly photos: readonly AdminPhotoDto[];
}
