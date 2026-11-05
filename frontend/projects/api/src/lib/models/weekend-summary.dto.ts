import { CoverDto } from './cover.dto';
import { DateSummaryDto } from './couple-date.dto';

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
   * Cover — the same cover the Weekend screen shows, or `null` (L2-110).
   */
  readonly cover?: CoverDto | null;
  /** The weekend's couples dates (L2-225 AC7). */
  readonly dates?: readonly DateSummaryDto[];
}
