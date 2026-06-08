import { Restaurant } from './restaurant';

/**
 * Restaurant Section.
 */
export interface RestaurantSection {
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle.
   */
  readonly subtitle?: string;
  /**
   * Picks.
   */
  readonly picks: readonly Restaurant[];
}
