import { ActivityFilter } from './activity-filter';
import { ActivitySection } from './activity-section';

/**
 * Activity View.
 */
export interface ActivityView {
  /**
   * Filters.
   */
  readonly filters: readonly ActivityFilter[];
  /**
   * Sections.
   */
  readonly sections: readonly ActivitySection[];
}
