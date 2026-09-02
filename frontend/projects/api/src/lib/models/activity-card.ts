import { ChipView } from './chip-view';

/** The disc tone on an activity card. */
export type ActivityTone = 'outdoor' | 'indoor';

/**
 * Activity Card — one idea on the Ideas › Activities segment.
 */
export interface ActivityCard {
  /**
   * Id — the activity id.
   */
  readonly id: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Meta — the category line under the title.
   */
  readonly meta: string;
  /**
   * Why — the planner's pitch for this pick.
   */
  readonly why: string;
  /**
   * Icon — an `sd-icon` name for the disc.
   */
  readonly icon: string;
  /**
   * Tone.
   */
  readonly tone: ActivityTone;
  /**
   * Chips — drive time, ages, "First time".
   */
  readonly chips: readonly ChipView[];
  /**
   * Map Url — the card's "Map" link; `null` when the catalogue has none.
   */
  readonly mapUrl: string | null;
}
