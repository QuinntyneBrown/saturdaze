import { InjectionToken, Signal } from '@angular/core';

import { CalendarExport } from '../models/calendar-export';
import { ErrandPlacement } from '../models/errand-placement';
import { WeekendDay } from '../models/weekend-day';
import { WeekendView } from '../models/weekend-view';

/**
 * I Weekend Plan Service — the current weekend and every mutation on it.
 * Reads are one reactive view; mutations resolve once the server's new
 * weekend has been applied, and reject on failure so the page can say so.
 */
export interface IWeekendPlanService {
  /**
   * Get Weekend — the whole Weekend screen as one signal.
   *
   * @returns {Signal<WeekendView>} The result of the operation
   */
  getWeekend(): Signal<WeekendView>;

  /**
   * Load Current — `GET /api/weekends/current`. A 404 resolves with the
   * view in its `empty` state; any other failure rejects.
   *
   * @returns {Promise<void>} The result of the operation
   */
  loadCurrent(): Promise<void>;
  /**
   * Plan — `POST /api/weekends/plan`. Idempotent server-side.
   *
   * @param {string} weekendOfIso - The Saturday, `YYYY-MM-DD`
   *
   * @returns {Promise<void>} The result of the operation
   */
  plan(weekendOfIso: string): Promise<void>;
  /**
   * Regenerate — the whole weekend; locked blocks and commitments stay.
   *
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<void>} The result of the operation
   */
  regenerate(id?: string): Promise<void>;
  /**
   * Regenerate Day — one day; the other is untouched.
   *
   * @param {WeekendDay} day - The day
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<void>} The result of the operation
   */
  regenerateDay(day: WeekendDay, id?: string): Promise<void>;
  /**
   * Create Share Link — `POST /api/weekends/{id}/share`.
   *
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<string>} The read-only share URL
   */
  createShareLink(id?: string): Promise<string>;
  /**
   * Calendar Export — the ICS link for the "Add to calendar" dialog.
   *
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {CalendarExport} The result of the operation
   */
  calendarExport(id?: string): CalendarExport;

  /**
   * Lock Block — `PUT /api/blocks/{id}/lock`.
   *
   * @param {string} blockId - The block id
   * @param {boolean} locked - The locked
   *
   * @returns {Promise<void>} The result of the operation
   */
  lockBlock(blockId: string, locked: boolean): Promise<void>;
  /**
   * Swap Block — `POST /api/blocks/{id}/swap`. The server picks the
   * replacement; only unlocked activity blocks can be swapped.
   *
   * @param {string} blockId - The block id
   * @param {readonly string[]} rejectedActivityIds - Activities to exclude
   *
   * @returns {Promise<void>} The result of the operation
   */
  swapBlock(blockId: string, rejectedActivityIds?: readonly string[]): Promise<void>;
  /**
   * Lock Day — `PUT /api/weekends/{id}/days/{day}/lock`.
   *
   * @param {WeekendDay} day - The day
   * @param {boolean} locked - The locked
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<void>} The result of the operation
   */
  lockDay(day: WeekendDay, locked: boolean, id?: string): Promise<void>;
  /**
   * Add Errand — the planner places it immediately, preferring
   * `preferredDay` (`null` for either day).
   *
   * @param {string} description - The description
   * @param {number} estimatedMinutes - The estimated minutes
   * @param {WeekendDay | null} preferredDay - The preferred day
   *
   * @returns {Promise<ErrandPlacement | null>} Where it landed, or `null`
   *   when the planner could not fit it
   */
  addErrand(
    description: string,
    estimatedMinutes: number,
    preferredDay: WeekendDay | null,
  ): Promise<ErrandPlacement | null>;
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
   * Remix Saved — `POST /api/weekends/{id}/remix`; the result becomes the
   * current weekend.
   *
   * @param {string} id - The saved weekend id
   *
   * @returns {Promise<void>} The result of the operation
   */
  remixSaved(id: string): Promise<void>;
  /**
   * Repeat Saved — `POST /api/weekends/{id}/repeat`; the result becomes
   * the current weekend.
   *
   * @param {string} id - The saved weekend id
   *
   * @returns {Promise<void>} The result of the operation
   */
  repeatSaved(id: string): Promise<void>;
}

export const WEEKEND_PLAN_SERVICE = new InjectionToken<IWeekendPlanService>('WEEKEND_PLAN_SERVICE');
