import { Activity } from './activity';

/**
 * Activity Section.
 */
export interface ActivitySection {
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle.
   */
  readonly subtitle?: string;
  /**
   * Activities.
   */
  readonly activities: readonly Activity[];
}
