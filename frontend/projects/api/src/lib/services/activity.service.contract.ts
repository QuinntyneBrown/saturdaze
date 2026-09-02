import { InjectionToken, Signal } from '@angular/core';

import { ActivityView } from '../models/activity-view';

/**
 * Contract for the activity service consumed by pages. Pages inject
 * `ACTIVITY_SERVICE` and depend only on this interface — never on the
 * concrete `ActivityService` class.
 */
export interface IActivityService {
  /**
   * List — the activity view for the active filter.
   *
   * @returns {Signal<ActivityView>} The result of the operation
   */
  list(): Signal<ActivityView>;
  /**
   * Load — catalogue, "try new" picks and the weekend forecast.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Active Filter — the label of the selected chip.
   */
  activeFilter(): Signal<string>;
  /**
   * Set Filter.
   *
   * @param {string} label - The chip label
   */
  setFilter(label: string): void;
}

export const ACTIVITY_SERVICE = new InjectionToken<IActivityService>(
  'ACTIVITY_SERVICE',
);
