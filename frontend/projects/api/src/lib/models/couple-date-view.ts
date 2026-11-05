import { MealSlot } from './meal-slot';
import { WeekendDay } from './weekend-day';

/** One row of a date's plan, ready for `sd-block` (L2-225). */
export interface DateStepView {
  readonly kind: 'Drive' | 'Meal' | 'Activity';
  readonly title: string;
  readonly time: string;
  readonly duration: string;
  readonly icon: string;
  readonly reason: string;
}

/** A couple's date as its screen shows it (L2-225). */
export interface CoupleDateView {
  readonly id: string;
  readonly day: WeekendDay;
  readonly meal: MealSlot;
  /** "Dinner date". */
  readonly headline: string;
  /** "Sunday · 5:25–8:05pm · Ada and Ben". */
  readonly subtitle: string;
  readonly restaurantName: string;
  readonly hasActivity: boolean;
  readonly activityName: string | null;
  readonly steps: readonly DateStepView[];
  /** "Kids need care 5:25–8:05pm." or null when nobody stays home. */
  readonly careTitle: string | null;
  /** "Cy and Di stay on the family plan, which pauses for the date. Saturdaze does not book childcare." */
  readonly careBody: string | null;
  readonly attendeeIds: readonly string[];
}

/** The adults who can go and whether a date can be planned (D38/D38b). */
export interface DatePlanningView {
  readonly adults: readonly { readonly id: string; readonly name: string }[];
  readonly canPlan: boolean;
  readonly reason: string | null;
}
