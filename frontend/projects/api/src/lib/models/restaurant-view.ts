import { RestaurantFilter } from './restaurant-filter';
import { RestaurantSection } from './restaurant-section';

export interface RestaurantView {
  readonly title: string;
  readonly lede: string;
  readonly filters: readonly RestaurantFilter[];
  readonly topPickSection: RestaurantSection;
  readonly otherPicks: RestaurantSection;
  readonly sundayDinner: RestaurantSection;
}
