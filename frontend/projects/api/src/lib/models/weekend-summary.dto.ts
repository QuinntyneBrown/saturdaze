import { CoverDto } from './cover.dto';

/**
 * Server-side shape of one row from `GET /api/weekends/history`. Mirrors
 * `Saturdaze.Application.Contracts.WeekendSummaryDto`.
 */
export interface WeekendSummaryDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Weekend Of.
   */
  readonly weekendOf: string; // YYYY-MM-DD
  /**
   * Is Favourite.
   */
  readonly isFavourite: boolean;
  /**
   * Regenerate Count.
   */
  readonly regenerateCount: number;
  /**
   * Block Count.
   */
  readonly blockCount: number;
  /**
   * Activity Highlights.
   */
  readonly activityHighlights: readonly string[];
  /**
   * Title.
   */
  readonly title: string | null;
  /**
   * Rating.
   */
  readonly rating: number | null;
  /**
   * Cover — the same cover the Weekend screen shows, or `null` (L2-098).
   */
  readonly cover?: CoverDto | null;
}
