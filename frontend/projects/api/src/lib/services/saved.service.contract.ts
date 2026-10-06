import { InjectionToken, Signal } from '@angular/core';

import { CoverChoice, CoverSelection } from '../models/cover-view';
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
  /**
   * Cover Choices — each of a past weekend's stop photos, for D28 (L2-098 AC2).
   *
   * @param {string} id - The weekend id
   *
   * @returns {Promise<readonly CoverChoice[]>} The stops with photos, Saturday first
   */
  coverChoices(id: string): Promise<readonly CoverChoice[]>;
  /**
   * Set Cover — `PUT /api/weekends/{id}/cover`; the card updates in place.
   *
   * @param {string} id - The weekend id
   * @param {CoverSelection} selection - The default rule or a stop
   *
   * @returns {Promise<void>} The result of the operation
   */
  setCover(id: string, selection: CoverSelection): Promise<void>;
  /**
   * Upload Cover — `POST /api/weekends/{id}/cover` with the family's own
   * photo (L2-097); the card updates in place. Rejects with the server's
   * `HttpErrorResponse`.
   *
   * @param {string} id - The weekend id
   * @param {Blob} file - A JPEG, PNG or WebP up to 10 MB
   *
   * @returns {Promise<void>} The result of the operation
   */
  uploadCover(id: string, file: Blob): Promise<void>;
}

export const SAVED_SERVICE = new InjectionToken<ISavedService>('SAVED_SERVICE');
