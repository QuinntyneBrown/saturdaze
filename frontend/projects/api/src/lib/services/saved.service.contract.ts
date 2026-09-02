import { InjectionToken, Signal } from '@angular/core';

import { SavedView } from '../models/saved-view';

/**
 * I Saved Service.
 */
export interface ISavedService {
  /**
   * List — the saved view for the active filter.
   *
   * @returns {Signal<SavedView>} The result of the operation
   */
  list(): Signal<SavedView>;
  /**
   * Load.
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
  /**
   * Set Favourite. `PUT /api/weekends/{id}/favourite`.
   *
   * @returns {Promise<void>} The result of the operation
   */
  setFavourite(id: string, favourite: boolean): Promise<void>;
  /**
   * Rate. `PUT /api/weekends/{id}/rating` — 1..5, or `null` to clear.
   *
   * @returns {Promise<void>} The result of the operation
   */
  rate(id: string, rating: number | null): Promise<void>;
  /**
   * Rename. `PUT /api/weekends/{id}/title` — `null` clears the name.
   *
   * @returns {Promise<void>} The result of the operation
   */
  rename(id: string, title: string | null): Promise<void>;
}

export const SAVED_SERVICE = new InjectionToken<ISavedService>('SAVED_SERVICE');
