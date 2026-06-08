import { Block } from './block';
import { DayHeaderChip } from './day-header-chip';
import { DayOption } from './day-option';
import { WeekendStat } from './weekend-stat';

/** Aggregate view powering the itinerary page. */
export interface ItineraryView {
  /**
   * Day.
   */
  readonly day: string;
  /**
   * Eyebrow.
   */
  readonly eyebrow: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle.
   */
  readonly subtitle: string;
  /**
   * Icon.
   */
  readonly icon: string;
  /**
   * Chips.
   */
  readonly chips: readonly DayHeaderChip[];
  /**
   * Day Options.
   */
  readonly dayOptions: readonly DayOption[];
  /**
   * Stats.
   */
  readonly stats: readonly WeekendStat[];
  /**
   * Preview Title.
   */
  readonly previewTitle: string;
  /**
   * Preview Subtitle.
   */
  readonly previewSubtitle: string;
  /**
   * Blocks.
   */
  readonly blocks: readonly Block[];
}
