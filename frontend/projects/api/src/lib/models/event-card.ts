import { ChipView } from './chip-view';
import { DateTile } from './date-tile';

/**
 * Event Card — one event on Ideas › Events, or the family's own pending
 * suggestion.
 */
export interface EventCard {
  /**
   * Id — the event id, or the submission id for a pending suggestion.
   */
  readonly id: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Meta — "Milton · Sat 17 May".
   */
  readonly meta: string;
  /**
   * Tile.
   */
  readonly tile: DateTile;
  /**
   * Chips — category, drive time, or "Pending review".
   */
  readonly chips: readonly ChipView[];
  /**
   * Url — the "Details" link; `null` hides the footer.
   */
  readonly url: string | null;
  /**
   * Pending — a suggestion only this family can see.
   */
  readonly pending: boolean;
}
