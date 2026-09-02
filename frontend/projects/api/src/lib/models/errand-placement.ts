import { WeekendDay } from './weekend-day';

/** Where the planner slotted the errand that was just added. */
export interface ErrandPlacement {
  /**
   * Description.
   */
  readonly description: string;
  /**
   * Day.
   */
  readonly day: WeekendDay;
  /**
   * Time — "9:15".
   */
  readonly time: string;
  /**
   * End Time — "10:00".
   */
  readonly endTime: string;
  /**
   * Block Id — the new errand block.
   */
  readonly blockId: string;
}
