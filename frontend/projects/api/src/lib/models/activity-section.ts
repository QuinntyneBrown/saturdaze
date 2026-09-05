import { ActivityCard } from './activity-card';

/**
 * Activity Section — one titled group of activity cards.
 */
export interface ActivitySection {
  /**
   * Title — "Right for this weekend's weather" etc.
   */
  readonly title: string;
  /**
   * Subtitle — `null` when there is nothing useful to say.
   */
  readonly subtitle: string | null;
  /**
   * Activities.
   */
  readonly activities: readonly ActivityCard[];
}
