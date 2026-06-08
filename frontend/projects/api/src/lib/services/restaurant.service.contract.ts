import { InjectionToken, Signal } from '@angular/core';

import { RestaurantView } from '../models/restaurant-view';
import { Vote } from '../models/vote';

/**
 * I Restaurant Service.
 */
export interface IRestaurantService {
  /**
   * List.
   *
   * @returns {Signal<RestaurantView>} The result of the operation
   */
  list(): Signal<RestaurantView>;
  /**
   * Load.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Refresh.
   *
   * @returns {Promise<void>} The result of the operation
   */
  refresh(): Promise<void>;
  /**
   * Vote.
   *
   * @param {string} restaurantId - The restaurant id
   * @param {string} voterName - The voter name
   * @param {Vote} vote - The vote
   *
   * @returns {Promise<void>} The result of the operation
   */
  vote(restaurantId: string, voterName: string, vote: Vote): Promise<void>;
  /**
   * Lock.
   *
   * @param {string} restaurantId - The restaurant id
   *
   * @returns {Promise<void>} The result of the operation
   */
  lock(restaurantId: string): Promise<void>;
}

export const RESTAURANT_SERVICE = new InjectionToken<IRestaurantService>(
  'RESTAURANT_SERVICE',
);
