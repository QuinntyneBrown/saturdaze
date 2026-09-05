import { BlockRow } from './block-row';
import { WeatherDay } from './weather-day';
import { WeekendDay } from './weekend-day';

/**
 * Day View — one `sd-day` column: header meta, the lock state, what a
 * regenerate would keep, and the timeline rows.
 */
export interface DayView {
  /**
   * Day.
   */
  readonly day: WeekendDay;
  /**
   * Date Iso — `YYYY-MM-DD`.
   */
  readonly dateIso: string;
  /**
   * Date Label — "17 May".
   */
  readonly dateLabel: string;
  /**
   * Weather.
   */
  readonly weather: WeatherDay;
  /**
   * Meta — "17 May · 22° / 14° · Light breeze, good for outdoors".
   */
  readonly meta: string;
  /**
   * Locked — true when every lockable block on the day is locked.
   */
  readonly locked: boolean;
  /**
   * Keeping — "Swim 9:00" entries for the regenerate confirmation well.
   */
  readonly keeping: readonly string[];
  /**
   * Blocks.
   */
  readonly blocks: readonly BlockRow[];
}
