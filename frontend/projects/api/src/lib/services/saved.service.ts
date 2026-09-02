import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { formatWeekendRange } from '../api/weekend-dates';
import { AvoidItem } from '../models/avoid-item';
import { SavedFilter } from '../models/saved-filter';
import { SavedView } from '../models/saved-view';
import { SavedWeekend } from '../models/saved-weekend';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendSummaryDto } from '../models/weekend-summary.dto';
import { ISavedService } from './saved.service.contract';

const ALL = 'All';
const FAVOURITES = 'Favourites';
const THIS_YEAR = 'This year';
const FIVE_STAR = '5★ only';

const FILTER_BASE: ReadonlyArray<SavedFilter> = [
  { label: ALL, tone: 'default' },
  { label: FAVOURITES, icon: 'heart', tone: 'accent' },
  { label: THIS_YEAR, tone: 'default' },
  { label: FIVE_STAR, tone: 'default' },
];

// Recent vs avoid threshold: ratings ≤ this go in "avoid"; everything
// else (including unrated) goes in "recent". A 3-star weekend is "fine",
// a 1- or 2-star weekend is something to skip next time.
const AVOID_RATING_CEIL = 2;

@Injectable({ providedIn: 'root' })
export class SavedService implements ISavedService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _rows = signal<ReadonlyArray<WeekendSummaryDto>>([]);
  private readonly _filter = signal<string>(ALL);

  private readonly _view = computed<SavedView>(() => {
    const rows = this._rows();
    const filter = this._filter();
    const year = String(new Date().getFullYear());

    const matches = (r: WeekendSummaryDto): boolean => {
      switch (filter) {
        case FAVOURITES: return r.isFavourite;
        case THIS_YEAR: return r.weekendOf.startsWith(year);
        case FIVE_STAR: return r.rating === 5;
        default: return true;
      }
    };

    const recent = rows
      .filter((r) => (r.rating ?? 5) > AVOID_RATING_CEIL)
      .filter(matches)
      .map(toSavedWeekend);

    return {
      heading: 'Your weekends',
      lede: lede(rows.length, rows.filter((r) => r.isFavourite).length),
      filters: FILTER_BASE.map((f) => (f.label === filter ? { ...f, tone: 'primary' } : f)),
      recent,
      avoid: avoidItems(rows),
    };
  });

  /**
   * Constructor.
   */
  constructor() {
    void this.load();
  }

  /**
   * List.
   *
   * @returns {Signal<SavedView>} The result of the operation
   */
  list(): Signal<SavedView> {
    return this._view;
  }

  /**
   * Active Filter.
   *
   * @returns {Signal<string>} The result of the operation
   */
  activeFilter(): Signal<string> {
    return this._filter.asReadonly();
  }

  /**
   * Set Filter.
   *
   * @param {string} label - The chip label
   */
  setFilter(label: string): void {
    this._filter.set(label);
  }

  /**
   * Load.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(): Promise<void> {
    try {
      const rows = await firstValueFrom(
        this.http.get<WeekendSummaryDto[]>(
          `${this.baseUrl}/api/weekends/history?take=20`,
        ),
      );
      this._rows.set(rows ?? []);
    } catch (err) {
      console.error('SavedService.load failed', err);
      this._rows.set([]);
    }
  }

  /**
   * Set Favourite.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async setFavourite(id: string, favourite: boolean): Promise<void> {
    const dto = await firstValueFrom(
      this.http.put<WeekendDto>(`${this.baseUrl}/api/weekends/${id}/favourite`, { favourite }),
    );
    this.patch(id, { isFavourite: dto?.isFavourite ?? favourite });
  }

  /**
   * Rate.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async rate(id: string, rating: number | null): Promise<void> {
    const dto = await firstValueFrom(
      this.http.put<WeekendDto>(`${this.baseUrl}/api/weekends/${id}/rating`, { rating }),
    );
    this.patch(id, { rating: dto?.rating ?? rating });
  }

  /**
   * Rename.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async rename(id: string, title: string | null): Promise<void> {
    const clean = title?.trim() || null;
    const dto = await firstValueFrom(
      this.http.put<WeekendDto>(`${this.baseUrl}/api/weekends/${id}/title`, { title: clean }),
    );
    this.patch(id, { title: dto?.title ?? clean });
  }

  private patch(id: string, changes: Partial<WeekendSummaryDto>): void {
    this._rows.update((rows) => rows.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }
}

/**
 * To Saved Weekend.
 */
function toSavedWeekend(dto: WeekendSummaryDto): SavedWeekend {
  return {
    id: dto.id,
    weekendOf: dto.weekendOf,
    date: formatWeekendRange(dto.weekendOf),
    title: titleFor(dto),
    customTitle: dto.title && dto.title.trim().length > 0 ? dto.title : null,
    rating: dto.rating ?? 0,
    favourite: dto.isFavourite,
    highlights: highlightLine(dto),
  };
}

/**
 * Title For.
 */
function titleFor(dto: WeekendSummaryDto): string {
  if (dto.title && dto.title.trim().length > 0) return dto.title;
  const first = dto.activityHighlights[0];
  const second = dto.activityHighlights[1];
  if (first && second) return `${first} + ${second}`;
  if (first) return first;
  return 'Weekend plan';
}

/**
 * Highlight Line.
 */
function highlightLine(dto: WeekendSummaryDto): string {
  const items = dto.activityHighlights;
  if (items.length === 0) return 'No activities slotted yet.';
  return items.slice(0, 3).join(' · ');
}

/**
 * Avoid Items — every activity from a weekend rated ≤ 2 stars, newest
 * visit first, deduplicated by activity (L2-027).
 */
function avoidItems(rows: ReadonlyArray<WeekendSummaryDto>): AvoidItem[] {
  const seen = new Set<string>();
  const items: AvoidItem[] = [];
  const low = rows
    .filter((r) => r.rating !== null && r.rating <= AVOID_RATING_CEIL)
    .sort((a, b) => b.weekendOf.localeCompare(a.weekendOf));
  for (const r of low) {
    const names = r.activityHighlights.length > 0 ? r.activityHighlights : [titleFor(r)];
    for (const name of names) {
      if (seen.has(name)) continue;
      seen.add(name);
      items.push({
        title: name,
        subtitle: `Last visit: ${formatWeekendRange(r.weekendOf)} · rated ${r.rating}★`,
        icon: 'refresh',
      });
    }
  }
  return items;
}

/**
 * Lede.
 */
function lede(planned: number, favourites: number): string {
  if (planned === 0) return 'No weekends planned yet. Plan one to start building history.';
  const weekendWord = planned === 1 ? 'weekend' : 'weekends';
  if (favourites === 0) return `${planned} ${weekendWord} planned. Rate them to remember what worked.`;
  return `${planned} ${weekendWord} planned · ${favourites} favourited.`;
}
