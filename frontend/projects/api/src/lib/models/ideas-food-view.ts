import { FilterChip } from './filter-chip';
import { FoodSection } from './food-section';

/**
 * Ideas Food View — the Food segment: three chip rows and the sections for
 * the selected day.
 */
export interface IdeasFoodView {
  /**
   * Subtitle — "Places to eat near what you are already doing."
   */
  readonly subtitle: string;
  /**
   * Day Chips — Saturday / Sunday (single select).
   */
  readonly dayChips: readonly FilterChip[];
  /**
   * Slot Chips — Lunch / Dinner (single select, toggles off).
   */
  readonly slotChips: readonly FilterChip[];
  /**
   * Extra Chips — Wife-approved / Under 15 min (toggles).
   */
  readonly extraChips: readonly FilterChip[];
  /**
   * Sections.
   */
  readonly sections: readonly FoodSection[];
}
