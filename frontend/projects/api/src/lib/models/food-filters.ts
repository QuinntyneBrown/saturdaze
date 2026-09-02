import { MealSlot } from './meal-slot';
import { WeekendDay } from './weekend-day';

/**
 * Food Filters — the state behind the three chip rows on Ideas › Food.
 */
export interface FoodFilters {
  /**
   * Day — Saturday or Sunday; always one.
   */
  readonly day: WeekendDay;
  /**
   * Slot — narrows to Lunch or Dinner; `null` shows both.
   */
  readonly slot: MealSlot | null;
  /**
   * Wife Approved — only approved places.
   */
  readonly wifeApproved: boolean;
  /**
   * Quick — under 15 minutes away.
   */
  readonly quick: boolean;
}
