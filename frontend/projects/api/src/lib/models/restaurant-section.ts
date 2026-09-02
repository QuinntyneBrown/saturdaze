import { MealSlot } from './meal-slot';
import { Restaurant } from './restaurant';
import { WeekendDay } from './weekend-day';

/**
 * Restaurant Section.
 */
export interface RestaurantSection {
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle.
   */
  readonly subtitle?: string;
  /**
   * Day — which day a lock from this section applies to.
   */
  readonly day: WeekendDay;
  /**
   * Slot — which meal a lock from this section applies to.
   */
  readonly slot: MealSlot;
  /**
   * Picks.
   */
  readonly picks: readonly Restaurant[];
}
