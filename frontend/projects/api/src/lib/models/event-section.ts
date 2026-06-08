import { LocalEvent } from './local-event';

/**
 * Event Section.
 */
export interface EventSection {
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Events.
   */
  readonly events: readonly LocalEvent[];
}
