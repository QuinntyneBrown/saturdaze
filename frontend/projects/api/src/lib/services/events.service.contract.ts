import { InjectionToken, Signal } from '@angular/core';

import { EventsView } from '../models/events-view';

/**
 * I Events Service.
 */
export interface IEventsService {
  /**
   * List.
   *
   * @returns {Signal<EventsView>} The result of the operation
   */
  list(): Signal<EventsView>;
  /**
   * Load.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(weekendOfIso?: string): Promise<void>;
}

export const EVENTS_SERVICE = new InjectionToken<IEventsService>(
  'EVENTS_SERVICE',
);
