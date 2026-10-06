import { LocationDto } from './location.dto';

/**
 * Server-side shape of one row from `GET /api/activities`. Mirrors
 * `Saturdaze.Application.Contracts.ActivityDto`.
 */
export interface ActivityDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Category.
   */
  readonly category: string;
  /**
   * Indoor.
   */
  readonly indoor: boolean;
  /**
   * Min Age.
   */
  readonly minAge: number;
  /**
   * Max Age.
   */
  readonly maxAge: number;
  /**
   * Drive Minutes.
   */
  readonly driveMinutes: number;
  /**
   * Weather Tags.
   */
  readonly weatherTags: readonly string[];
  /**
   * Typical Duration Minutes.
   */
  readonly typicalDurationMinutes: number;
  /**
   * Description.
   */
  readonly description: string;
  /**
   * Map Url.
   */
  readonly mapUrl: string;
  /**
   * Location (L2-087); null until the place is backfilled.
   */
  readonly location?: LocationDto | null;
}
