import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { toMedia } from '../api/media';
import { AdminPlaceDto, AdminPlacePageDto } from '../models/admin/admin-place.dto';
import { AdminPlacesQuery, toAdminPlacesParams } from '../models/admin/admin-places-query';
import { AdminPlacesView } from '../models/admin/admin-places-view';
import { PlaceRow } from '../models/admin/place-row';
import { ChipView } from '../models/chip-view';
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

/** The chip for each health flag the API returns (L2-113). */
const FLAG_CHIP: Record<string, ChipView> = {
  'no-photo': { tone: 'warn', label: 'No photo' },
  'blocked-url': { tone: 'warn', label: 'Blocked URL' },
  unreviewed: { tone: 'sun', label: 'Unreviewed' },
  'missing-alt': { tone: 'indoor', label: 'Missing alt text' },
};

const HEALTHY_CHIP: ChipView = { tone: 'accent', icon: 'check', label: 'Healthy' };

/** "3 photos", "1 photo", "0 photos". */
function photoCount(n: number): string {
  return `${n} photo${n === 1 ? '' : 's'}`;
}

export function flagChips(flags: readonly string[]): ChipView[] {
  const chips = flags.map((f) => FLAG_CHIP[f]).filter((c): c is ChipView => c !== undefined);
  return chips.length ? chips : [HEALTHY_CHIP];
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
    flags: flagChips(dto.flags),
    href: `/places/${dto.kind}/${dto.id}`,
  };
}

const EMPTY: AdminPlacesView = { status: 'loading', rows: [], total: 0, page: 1, pageSize: 50 };

/** HTTP implementation of `IAdminPlacesService`. */
@Injectable({ providedIn: 'root' })
export class AdminPlacesService implements IAdminPlacesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly view = signal<AdminPlacesView>(EMPTY);

  list(): Signal<AdminPlacesView> {
    return this.view.asReadonly();
  }

  async load(query: AdminPlacesQuery): Promise<void> {
    this.view.set({ ...EMPTY, status: 'loading' });
    const params = new HttpParams({ fromObject: toAdminPlacesParams(query) });
    const page = await firstValueFrom(
      this.http.get<AdminPlacePageDto>(`${this.baseUrl}/api/admin/places`, { params }),
    );
    const rows = page.items.map(toPlaceRow);
    this.view.set({
      status: rows.length ? 'ready' : 'empty',
      rows,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }
}
