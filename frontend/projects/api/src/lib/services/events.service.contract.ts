import { InjectionToken, Signal } from '@angular/core';

import { EventsView } from '../models/events-view';

/**
 * I Events Service.
 */
export interface IEventsService {
  /**
   * List — the events view for the active filter.
   *
   * @returns {Signal<EventsView>} The result of the operation
   */
  list(): Signal<EventsView>;
  /**
   * Load. Defaults to the upcoming Saturday; the parameter exists for tests.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(weekendOfIso?: string): Promise<void>;
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

export const EVENTS_SERVICE = new InjectionToken<IEventsService>(
  'EVENTS_SERVICE',
);
