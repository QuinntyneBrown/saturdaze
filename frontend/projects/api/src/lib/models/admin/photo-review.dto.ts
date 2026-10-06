import { PlacePhotoDto } from '../place-photo.dto';
import { AdminPhotoDto } from './admin-photo.dto';

/**
 * One item of `GET /api/admin/photo-reviews` (L2-120): an unreviewed provider
 * photo, its place and the primary it would replace. Mirrors
 * `Saturdaze.Application.Admin.Photos.PhotoReviewItemDto`.
 */
export interface PhotoReviewItemDto {
  readonly photo: AdminPhotoDto;
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly placeId: string;
  readonly placeName: string;
  /** The place's current primary as families see it, or null when there is none. */
  readonly replaces: PlacePhotoDto | null;
}

/** The decision `POST /api/admin/photos/{photoId}/review` takes. */
export type ReviewDecision = 'keep' | 'primary' | 'reject';
