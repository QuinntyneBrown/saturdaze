import { InjectionToken, Signal } from '@angular/core';

import { ErrandPlacement } from '../models/errand-placement';
import { ItineraryView } from '../models/itinerary-view';
import { WeekendDay } from '../models/weekend-day';
import { WeekendOverview } from '../models/weekend-overview';

/**
 * Calendar Links.
 */
export interface CalendarLinks {
  /**
   * Ics Url.
   */
  readonly icsUrl: string;
  /**
   * Webcal Url.
   */
  readonly webcalUrl: string;
  /**
   * Google Calendar Url.
   */
  readonly googleCalendarUrl: string;
}

/**
 * I Weekend Plan Service.
 */
export interface IWeekendPlanService {
  /**
   * Get Overview.
   *
   * @returns {Signal<WeekendOverview>} The result of the operation
   */
  getOverview(): Signal<WeekendOverview>;
  /**
   * Get Itinerary.
   *
   * @returns {Signal<ItineraryView>} The result of the operation
   */
  getItinerary(): Signal<ItineraryView>;
  /**
   * Last Errand Placement — where the most recently added errand landed.
   *
   * @returns {Signal<ErrandPlacement | null>} The result of the operation
   */
  lastErrandPlacement(): Signal<ErrandPlacement | null>;

  /**
   * Load Current.
   *
   * @returns {Promise<void>} The result of the operation
   */
  loadCurrent(): Promise<void>;
  /**
   * Plan.
   *
   * @param {string} weekendOfIso - The weekend of iso
   *
   * @returns {Promise<void>} The result of the operation
   */
  plan(weekendOfIso: string): Promise<void>;
  /**
   * Regenerate.
   *
   * @returns {Promise<void>} The result of the operation
   */
  regenerate(id?: string): Promise<void>;
  /**
   * Regenerate Day.
   *
   * @param {WeekendDay} day - The day
   *
   * @returns {Promise<void>} The result of the operation
   */
  regenerateDay(day: WeekendDay, id?: string): Promise<void>;
  /**
   * Create Share Link.
   *
   * @returns {Promise<string>} The result of the operation
   */
  createShareLink(id?: string): Promise<string>;
  /**
   * Calendar Links.
   *
   * @returns {CalendarLinks} The result of the operation
   */
  calendarLinks(id?: string): CalendarLinks;

  /**
   * Lock Block.
   *
   * @param {string} blockId - The block id
   * @param {boolean} locked - The locked
   *
   * @returns {Promise<void>} The result of the operation
   */
  lockBlock(blockId: string, locked: boolean): Promise<void>;
  /**
   * Swap Block — `POST /api/blocks/{id}/swap`. Replaces an activity block
   * with the next-best candidate; a no-op (with a reason) when none is left.
   *
   * @param {string} blockId - The block id
   * @param {readonly string[]} rejectedActivityIds - Activities to exclude
   *
   * @returns {Promise<void>} The result of the operation
   */
  swapBlock(blockId: string, rejectedActivityIds?: readonly string[]): Promise<void>;
  /**
   * Lock Day.
   *
   * @param {WeekendDay} day - The day
   * @param {boolean} locked - The locked
   *
   * @returns {Promise<void>} The result of the operation
   */
  lockDay(day: WeekendDay, locked: boolean, id?: string): Promise<void>;
  /**
   * Add Errand — the planner places it immediately, preferring `preferredDay`.
   *
   * @param {string} description - The description
   * @param {number} estimatedMinutes - The estimated minutes
   * @param {WeekendDay} preferredDay - The preferred day (optional)
   *
   * @returns {Promise<void>} The result of the operation
   */
  addErrand(
    description: string,
    estimatedMinutes: number,
    preferredDay?: WeekendDay | null,
    id?: string,
  ): Promise<void>;
  /**
   * Set Errand Done — `PUT /api/errands/{id}/done`.
   *
   * @param {string} errandId - The errand id
   * @param {boolean} done - The done flag
   *
   * @returns {Promise<void>} The result of the operation
   */
  setErrandDone(errandId: string, done: boolean): Promise<void>;
  /**
   * Remix Saved.
   *
   * @param {string} id - The id
   *
   * @returns {Promise<void>} The result of the operation
   */
  remixSaved(id: string): Promise<void>;
  /**
   * Repeat Saved.
   *
   * @param {string} id - The id
   *
   * @returns {Promise<void>} The result of the operation
   */
  repeatSaved(id: string): Promise<void>;

  /**
   * Set Active Day.
   *
   * @param {WeekendDay} day - The day
   *
   * @returns {void} No return value
   */
  setActiveDay(day: WeekendDay): void;
}

export const WEEKEND_PLAN_SERVICE = new InjectionToken<IWeekendPlanService>(
  'WEEKEND_PLAN_SERVICE',
);
