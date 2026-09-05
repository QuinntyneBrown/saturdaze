import { DayOfWeek } from './day-of-week';

/**
 * Commitment Row — one fixed commitment in "Locked in every weekend". One
 * row per backend commitment; a Saturday and a Sunday swim are two rows.
 */
export interface CommitmentRow {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Day Of Week.
   */
  readonly dayOfWeek: DayOfWeek;
  /**
   * Day Label — "Saturdays".
   */
  readonly dayLabel: string;
  /**
   * Start Time — "HH:mm".
   */
  readonly startTime: string;
  /**
   * End Time — "HH:mm".
   */
  readonly endTime: string;
  /**
   * Subtitle — "Saturdays · 9:00 to 10:00".
   */
  readonly subtitle: string;
  /**
   * Icon — an `sd-icon` name picked from the title.
   */
  readonly icon: string;
}
