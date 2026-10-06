import { LocationDto } from './location.dto';
import { PlacePhotoDto } from './place-photo.dto';

/**
 * Server-side shape of one row from `GET /api/events`. Mirrors
 * `Saturdaze.Application.Contracts.LocalEventDto`.
 */
export interface LocalEventDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Starts On.
   */
  readonly startsOn: string; // YYYY-MM-DD
  /**
   * Ends On.
   */
  readonly endsOn: string;
  /**
   * Venue name shown on the card (e.g. "Milton").
   */
  readonly venue: string;
  /**
   * Drive Minutes.
   */
  readonly driveMinutes: number;
  /**
   * Url.
   */
  readonly url: string;
  /**
   * Category.
   */
  readonly category: string;
  /**
   * Location (L2-099); null until the place is backfilled.
   */
  readonly location?: LocationDto | null;
  /**
   * Photo (L2-100); null when the place has none.
   */
  readonly photo?: PlacePhotoDto | null;
}
