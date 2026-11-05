import { InjectionToken } from '@angular/core';

import { CoupleDateView, DatePlanningView } from '../models/couple-date-view';
import { MealSlot } from '../models/meal-slot';
import { WeekendDay } from '../models/weekend-day';

/**
 * I Date Service — a couple's dates on a weekend (L2-219 → L2-225). Every
 * call resolves with the date as the server planned it, and rejects with a
 * {@link DateRefusal} when the server says no (409 / 400) so the page can show why.
 */
export interface IDateService {
  /** `GET /api/weekends/{id}/dates`: who can go and whether a date can be planned. */
  planning(weekendId: string): Promise<DatePlanningView>;
  /** `GET /api/weekends/{id}/dates`: one date by id, or null. */
  get(weekendId: string, dateId: string): Promise<CoupleDateView | null>;
  /** `POST /api/weekends/{id}/dates` (idempotent, ADR-003). */
  plan(
    weekendId: string,
    day: WeekendDay,
    meal: MealSlot,
    attendeeIds: readonly string[],
  ): Promise<CoupleDateView>;
  /** `PUT /api/weekends/{id}/dates/{dateId}`. */
  move(weekendId: string, dateId: string, day: WeekendDay, meal: MealSlot): Promise<CoupleDateView>;
  regenerate(weekendId: string, dateId: string): Promise<CoupleDateView>;
  swapRestaurant(weekendId: string, dateId: string): Promise<CoupleDateView>;
  swapActivity(weekendId: string, dateId: string): Promise<CoupleDateView>;
  dropActivity(weekendId: string, dateId: string): Promise<CoupleDateView>;
  /** `DELETE /api/weekends/{id}/dates/{dateId}`. */
  cancel(weekendId: string, dateId: string): Promise<void>;
}

/** The server refused a date change; `message` is its own words (L2-225). */
export class DateRefusal extends Error {
  constructor(
    message: string,
    readonly code: string | null,
  ) {
    super(message);
  }
}

export const DATE_SERVICE = new InjectionToken<IDateService>('DATE_SERVICE');
