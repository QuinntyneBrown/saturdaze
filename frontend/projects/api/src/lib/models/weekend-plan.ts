import { Day } from './day';
import { WeekendStat } from './weekend-stat';

/** Whole-weekend aggregate (Sat + Sun + totals). */
export interface WeekendPlan {
  /**
   * Saturday.
   */
  readonly saturday: Day;
  /**
   * Sunday.
   */
  readonly sunday: Day;
  /**
   * Totals.
   */
  readonly totals: readonly WeekendStat[];
}
