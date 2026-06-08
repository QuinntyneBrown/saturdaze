import { DayChip } from './day-chip';

/**
 * Day Summary.
 */
export interface DaySummary {
  /**
   * Day.
   */
  readonly day: string;
  /**
   * Date.
   */
  readonly date: string;
  /**
   * Weather.
   */
  readonly weather: string;
  /**
   * Icon.
   */
  readonly icon: string;
  /**
   * Highlight.
   */
  readonly highlight: string;
  /**
   * Chips.
   */
  readonly chips: readonly DayChip[];
}
