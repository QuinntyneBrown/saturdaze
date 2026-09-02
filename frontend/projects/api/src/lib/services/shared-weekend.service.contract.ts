import { InjectionToken } from '@angular/core';

import { WeekendView } from '../models/weekend-view';

/**
 * I Shared Weekend Service — resolves a read-only share link into the same
 * view the Weekend page renders. Anonymous; the token is the capability.
 */
export interface ISharedWeekendService {
  /**
   * Load — `GET /api/weekends/shared/{token}`.
   *
   * @param {string} token - The share token from the URL
   *
   * @returns {Promise<WeekendView>} Always `ready`; rejects when the link is invalid.
   */
  load(token: string): Promise<WeekendView>;
}

export const SHARED_WEEKEND_SERVICE = new InjectionToken<ISharedWeekendService>(
  'SHARED_WEEKEND_SERVICE',
);
