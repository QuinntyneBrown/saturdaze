import { FoodCard } from './food-card';
import { MealSlot } from './meal-slot';
import { WeekendDay } from './weekend-day';

/**
 * Food Section — the Lunch or Dinner group for the selected day.
 */
export interface FoodSection {
  /**
   * Title — "Lunch" / "Dinner".
   */
  readonly title: MealSlot;
  /**
   * Subtitle — "Near Terre Bleu · 12:00 to 1:30pm" or "Close to home".
   */
  readonly subtitle: string;
  /**
   * Day.
   */
  readonly day: WeekendDay;
  /**
   * Slot.
   */
  readonly slot: MealSlot;
  /**
   * Locked Id — the locked restaurant, `null` when the debate is open.
   */
  readonly lockedId: string | null;
  /**
   * Picks — ranked: locked, then approved, then closest.
   */
  readonly picks: readonly FoodCard[];
}
