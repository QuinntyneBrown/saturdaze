import { InjectionToken } from '@angular/core';

import { AdminPhotoDto } from '../models/admin/admin-photo.dto';

/**
 * Contract for Saturdaze Admin's photo actions (L2-115 to L2-120). Admin
 * pages and dialogs inject `ADMIN_PHOTOS_SERVICE` and depend only on this
 * interface.
 */
/** The editable details of a photo (L2-118); attribution and licence stay mandatory. */
export interface PhotoDetails {
  readonly alt: string;
  readonly attribution: string;
  readonly licence: string;
}

export interface IAdminPhotosService {
  /** `POST /api/admin/photos/{photoId}/primary`: the photo becomes its place's only primary. */
  makePrimary(photoId: string): Promise<AdminPhotoDto>;
  /** `PATCH /api/admin/photos/{photoId}`: alt text, attribution and licence; the URL never changes. */
  edit(photoId: string, details: PhotoDetails): Promise<AdminPhotoDto>;
}

export const ADMIN_PHOTOS_SERVICE = new InjectionToken<IAdminPhotosService>('ADMIN_PHOTOS_SERVICE');
