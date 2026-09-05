import { InjectionToken, Signal } from '@angular/core';

import { IdeasActivitiesView } from '../models/ideas-activities-view';

/**
 * Contract for the activity service consumed by pages. Pages inject
 * `ACTIVITY_SERVICE` and depend only on this interface — never on the
 * concrete `ActivityService` class.
 */
export interface IActivityService {
  /**
   * List — the Activities segment for the active filter.
   *
   * @returns {Signal<IdeasActivitiesView>} The result of the operation
   */
  list(): Signal<IdeasActivitiesView>;
  /**
   * Load — catalogue, "try new" picks and the weekend forecast.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Set Filter — by chip label; "All" clears.
   *
   * @param {string} label - The chip label
   */
  setFilter(label: string): void;
}

export const ACTIVITY_SERVICE = new InjectionToken<IActivityService>('ACTIVITY_SERVICE');
