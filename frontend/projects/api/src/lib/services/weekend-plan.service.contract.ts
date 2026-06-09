import { InjectionToken, Signal } from '@angular/core';

import { ItineraryView } from '../models/itinerary-view';
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
   * @param {'Saturday' | 'Sunday'} day - The day
   *
   * @returns {Promise<void>} The result of the operation
   */
  regenerateDay(day: 'Saturday' | 'Sunday', id?: string): Promise<void>;
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
   * Lock Day.
   *
   * @param {'Saturday' | 'Sunday'} day - The day
   * @param {boolean} locked - The locked
   *
   * @returns {Promise<void>} The result of the operation
   */
  lockDay(day: 'Saturday' | 'Sunday', locked: boolean, id?: string): Promise<void>;
  /**
   * Add Errand.
   *
   * @param {string} description - The description
   * @param {number} estimatedMinutes - The estimated minutes
   *
   * @returns {Promise<void>} The result of the operation
   */
  addErrand(
    description: string,
    estimatedMinutes: number,
    id?: string,
  ): Promise<void>;
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
   * @param {'Saturday' | 'Sunday'} day - The day
   *
   * @returns {void} No return value
   */
  setActiveDay(day: 'Saturday' | 'Sunday'): void;
}

export const WEEKEND_PLAN_SERVICE = new InjectionToken<IWeekendPlanService>(
  'WEEKEND_PLAN_SERVICE',
);
