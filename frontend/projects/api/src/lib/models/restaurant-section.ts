import { Restaurant } from './restaurant';

export interface RestaurantSection {
  readonly title: string;
  readonly subtitle?: string;
  readonly picks: readonly Restaurant[];
}
