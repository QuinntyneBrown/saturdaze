import { InjectionToken, Signal } from '@angular/core';

import { RestaurantView } from '../models/restaurant-view';

export interface IRestaurantService {
  list(): Signal<RestaurantView>;
  load(): Promise<void>;
}

export const RESTAURANT_SERVICE = new InjectionToken<IRestaurantService>(
  'RESTAURANT_SERVICE',
);
