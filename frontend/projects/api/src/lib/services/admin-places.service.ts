import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { toMedia } from '../api/media';
import { AdminPhotoDto, PlacePhotosDto } from '../models/admin/admin-photo.dto';
import { AdminPlaceDto, AdminPlacePageDto } from '../models/admin/admin-place.dto';
import { AdminPlacesQuery, toAdminPlacesParams } from '../models/admin/admin-places-query';
import { AdminPlacesView } from '../models/admin/admin-places-view';
import { PhotoTileView } from '../models/admin/photo-tile-view';
import { PlacePhotosView } from '../models/admin/place-photos-view';
import { PlaceRow } from '../models/admin/place-row';
import { ChipView } from '../models/chip-view';
import { IAdminPlacesService } from './admin-places.service.contract';

export const KIND_LABEL: Record<AdminPlaceDto['kind'], string> = {
  Activity: 'Activity',
  Restaurant: 'Restaurant',
  LocalEvent: 'Event',
};

export const KIND_TONE: Record<AdminPlaceDto['kind'], PlaceRow['tone']> = {
  Activity: 'leaf',
  Restaurant: 'sun',
  LocalEvent: 'sky',
};

export const KIND_ICON: Record<AdminPlaceDto['kind'], string> = {
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

/** The badges of a photo tile, in the order a curator decides on them. */
export function tileBadges(dto: AdminPhotoDto): ChipView[] {
  const badges: ChipView[] = [];
  if (dto.isPrimary) badges.push({ tone: 'primary', icon: 'star', label: 'Primary' });
  if (dto.blocked) badges.push({ tone: 'warn', icon: 'close', label: 'Blocked URL' });
  badges.push(
    dto.source === 'Provider'
      ? { tone: 'sky', label: 'Provider' }
      : { tone: 'accent', label: dto.source === 'Curated' ? 'Curated' : 'Submitted' },
  );
  badges.push(
    dto.reviewState === 'Unreviewed'
      ? { tone: 'sun', label: 'Unreviewed' }
      : { tone: 'accent', icon: 'check', label: 'Reviewed' },
  );
  if (!dto.alt) badges.push({ tone: 'indoor', label: 'Missing alt text' });
  return badges;
}

export function toPhotoTile(dto: AdminPhotoDto): PhotoTileView {
  return {
    id: dto.id,
    url: dto.url,
    media: dto.blocked
      ? null
      : {
          src: dto.url,
          alt: dto.alt,
          width: dto.width,
          height: dto.height,
          credit: dto.attribution,
        },
    blocked: dto.blocked,
    isPrimary: dto.isPrimary,
    source: dto.source,
    unreviewed: dto.reviewState === 'Unreviewed',
    badges: tileBadges(dto),
    alt: dto.alt,
    credit: dto.attribution,
    licence: dto.license,
    size: `${dto.width} × ${dto.height}`,
  };
}

/** "5 weekend covers follow this place", "1 weekend cover follows this place", or the none line. */
export function coverImpactText(n: number): string {
  if (n === 0) return 'No weekend covers follow this place';
  return n === 1 ? '1 weekend cover follows this place' : `${n} weekend covers follow this place`;
}

export function toPlacePhotosView(dto: PlacePhotosDto): PlacePhotosView {
  const tiles = dto.photos.map(toPhotoTile);
  const primary = tiles.find((t) => t.isPrimary);
  return {
    kind: dto.kind,
    id: dto.id,
    name: dto.name,
    subtitle: `${KIND_LABEL[dto.kind]} · ${photoCount(dto.photos.length)} · ${coverImpactText(dto.coverImpact)}`,
    coverImpact: dto.coverImpact,
    primary: primary?.media ?? null,
    tone: KIND_TONE[dto.kind],
    icon: KIND_ICON[dto.kind],
    tiles,
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

  async photos(kind: string, id: string): Promise<PlacePhotosView> {
    const dto = await firstValueFrom(
      this.http.get<PlacePhotosDto>(
        `${this.baseUrl}/api/admin/places/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/photos`,
      ),
    );
    return toPlacePhotosView(dto);
  }
}
