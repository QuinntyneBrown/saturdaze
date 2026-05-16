import {
  Injectable,
  Signal,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { EventsView, LocalEvent } from '../models/event';

/**
 * Server-side shape of one row from `GET /api/events`. Mirrors
 * `Saturdaze.Application.Contracts.LocalEventDto`.
 */
interface LocalEventDto {
  readonly id: string;
  readonly name: string;
  readonly startsOn: string; // YYYY-MM-DD
  readonly endsOn: string;
  readonly location: string;
  readonly driveMinutes: number;
  readonly url: string;
  readonly category: string;
}

const FILTERS: EventsView['filters'] = [
  { label: 'This weekend', tone: 'primary' },
  { label: 'Next weekend', tone: 'default' },
  { label: 'Outdoor', tone: 'leaf' },
  { label: 'Indoor', tone: 'indoor' },
  { label: 'Seasonal', tone: 'sun' },
  { label: 'Theatre', tone: 'default' },
  { label: 'Festivals', tone: 'default' },
];

const PLACEHOLDER_VIEW: EventsView = {
  heading: "What's on this weekend",
  lede:
    'Within 45 minutes of Port Credit. Tap "Add" to slot it into your weekend.',
  filters: FILTERS,
  sections: [],
};

const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

function dateParts(iso: string): { day: string; mon: string; date: Date } {
  // ISO date string `YYYY-MM-DD` — parse as UTC to avoid TZ drift.
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return {
    day: String(d).padStart(0, ' '),
    mon: MONTH_ABBR[m! - 1]!,
    date,
  };
}

function toLocalEvent(dto: LocalEventDto): LocalEvent {
  const parts = dateParts(dto.startsOn);
  return {
    title: dto.name,
    venue: dto.location,
    when: '',
    drive: `${dto.driveMinutes} min`,
    dateDay: String(Number(parts.day)),
    dateMon: parts.mon,
    tag: dto.category,
  };
}

/**
 * Group events into Saturday / Sunday / Coming-soon. Saturday is the
 * weekendOf date; Sunday is the next day; everything else (future) lands
 * in Coming soon.
 */
function groupSections(
  weekendOf: Date,
  dtos: ReadonlyArray<LocalEventDto>,
): EventsView['sections'] {
  const sat = weekendOf.toISOString().substring(0, 10);
  const sunDate = new Date(weekendOf);
  sunDate.setUTCDate(sunDate.getUTCDate() + 1);
  const sun = sunDate.toISOString().substring(0, 10);

  const saturday = dtos.filter((e) => e.startsOn === sat || (e.startsOn < sat && e.endsOn >= sat));
  const sunday = dtos.filter((e) => e.startsOn === sun);
  const used = new Set([...saturday, ...sunday].map((e) => e.id));
  const comingSoon = dtos.filter((e) => !used.has(e.id));

  return [
    { title: 'Saturday', events: saturday.map(toLocalEvent) },
    { title: 'Sunday', events: sunday.map(toLocalEvent) },
    { title: 'Coming soon', events: comingSoon.map(toLocalEvent) },
  ];
}

/**
 * The "current Saturday" used to bucket events into Saturday / Sunday /
 * Coming soon. Hard-pinned to match the seed `anchorSaturday`; once the
 * planner ships, this will move to whatever `GET /api/weekends/current`
 * returns.
 */
const DEMO_WEEKEND_OF = '2026-05-16';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _view = signal<EventsView>(PLACEHOLDER_VIEW);

  constructor() {
    void this.load();
  }

  list(): Signal<EventsView> {
    return this._view.asReadonly();
  }

  async load(weekendOfIso?: string): Promise<void> {
    const weekendOf = weekendOfIso ?? DEMO_WEEKEND_OF;
    try {
      // Fetch this weekend plus a wider future window for "Coming soon".
      // The events endpoint is weekend-scoped, so future festivals live
      // behind separate queries — once a generic "future events" endpoint
      // exists this collapses to one call.
      const [thisWeekend, nextWeekend, futureLate] = await Promise.all([
        firstValueFrom(this.fetchWeekend(weekendOf)),
        firstValueFrom(this.fetchWeekend(addDays(weekendOf, 7))),
        firstValueFrom(this.fetchWeekend('2026-09-12')),
      ]);
      const all = dedupe([...thisWeekend, ...nextWeekend, ...futureLate]);
      const weekendOfDate = new Date(weekendOf + 'T00:00:00Z');
      this._view.set({
        heading: PLACEHOLDER_VIEW.heading,
        lede: PLACEHOLDER_VIEW.lede,
        filters: FILTERS,
        sections: groupSections(weekendOfDate, all),
      });
    } catch (err) {
      console.error('EventsService.load failed', err);
    }
  }

  private fetchWeekend(weekendOf: string) {
    return this.http.get<LocalEventDto[]>(
      `${this.baseUrl}/api/events?weekendOf=${weekendOf}&maxDriveMinutes=200`,
    );
  }
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

function dedupe(rows: LocalEventDto[]): LocalEventDto[] {
  const seen = new Set<string>();
  const out: LocalEventDto[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}
