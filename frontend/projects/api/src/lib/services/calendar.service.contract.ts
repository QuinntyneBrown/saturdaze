import { InjectionToken } from '@angular/core';

import { CalendarFeedLink, CalendarSettings } from '../models/calendar-settings';

/**
 * I Calendar Service — calendar sync (L1-039): the Calendar section on Family
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
