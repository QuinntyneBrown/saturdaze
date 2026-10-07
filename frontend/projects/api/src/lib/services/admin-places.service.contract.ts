import { InjectionToken, Signal } from '@angular/core';

import { AdminPlacesQuery } from '../models/admin/admin-places-query';
import { AdminPlacesView } from '../models/admin/admin-places-view';
import { HealthView } from '../models/admin/health-view';
import { PlacePhotosView } from '../models/admin/place-photos-view';

/**
 * Contract for Saturdaze Admin's catalog places (L2-113). Admin pages inject
 * `ADMIN_PLACES_SERVICE` and depend only on this interface.
 */
export interface IAdminPlacesService {
  /** `GET /api/admin/photo-health` (L2-112): coverage per catalog with links to the filtered list. */
  health(): Promise<HealthView>;
  /** The Places screen's rows. */
  list(): Signal<AdminPlacesView>;
  /** Load `GET /api/admin/places` for the query. */
  load(query: AdminPlacesQuery): Promise<void>;
  /** One place with every photo and its previews (`GET /api/admin/places/{kind}/{id}/photos`). */
  photos(kind: string, id: string): Promise<PlacePhotosView>;
}

export const ADMIN_PLACES_SERVICE = new InjectionToken<IAdminPlacesService>('ADMIN_PLACES_SERVICE');
