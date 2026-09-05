import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { capitalise, numberWord } from '../api/format';
import {
  PAST_FILTER_ALL,
  filterEmptyCopy,
  matchesPastFilter,
  pastFilterChips,
  skippingChips,
} from '../api/history-filters';
import { formatWeekendEyebrow } from '../api/weekend-dates';
import { PastView } from '../models/past-view';
import { PastWeekendCard } from '../models/past-weekend-card';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendSummaryDto } from '../models/weekend-summary.dto';
import { ISavedService } from './saved.service.contract';

const HISTORY_TAKE = 50;
const SUBTITLE_EMPTY = 'Your first weekend lands here once Sunday is over.';
const SUBTITLE_LOADING = 'Pulling your weekends.';
const RATE_IT = 'Rate it';

/** "Twelve weekends so far. Repeat what worked, remix the rest." */
export function pastSubtitle(count: number): string {
  if (count === 0) return SUBTITLE_EMPTY;
  const word = count === 1 ? 'weekend' : 'weekends';
  return `${capitalise(numberWord(count))} ${word} so far. Repeat what worked, remix the rest.`;
}

/**
 * To Card.
 */
export function toPastCard(dto: WeekendSummaryDto): PastWeekendCard {
  const rating = dto.rating ?? 0;
  return {
    id: dto.id,
    weekendOf: dto.weekendOf,
    eyebrow: formatWeekendEyebrow(dto.weekendOf),
    title: titleFor(dto),
    customTitle: dto.title && dto.title.trim().length > 0 ? dto.title : null,
    rating,
    ratingLabel: rating > 0 ? `${rating} of 5` : RATE_IT,
    highlights: highlightLine(dto),
    favourite: dto.isFavourite,
  };
}

/**
 * Title For — the custom name, else "First + Second", else "Weekend plan".
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
 * Highlight Line — up to three activities, dot-separated.
 */
function highlightLine(dto: WeekendSummaryDto): string {
  const items = dto.activityHighlights;
  if (items.length === 0) return 'No activities slotted yet.';
  return items.slice(0, 3).join(' · ');
}

@Injectable({ providedIn: 'root' })
export class SavedService implements ISavedService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _rows = signal<ReadonlyArray<WeekendSummaryDto>>([]);
  private readonly _loaded = signal(false);
  private readonly _filter = signal<string>(PAST_FILTER_ALL);

  private readonly _view = computed<PastView>(() => {
    const rows = this._rows();
    const filter = this._filter();
    const filters = pastFilterChips(filter);

    if (!this._loaded()) {
      return {
        status: 'loading',
        subtitle: SUBTITLE_LOADING,
        filters,
        weekends: [],
        skipping: [],
        filterEmpty: null,
      };
    }
    if (rows.length === 0) {
      return {
        status: 'empty',
        subtitle: SUBTITLE_EMPTY,
        filters,
        weekends: [],
        skipping: [],
        filterEmpty: null,
      };
    }

    const year = new Date().getFullYear();
    const weekends = rows
      .filter((r) => matchesPastFilter(r, filter, year))
      .sort((a, b) => b.weekendOf.localeCompare(a.weekendOf))
      .map(toPastCard);

    return {
      status: 'ready',
      subtitle: pastSubtitle(rows.length),
      filters,
      weekends,
      skipping: skippingChips(rows),
      filterEmpty: weekends.length === 0 ? filterEmptyCopy(filter) : null,
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
   * @returns {Signal<PastView>} The result of the operation
   */
  list(): Signal<PastView> {
    return this._view;
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
          `${this.baseUrl}/api/weekends/history?take=${HISTORY_TAKE}`,
        ),
      );
      this._rows.set(rows ?? []);
    } catch (err) {
      console.error('SavedService.load failed', err);
      this._rows.set([]);
    } finally {
      this._loaded.set(true);
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
    this.patch(id, { rating: dto ? dto.rating : rating });
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
    this.patch(id, { title: dto ? dto.title : clean });
  }

  private patch(id: string, changes: Partial<WeekendSummaryDto>): void {
    this._rows.update((rows) => rows.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }
}
