import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { toMedia } from '../api/media';
import { AdminPhotoDto } from '../models/admin/admin-photo.dto';
import { PhotoReviewItemDto, ReviewDecision } from '../models/admin/photo-review.dto';
import { ReviewItemView } from '../models/admin/review-item-view';
import { KIND_ICON, KIND_LABEL, KIND_TONE } from './admin-places.service';
import { IAdminPhotosService, PhotoDetails } from './admin-photos.service.contract';

export function toReviewItem(dto: PhotoReviewItemDto): ReviewItemView {
  const p = dto.photo;
  return {
    id: p.id,
    kind: dto.kind,
    placeId: dto.placeId,
    placeName: dto.placeName,
    placeHref: `/places/${dto.kind}/${dto.placeId}`,
    meta: `${KIND_LABEL[dto.kind]} · ${p.license}`,
    candidate: p.blocked
      ? null
      : { src: p.url, alt: p.alt, width: p.width, height: p.height, credit: p.attribution },
    replaces: toMedia(dto.replaces),
    replacesCaption: dto.replaces ? 'Would replace' : 'Would become primary',
    tone: KIND_TONE[dto.kind],
    icon: KIND_ICON[dto.kind],
  };
}

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

  async remove(photoId: string, nextPrimaryId: string | null): Promise<void> {
    const params = nextPrimaryId ? new HttpParams().set('nextPrimaryId', nextPrimaryId) : undefined;
    await firstValueFrom(this.http.delete<void>(this.photoUrl(photoId), { params }));
  }

  async reviews(): Promise<ReviewItemView[]> {
    const items = await firstValueFrom(
      this.http.get<PhotoReviewItemDto[]>(`${this.baseUrl}/api/admin/photo-reviews`),
    );
    return items.map(toReviewItem);
  }

  async review(photoId: string, decision: ReviewDecision, reason?: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.photoUrl(photoId)}/review`, {
        decision,
        reason: reason ?? null,
      }),
    );
  }
}
