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
   * Time — "H:mm".
   */
  readonly time: string;
}
