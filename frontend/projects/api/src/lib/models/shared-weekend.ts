import { BlockKind } from './block-kind';
import { WeekendDay } from './weekend-day';

/**
 * Shared Weekend Block — the read-only subset of an itinerary block a
 * share link exposes.
 */
export interface SharedWeekendBlock {
  /**
   * Day.
   */
  readonly day: WeekendDay;
  /**
   * Kind.
   */
  readonly kind: BlockKind;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Is Locked.
   */
  readonly isLocked: boolean;
  /**
   * Start Time — "HH:mm:ss".
   */
  readonly startTime: string;
}

/**
 * Shared Weekend — what `GET /api/weekends/shared/{token}` resolves to.
 */
export interface SharedWeekend {
  /**
   * Weekend Of — the Saturday, `YYYY-MM-DD`.
   */
  readonly weekendOf: string;
  /**
   * Blocks.
   */
  readonly blocks: readonly SharedWeekendBlock[];
}
