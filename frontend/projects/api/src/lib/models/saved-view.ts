import { AvoidItem } from './avoid-item';
import { SavedFilter } from './saved-filter';
import { SavedWeekend } from './saved-weekend';

/**
 * Saved View.
 */
export interface SavedView {
  /**
   * Heading.
   */
  readonly heading: string;
  /**
   * Lede.
   */
  readonly lede: string;
  /**
   * Filters.
   */
  readonly filters: readonly SavedFilter[];
  /**
   * Recent.
   */
  readonly recent: readonly SavedWeekend[];
  /**
   * Avoid.
   */
  readonly avoid: readonly AvoidItem[];
}
