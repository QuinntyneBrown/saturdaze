import {
  Injectable,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { MONTH_ABBR } from '../api/format';
import { addDaysIso, parseIsoDate, upcomingSaturdayIso } from '../api/weekend-dates';
import { EventFilter } from '../models/event-filter';
import { EventSection } from '../models/event-section';
import { EventsView } from '../models/events-view';
import { LocalEvent } from '../models/local-event';
import { LocalEventDto } from '../models/local-event.dto';
import { IEventsService } from './events.service.contract';

const THIS_WEEKEND = 'This weekend';
const NEXT_WEEKEND = 'Next weekend';

/** Category chips in display order; anything else sorts after, A→Z. */
const CATEGORY_TONES: ReadonlyArray<{ label: string; tone: EventFilter['tone'] }> = [
  { label: 'Outdoor', tone: 'leaf' },
  { label: 'Indoor', tone: 'indoor' },
  { label: 'Seasonal', tone: 'sun' },
  { label: 'Theatre', tone: 'default' },
  { label: 'Festival', tone: 'default' },
];

const HEADING = "What's on this weekend";
const LEDE = 'Close to home this weekend and the two after. Tap "+" to submit one I missed.';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * "17" / "MAY" — the date-tile parts for an ISO date, parsed as UTC.
 */
function tileParts(iso: string): { day: string; mon: string } {
  const d = parseIsoDate(iso);
  return { day: String(d.getUTCDate()), mon: MONTH_ABBR[d.getUTCMonth()]! };
}

/**
 * "Sat · all day" for a one-day event, "May 16 – May 17" for a span.
 */
function whenLabel(dto: LocalEventDto): string {
  if (dto.endsOn === dto.startsOn || !dto.endsOn) {
    const d = parseIsoDate(dto.startsOn);
    return `${WEEKDAY_SHORT[d.getUTCDay()]} · all day`;
  }
  const start = parseIsoDate(dto.startsOn);
  const end = parseIsoDate(dto.endsOn);
  const mon = (d: Date) => d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${mon(start)} ${start.getUTCDate()} – ${mon(end)} ${end.getUTCDate()}`;
}

/**
 * To Local Event.
 *
 * @param {LocalEventDto} dto - The dto
 *
 * @returns {LocalEvent} The result of the operation
 */
function toLocalEvent(dto: LocalEventDto): LocalEvent {
  const parts = tileParts(dto.startsOn);
  return {
    title: dto.name,
    venue: dto.location,
    when: whenLabel(dto),
    drive: `${dto.driveMinutes} min`,
    dateDay: parts.day,
    dateMon: parts.mon,
    tag: dto.category || undefined,
  };
}

/** True when the event runs on `iso` (multi-day events overlap). */
function overlaps(e: LocalEventDto, iso: string): boolean {
  const end = e.endsOn || e.startsOn;
  return e.startsOn <= iso && end >= iso;
}

/**
 * Group events into Saturday / Sunday / Coming soon. Saturday is the
 * weekendOf date; Sunday is the next day. A multi-day event shows on the
 * first weekend day it touches; everything later lands in Coming soon.
 */
function groupSections(weekendOf: string, dtos: ReadonlyArray<LocalEventDto>): EventSection[] {
  const sat = weekendOf;
  const sun = addDaysIso(weekendOf, 1);

  const saturday = dtos.filter((e) => overlaps(e, sat));
  const seen = new Set(saturday.map((e) => e.id));
  const sunday = dtos.filter((e) => !seen.has(e.id) && overlaps(e, sun));
  sunday.forEach((e) => seen.add(e.id));
  const comingSoon = dtos.filter((e) => !seen.has(e.id) && e.startsOn > sun);

  return [
    { title: 'Saturday', events: saturday.map(toLocalEvent) },
    { title: 'Sunday', events: sunday.map(toLocalEvent) },
    { title: 'Coming soon', events: comingSoon.map(toLocalEvent) },
  ];
}

/** Everything touching the following Saturday or Sunday. */
function nextWeekendSection(weekendOf: string, dtos: ReadonlyArray<LocalEventDto>): EventSection[] {
  const sat = addDaysIso(weekendOf, 7);
  const sun = addDaysIso(weekendOf, 8);
  const events = dtos.filter((e) => overlaps(e, sat) || overlaps(e, sun));
  return [{ title: NEXT_WEEKEND, events: events.map(toLocalEvent) }];
}

/**
 * Build Filters — the two window chips plus one chip per category present.
 */
function buildFilters(dtos: ReadonlyArray<LocalEventDto>, active: string): EventFilter[] {
  const categories = Array.from(new Set(dtos.map((e) => e.category).filter((c) => !!c)));
  const rank = (c: string) => {
    const i = CATEGORY_TONES.findIndex((t) => t.label === c);
    return i === -1 ? CATEGORY_TONES.length : i;
  };
  categories.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

  const base: EventFilter[] = [
    { label: THIS_WEEKEND, tone: 'default' },
    { label: NEXT_WEEKEND, tone: 'default' },
    ...categories.map((c) => ({
      label: c,
      tone: CATEGORY_TONES.find((t) => t.label === c)?.tone ?? 'default',
    })),
  ];
  return base.map((f) => (f.label === active ? { ...f, tone: 'primary' } : f));
}

@Injectable({ providedIn: 'root' })
export class EventsService implements IEventsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _rows = signal<ReadonlyArray<LocalEventDto>>([]);
  private readonly _weekendOf = signal<string>(upcomingSaturdayIso());
  private readonly _filter = signal<string>(THIS_WEEKEND);

  private readonly _view = computed<EventsView>(() => {
    const rows = this._rows();
    const weekendOf = this._weekendOf();
    const filter = this._filter();

    let sections: EventSection[];
    if (filter === NEXT_WEEKEND) {
      sections = nextWeekendSection(weekendOf, rows);
    } else if (filter === THIS_WEEKEND) {
      sections = groupSections(weekendOf, rows);
    } else {
      sections = groupSections(weekendOf, rows.filter((e) => e.category === filter))
        .filter((s) => s.events.length > 0);
    }

    return {
      heading: HEADING,
      lede: LEDE,
      filters: buildFilters(rows, filter),
      sections,
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
   * @returns {Signal<EventsView>} The result of the operation
   */
  list(): Signal<EventsView> {
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
   * Load — one call; the backend returns the Fri..Sun window plus the
   * 14-day "coming soon" tail.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(weekendOfIso?: string): Promise<void> {
    const weekendOf = weekendOfIso ?? upcomingSaturdayIso();
    try {
      const rows = await firstValueFrom(
        this.http.get<LocalEventDto[]>(`${this.baseUrl}/api/events?weekendOf=${weekendOf}`),
      );
      this._weekendOf.set(weekendOf);
      this._rows.set(rows ?? []);
    } catch (err) {
      console.error('EventsService.load failed', err);
    }
  }
}
