import { InjectionToken, Signal } from '@angular/core';

import { SavedView } from '../models/saved-view';

/**
 * I Saved Service.
 */
export interface ISavedService {
  /**
   * List.
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
}

export const SAVED_SERVICE = new InjectionToken<ISavedService>('SAVED_SERVICE');
