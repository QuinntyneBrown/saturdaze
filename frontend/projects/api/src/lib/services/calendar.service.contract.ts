import { InjectionToken } from '@angular/core';

import { CalendarFeedLink, CalendarSettings } from '../models/calendar-settings';

/**
 * I Calendar Service — calendar sync (L1-040): the Calendar section on Family
 * and its subscription link.
 */
export interface ICalendarService {
  /**
   * Settings — `GET /api/calendar`.
   *
   * @returns {Promise<CalendarSettings>} The caller's connection and the family's link
   */
  settings(): Promise<CalendarSettings>;

  /**
   * Authorize Google — `POST /api/calendar/google/authorize`.
   *
   * @returns {Promise<string>} Google's consent URL to send the browser to
   */
  authorizeGoogle(): Promise<string>;

  /**
   * Connect Google — `POST /api/calendar/google/connect` with what Google returned.
   *
   * @param {string} code - The authorization code
   * @param {string} state - The state Saturdaze sent
   *
   * @returns {Promise<CalendarSettings>} The settings with the new connection
   */
  connectGoogle(code: string, state: string): Promise<CalendarSettings>;

  /**
   * Update Google — `PUT /api/calendar/google`: "Plan around my calendar".
   *
   * @param {boolean} readCommitments - Whether weekend events count as commitments
   *
   * @returns {Promise<CalendarSettings>} The saved settings
   */
  updateGoogle(readCommitments: boolean): Promise<CalendarSettings>;

  /**
   * Disconnect Google — `DELETE /api/calendar/google`.
   *
   * @returns {Promise<void>} Resolves once the grant is revoked and forgotten
   */
  disconnectGoogle(): Promise<void>;

  /**
   * Create Feed — `POST /api/calendar/feed`; replaces any earlier link.
   *
   * @returns {Promise<CalendarFeedLink>} The new link, shown once
   */
  createFeed(): Promise<CalendarFeedLink>;

  /**
   * Stop Feed — `DELETE /api/calendar/feed`.
   *
   * @returns {Promise<void>} Resolves once the link stops working
   */
  stopFeed(): Promise<void>;
}

export const CALENDAR_SERVICE = new InjectionToken<ICalendarService>('CALENDAR_SERVICE');
