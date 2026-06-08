import { RestaurantFilter } from './restaurant-filter';
import { RestaurantSection } from './restaurant-section';

/**
 * Restaurant View.
 */
export interface RestaurantView {
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Lede.
   */
  readonly lede: string;
  /**
   * Filters.
   */
  readonly filters: readonly RestaurantFilter[];
  /**
   * Top Pick Section.
   */
  readonly topPickSection: RestaurantSection;
  /**
   * Other Picks.
   */
  readonly otherPicks: RestaurantSection;
  /**
   * Sunday Dinner.
   */
  readonly sundayDinner: RestaurantSection;
}
