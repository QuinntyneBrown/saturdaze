import { EventSection } from './event-section';
import { FilterChip } from './filter-chip';

/**
 * Ideas Events View — the Events segment: window and category chips plus
 * the sections for the active window.
 */
export interface IdeasEventsView {
  /**
   * Subtitle — "What is on within 45 minutes of home."
   */
  readonly subtitle: string;
  /**
   * Window Chips — This weekend / Next weekend.
   */
  readonly windowChips: readonly FilterChip[];
  /**
   * Category Chips — one per category present, none active for "all".
   */
  readonly categoryChips: readonly FilterChip[];
  /**
   * Sections — empty sections are dropped.
   */
  readonly sections: readonly EventSection[];
}
