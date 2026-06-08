import type { ActivityTone } from './activity-tone';

export type { ActivityFilter } from './activity-filter';
export type { ActivitySection } from './activity-section';
export type { ActivityTone } from './activity-tone';
export type { ActivityView } from './activity-view';

/**
 * Activity.
 */
export interface Activity {
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
  readonly tone: ActivityTone;
  /**
   * Drive.
   */
  readonly drive?: string;
  /**
   * Ages.
   */
  readonly ages?: string;
  /**
   * Tag.
   */
  readonly tag?: string;
  /**
   * Why.
   */
  readonly why?: string;
}
