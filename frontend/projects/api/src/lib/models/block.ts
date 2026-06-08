import { DayChip } from './day-chip';

/**
 * One block in a day's timeline. The full feature set is used from Phase 2
 * onward; Phase 1 only needs the preview-friendly subset, so optional
 * fields stay optional.
 */
export interface Block {
  /**
   * Id.
   */
  readonly id?: string;
  /**
   * Day.
   */
  readonly day?: 'Saturday' | 'Sunday';
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
    | 'workout'
    | 'fixed'
    | 'downtime'
    | 'indoor';
  /**
   * Locked.
   */
  readonly locked?: boolean;
  /**
   * Drive.
   */
  readonly drive?: string;
  /**
   * Chips.
   */
  readonly chips?: readonly DayChip[];
}
