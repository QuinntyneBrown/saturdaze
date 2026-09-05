import { ActivitySection } from './activity-section';
import { FilterChip } from './filter-chip';

/**
 * Ideas Activities View — the Activities segment: subtitle, filter strip and
 * the three sections for the active filter.
 */
export interface IdeasActivitiesView {
  /**
   * Subtitle — "Picked for Eli and Mae, under 45 minutes from Port Credit."
   */
  readonly subtitle: string;
  /**
   * Filters.
   */
  readonly filters: readonly FilterChip[];
  /**
   * Sections — empty sections are dropped while a filter is active.
   */
  readonly sections: readonly ActivitySection[];
}
