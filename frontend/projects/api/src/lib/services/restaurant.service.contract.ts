import { InjectionToken, Signal } from '@angular/core';

import { MealSlot } from '../models/meal-slot';
import { RestaurantView } from '../models/restaurant-view';
import { Vote } from '../models/vote';
import { WeekendDay } from '../models/weekend-day';

/**
 * I Restaurant Service.
 */
export interface IRestaurantService {
  /**
   * List — the restaurant view for the active filter.
   *
   * @returns {Signal<RestaurantView>} The result of the operation
   */
  list(): Signal<RestaurantView>;
  /**
   * Load — Saturday lunch + Sunday dinner picks for the upcoming weekend.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Refresh — reload the picks, keeping votes and locks.
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
   * Lock a restaurant for a specific day + meal.
   *
   * @param {string} restaurantId - The restaurant id
   * @param {WeekendDay} day - The day
   * @param {MealSlot} slot - The meal slot
   *
   * @returns {Promise<void>} The result of the operation
   */
  lock(restaurantId: string, day: WeekendDay, slot: MealSlot): Promise<void>;
  /**
   * Active Filter — the label of the selected chip.
   */
  activeFilter(): Signal<string>;
  /**
   * Set Filter.
   *
   * @param {string} label - The chip label
   */
  setFilter(label: string): void;
}

export const RESTAURANT_SERVICE = new InjectionToken<IRestaurantService>(
  'RESTAURANT_SERVICE',
);
