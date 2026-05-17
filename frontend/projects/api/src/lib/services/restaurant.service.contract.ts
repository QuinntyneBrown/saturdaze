import { InjectionToken, Signal } from '@angular/core';

import { RestaurantView } from '../models/restaurant-view';
import { Vote } from '../models/vote';

export interface IRestaurantService {
  list(): Signal<RestaurantView>;
  load(): Promise<void>;
  refresh(): Promise<void>;
  vote(restaurantId: string, voterName: string, vote: Vote): Promise<void>;
  lock(restaurantId: string): Promise<void>;
}

export const RESTAURANT_SERVICE = new InjectionToken<IRestaurantService>(
  'RESTAURANT_SERVICE',
);
