import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { SavedView, SavedWeekend } from '../models/saved';

/**
 * Server-side shape of one row from `GET /api/weekends/history`. Mirrors
 * `Saturdaze.Application.Contracts.WeekendSummaryDto`.
 */
interface WeekendSummaryDto {
  readonly id: string;
  readonly weekendOf: string; // YYYY-MM-DD
  readonly isFavourite: boolean;
  readonly regenerateCount: number;
  readonly blockCount: number;
  readonly activityHighlights: ReadonlyArray<string>;
  readonly title: string | null;
  readonly rating: number | null;
}

const FILTERS: SavedView['filters'] = [
  { label: 'All', tone: 'primary' },
  { label: 'Favourites', icon: 'heart', tone: 'accent' },
  { label: 'This year', tone: 'default' },
  { label: '5★ only', tone: 'default' },
];

const EMPTY_VIEW: SavedView = {
  heading: 'Your weekends',
  lede: 'No weekends planned yet. Plan one to start building history.',
  filters: FILTERS,
  recent: [],
  avoid: [],
};

// Recent vs avoid threshold: ratings ≤ this go in "avoid"; everything
// else (including unrated) goes in "recent". A 3-star weekend is "fine",
// a 1- or 2-star weekend is something to skip next time.
const AVOID_RATING_CEIL = 2;

@Injectable({ providedIn: 'root' })
export class SavedService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly _view = signal<SavedView>(EMPTY_VIEW);

  constructor() {
    void this.load();
  }

  list(): Signal<SavedView> {
    return this._view.asReadonly();
  }

  async load(): Promise<void> {
    try {
      const rows = await firstValueFrom(
        this.http.get<WeekendSummaryDto[]>(
          `${this.baseUrl}/api/weekends/history?take=20`,
        ),
      );

      const planned = rows.length;
      const recentFavCount = rows.filter((r) => r.isFavourite).length;
      const recent = rows
        .filter((r) => (r.rating ?? 5) > AVOID_RATING_CEIL)
        .map(toSavedWeekend);
      const avoid = rows
        .filter((r) => r.rating !== null && r.rating <= AVOID_RATING_CEIL)
        .map((r) => ({
          title: titleFor(r),
          subtitle: `Last visit: ${formatRange(r.weekendOf)}`,
          icon: 'rotate-ccw',
        }));

      this._view.set({
        heading: 'Your weekends',
        lede: lede(planned, recentFavCount),
        filters: FILTERS,
        recent,
        avoid,
      });
    } catch (err) {
      console.error('SavedService.load failed', err);
      this._view.set(EMPTY_VIEW);
    }
  }
}

function toSavedWeekend(dto: WeekendSummaryDto): SavedWeekend {
  return {
    date: formatRange(dto.weekendOf),
    title: titleFor(dto),
    rating: dto.rating ?? 0,
    favourite: dto.isFavourite,
    highlights: highlightLine(dto),
  };
}

function titleFor(dto: WeekendSummaryDto): string {
  if (dto.title && dto.title.trim().length > 0) return dto.title;
  const first = dto.activityHighlights[0];
  const second = dto.activityHighlights[1];
  if (first && second) return `${first} + ${second}`;
  if (first) return first;
  return 'Weekend plan';
}

function highlightLine(dto: WeekendSummaryDto): string {
  const items = dto.activityHighlights;
  if (items.length === 0) return 'No activities slotted yet.';
  return items.slice(0, 3).join(' · ');
}

/**
 * Format a Saturday date as "May 10–11, 2026" — the range spans Sat→Sun.
 */
function formatRange(saturdayIso: string): string {
  const [y, m, d] = saturdayIso.split('-').map(Number);
  const sat = new Date(Date.UTC(y!, m! - 1, d!));
  const sun = new Date(sat);
  sun.setUTCDate(sun.getUTCDate() + 1);
  const month = sat.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${month} ${sat.getUTCDate()}–${sun.getUTCDate()}, ${sat.getUTCFullYear()}`;
}

function lede(planned: number, favourites: number): string {
  if (planned === 0) return 'No weekends planned yet. Plan one to start building history.';
  const weekendWord = planned === 1 ? 'weekend' : 'weekends';
  if (favourites === 0) return `${planned} ${weekendWord} planned. Rate them to remember what worked.`;
  return `${planned} ${weekendWord} planned · ${favourites} favourited.`;
}
