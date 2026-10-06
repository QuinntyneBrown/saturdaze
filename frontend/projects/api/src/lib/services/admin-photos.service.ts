import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { AdminPhotoDto } from '../models/admin/admin-photo.dto';
import { IAdminPhotosService, PhotoDetails } from './admin-photos.service.contract';

/** HTTP implementation of `IAdminPhotosService`. */
@Injectable({ providedIn: 'root' })
export class AdminPhotosService implements IAdminPhotosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private photoUrl(photoId: string): string {
    return `${this.baseUrl}/api/admin/photos/${encodeURIComponent(photoId)}`;
  }

  makePrimary(photoId: string): Promise<AdminPhotoDto> {
    return firstValueFrom(this.http.post<AdminPhotoDto>(`${this.photoUrl(photoId)}/primary`, null));
  }

  edit(photoId: string, details: PhotoDetails): Promise<AdminPhotoDto> {
    return firstValueFrom(this.http.patch<AdminPhotoDto>(this.photoUrl(photoId), details));
  }

  private placePhotosUrl(kind: string, placeId: string): string {
    return `${this.baseUrl}/api/admin/places/${encodeURIComponent(kind)}/${encodeURIComponent(placeId)}/photos`;
  }

  upload(kind: string, placeId: string, file: Blob, details: PhotoDetails): Promise<AdminPhotoDto> {
    const form = new FormData();
    form.append('file', file);
    form.append('alt', details.alt);
    form.append('attribution', details.attribution);
    form.append('licence', details.licence);
    return firstValueFrom(this.http.post<AdminPhotoDto>(this.placePhotosUrl(kind, placeId), form));
  }

  addFromUrl(
    kind: string,
    placeId: string,
    url: string,
    details: PhotoDetails,
  ): Promise<AdminPhotoDto> {
    return firstValueFrom(
      this.http.post<AdminPhotoDto>(this.placePhotosUrl(kind, placeId), { url, ...details }),
    );
  }
}
