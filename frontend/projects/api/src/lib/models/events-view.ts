import { EventFilter } from './event-filter';
import { EventSection } from './event-section';

/**
 * Events View.
 */
export interface EventsView {
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
  readonly filters: readonly EventFilter[];
  /**
   * Sections.
   */
  readonly sections: readonly EventSection[];
}
