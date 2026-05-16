import { InjectionToken, Signal } from '@angular/core';

import { ActivityView } from '../models/activity-view';

/**
 * Contract for the activity service consumed by pages. Pages inject
 * `ACTIVITY_SERVICE` and depend only on this interface — never on the
 * concrete `ActivityService` class.
 */
export interface IActivityService {
  list(): Signal<ActivityView>;
  load(): Promise<void>;
}

export const ACTIVITY_SERVICE = new InjectionToken<IActivityService>(
  'ACTIVITY_SERVICE',
);
