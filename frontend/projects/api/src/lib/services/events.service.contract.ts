import { InjectionToken, Signal } from '@angular/core';

import { IdeasEventsView } from '../models/ideas-events-view';

/** The two time windows the Events segment offers. */
export type EventsWindow = 'This weekend' | 'Next weekend';

/**
 * I Events Service — the Events segment: local events plus the family's own
 * pending suggestions.
 */
export interface IEventsService {
  /**
   * List — the Events segment for the active window and category.
   *
   * @returns {Signal<IdeasEventsView>} The result of the operation
   */
  list(): Signal<IdeasEventsView>;
  /**
   * Load — events for the weekend plus the family's submissions. Defaults
   * to the upcoming Saturday; the parameter exists for tests.
   *
   * @param {string} weekendOfIso - The Saturday, `YYYY-MM-DD`
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(weekendOfIso?: string): Promise<void>;
  /**
   * Set Window.
   *
   * @param {EventsWindow} window - The window
   */
  setWindow(window: EventsWindow): void;
  /**
   * Set Category — a category label, or `null` for all.
   *
   * @param {string | null} label - The category
   */
  setCategory(label: string | null): void;
}

export const EVENTS_SERVICE = new InjectionToken<IEventsService>('EVENTS_SERVICE');
