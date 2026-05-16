import { InjectionToken, Signal } from '@angular/core';

import { FamilyProfile } from '../models/family-profile';

export interface IFamilyService {
  getProfile(): Signal<FamilyProfile>;
  load(): Promise<void>;
}

export const FAMILY_SERVICE = new InjectionToken<IFamilyService>(
  'FAMILY_SERVICE',
);
