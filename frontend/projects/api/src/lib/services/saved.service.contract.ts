import { InjectionToken, Signal } from '@angular/core';

import { PastView } from '../models/past-view';

/**
 * I Saved Service — the Past page. The backend vocabulary is "saved"
 * (remix / repeat), so the token keeps its name.
 */
export interface ISavedService {
  /**
   * List — the Past page for the active filter.
   *
   * @returns {Signal<PastView>} The result of the operation
   */
  list(): Signal<PastView>;
  /**
   * Load — `GET /api/weekends/history?take=50`.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Set Filter — by chip label: All · Favourites · This year · 5★.
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
