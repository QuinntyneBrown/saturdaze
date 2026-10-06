import { InjectionToken } from '@angular/core';

import { AdminPhotoDto } from '../models/admin/admin-photo.dto';

/**
 * Contract for Saturdaze Admin's photo actions (L2-115 to L2-120). Admin
 * pages and dialogs inject `ADMIN_PHOTOS_SERVICE` and depend only on this
 * interface.
 */
export interface IAdminPhotosService {
  /** `POST /api/admin/photos/{photoId}/primary`: the photo becomes its place's only primary. */
  makePrimary(photoId: string): Promise<AdminPhotoDto>;
}

export const ADMIN_PHOTOS_SERVICE = new InjectionToken<IAdminPhotosService>('ADMIN_PHOTOS_SERVICE');
