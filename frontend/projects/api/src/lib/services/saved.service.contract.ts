import { InjectionToken, Signal } from '@angular/core';

import { SavedView } from '../models/saved-view';

export interface ISavedService {
  list(): Signal<SavedView>;
  load(): Promise<void>;
}

export const SAVED_SERVICE = new InjectionToken<ISavedService>('SAVED_SERVICE');
