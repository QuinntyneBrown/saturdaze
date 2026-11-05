import { LocationDto } from './location.dto';
import { MealSlot } from './meal-slot';
import { WeekendDay } from './weekend-day';

/** One step of a date: a drive, the meal or the activity (L2-219). */
export interface DateStepDto {
  readonly kind: 'Drive' | 'Meal' | 'Activity';
  readonly title: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly reason: string;
  readonly refId: string | null;
  readonly stop: LocationDto | null;
}

/** A couple's date, `GET|POST /api/weekends/{id}/dates` (L2-219). */
export interface CoupleDateDto {
  readonly id: string;
  readonly weekendId: string;
  readonly day: WeekendDay;
  readonly meal: MealSlot;
  readonly startTime: string;
  readonly endTime: string;
  readonly attendees: readonly { readonly id: string; readonly name: string }[];
  readonly restaurant: { readonly id: string; readonly name: string; readonly style: string };
  readonly activity: { readonly id: string; readonly name: string } | null;
  readonly steps: readonly DateStepDto[];
  readonly kidsNeedCare: readonly string[];
  readonly title: string;
}

/** The weekend's dates and whether another can be planned (L2-219 AC4). */
export interface CoupleDatesDto {
  readonly dates: readonly CoupleDateDto[];
  readonly adults: readonly { readonly id: string; readonly name: string; readonly age: number }[];
  readonly canPlan: boolean;
  readonly reason: string | null;
}

/** A past weekend's date (L2-225 AC7). */
export interface DateSummaryDto {
  readonly day: WeekendDay;
  readonly meal: MealSlot;
  readonly restaurant: string;
  readonly attendees: readonly string[];
}
