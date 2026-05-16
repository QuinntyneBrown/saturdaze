import { Day } from './day';
import { WeekendStat } from './weekend-stat';

/** Whole-weekend aggregate (Sat + Sun + totals). */
export interface WeekendPlan {
  readonly saturday: Day;
  readonly sunday: Day;
  readonly totals: readonly WeekendStat[];
}
