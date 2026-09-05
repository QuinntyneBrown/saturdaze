import { ChipView } from './chip-view';
import { FilterChip } from './filter-chip';
import { PastWeekendCard } from './past-weekend-card';

/**
 * Past View — the Past page: subtitle, filters, the "Skipping next time"
 * strip and the cards for the active filter.
 */
export interface PastView {
  /**
   * Status — `empty` when the family has no history at all.
   */
  readonly status: 'loading' | 'empty' | 'ready';
  /**
   * Subtitle — "Twelve weekends so far. Repeat what worked, remix the rest."
   */
  readonly subtitle: string;
  /**
   * Filters — All · Favourites · This year · 5★.
   */
  readonly filters: readonly FilterChip[];
  /**
   * Weekends — newest first, narrowed by the active filter.
   */
  readonly weekends: readonly PastWeekendCard[];
  /**
   * Skipping — "The Rec Room · rated 2★ on 6 Apr" chips.
   */
  readonly skipping: readonly ChipView[];
  /**
   * Filter Empty — copy for an active filter with no matches, else `null`.
   */
  readonly filterEmpty: string | null;
}
