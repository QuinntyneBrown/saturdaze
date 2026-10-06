import { InjectionToken, Signal } from '@angular/core';

import { AdminPlacesView } from '../models/admin/admin-places-view';

/**
 * Contract for Saturdaze Admin's catalog places (L2-113). Admin pages inject
 * `ADMIN_PLACES_SERVICE` and depend only on this interface.
 */
export interface IAdminPlacesService {
  /** The Places screen's rows. */
  list(): Signal<AdminPlacesView>;
  /** Load `GET /api/admin/places`. */
  load(): Promise<void>;
}

export const ADMIN_PLACES_SERVICE = new InjectionToken<IAdminPlacesService>('ADMIN_PLACES_SERVICE');
