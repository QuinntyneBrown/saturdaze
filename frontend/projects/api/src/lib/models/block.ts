import { BlockKind } from './block-kind';
import { DayChip } from './day-chip';
import { WeekendDay } from './weekend-day';

/**
 * One block in a day's timeline, as the pages render it.
 */
export interface Block {
  /**
   * Id.
   */
  readonly id?: string;
  /**
   * Day.
   */
  readonly day?: WeekendDay;
  /**
   * Kind — drives which actions a block offers (lock, swap, mark done).
   */
  readonly kind?: BlockKind;
  /**
   * Ref Id — the activity / errand / restaurant the block points at.
   */
  readonly refId?: string | null;
  /**
   * Time.
   */
  readonly time: string;
  /**
   * Duration.
   */
  readonly duration?: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle.
   */
  readonly subtitle?: string;
  /**
   * Reason — the planner's one-line justification.
   */
  readonly reason?: string;
  /**
   * Icon.
   */
  readonly icon: string;
  /**
   * Tone.
   */
  readonly tone?:
    | 'default'
    | 'meal'
    | 'drive'
    | 'fixed'
    | 'downtime'
    | 'indoor';
  /**
   * Locked.
   */
  readonly locked?: boolean;
  /**
   * Done — errand blocks only.
   */
  readonly done?: boolean;
  /**
   * Drive.
   */
  readonly drive?: string;
  /**
   * Chips.
   */
  readonly chips?: readonly DayChip[];
}
