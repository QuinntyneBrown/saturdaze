import { InjectionToken, Signal } from '@angular/core';

import { FoodFilters } from '../models/food-filters';
import { IdeasFoodView } from '../models/ideas-food-view';
import { MealSlot } from '../models/meal-slot';
import { Vote } from '../models/vote';
import { WeekendDay } from '../models/weekend-day';

/**
 * I Restaurant Service — the Food segment: both days × both meals, the
 * family vote and the lock.
 */
export interface IRestaurantService {
  /**
   * List — the Food segment for the current filters.
   *
   * @returns {Signal<IdeasFoodView>} The result of the operation
   */
  list(): Signal<IdeasFoodView>;
  /**
   * Load — Saturday and Sunday, lunch and dinner, for the upcoming weekend.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Set Filters — merge a partial change into the current filters.
   *
   * @param {Partial<FoodFilters>} patch - The fields to change
   */
  setFilters(patch: Partial<FoodFilters>): void;
  /**
   * Vote — `POST /api/restaurants/{id}/vote`.
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
}

export const RESTAURANT_SERVICE = new InjectionToken<IRestaurantService>('RESTAURANT_SERVICE');
