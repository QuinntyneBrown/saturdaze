import { EventCard } from './event-card';

/** The section titles the Events segment renders, in order. */
export type EventSectionTitle =
  | 'Your suggestion'
  | 'Saturday'
  | 'Sunday'
  | 'Coming soon'
  | 'Next weekend';

/**
 * Event Section — one titled group of event cards.
 */
export interface EventSection {
  /**
   * Title.
   */
  readonly title: EventSectionTitle;
  /**
   * Subtitle — the date, or a hint; `null` when there is none.
   */
  readonly subtitle: string | null;
  /**
   * Events.
   */
  readonly events: readonly EventCard[];
}
