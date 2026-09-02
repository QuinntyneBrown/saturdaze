import { InjectionToken } from '@angular/core';

import { SharedWeekend } from '../models/shared-weekend';

/**
 * I Shared Weekend Service — resolves a read-only share link. Anonymous;
 * the token is the capability.
 */
export interface ISharedWeekendService {
  /**
   * Load.
   *
   * @param {string} token - The share token from the URL
   *
   * @returns {Promise<SharedWeekend>} Rejects when the link is invalid.
   */
  load(token: string): Promise<SharedWeekend>;
}

export const SHARED_WEEKEND_SERVICE = new InjectionToken<ISharedWeekendService>(
  'SHARED_WEEKEND_SERVICE',
);
