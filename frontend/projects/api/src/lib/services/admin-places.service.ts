import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { toMedia } from '../api/media';
import { AdminPlaceDto, AdminPlacePageDto } from '../models/admin/admin-place.dto';
import { AdminPlacesView } from '../models/admin/admin-places-view';
import { PlaceRow } from '../models/admin/place-row';
import { IAdminPlacesService } from './admin-places.service.contract';

const KIND_LABEL: Record<AdminPlaceDto['kind'], string> = {
  Activity: 'Activity',
  Restaurant: 'Restaurant',
  LocalEvent: 'Event',
};

const KIND_TONE: Record<AdminPlaceDto['kind'], PlaceRow['tone']> = {
  Activity: 'leaf',
  Restaurant: 'sun',
  LocalEvent: 'sky',
};

const KIND_ICON: Record<AdminPlaceDto['kind'], string> = {
  Activity: 'tree',
  Restaurant: 'fork',
  LocalEvent: 'ticket',
};

/** "3 photos", "1 photo", "0 photos". */
function photoCount(n: number): string {
  return `${n} photo${n === 1 ? '' : 's'}`;
}

export function toPlaceRow(dto: AdminPlaceDto): PlaceRow {
  return {
    kind: dto.kind,
    id: dto.id,
    name: dto.name,
    meta: `${KIND_LABEL[dto.kind]} · ${photoCount(dto.photoCount)}`,
    photo: toMedia(dto.photo),
    tone: KIND_TONE[dto.kind],
    icon: KIND_ICON[dto.kind],
    href: `/places/${dto.kind}/${dto.id}`,
  };
}

/** HTTP implementation of `IAdminPlacesService`. */
@Injectable({ providedIn: 'root' })
export class AdminPlacesService implements IAdminPlacesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly view = signal<AdminPlacesView>({ status: 'loading', rows: [], total: 0 });

  list(): Signal<AdminPlacesView> {
    return this.view.asReadonly();
  }

  async load(): Promise<void> {
    this.view.set({ status: 'loading', rows: [], total: 0 });
    const page = await firstValueFrom(
      this.http.get<AdminPlacePageDto>(`${this.baseUrl}/api/admin/places`),
    );
    const rows = page.items.map(toPlaceRow);
    this.view.set({ status: rows.length ? 'ready' : 'empty', rows, total: page.total });
  }
}
