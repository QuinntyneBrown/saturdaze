import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import {
  addDaysIso,
  formatDayDate,
  formatEventDate,
  formatWeekendEyebrow,
  monthAbbr,
  parseIsoDate,
  upcomingSaturdayIso,
} from '../api/weekend-dates';
import { ChipTone, ChipView } from '../models/chip-view';
import { DateTile } from '../models/date-tile';
import { EventCard } from '../models/event-card';
import { EventSection } from '../models/event-section';
import { EventSubmissionDto } from '../models/event-submission.dto';
import { FilterChip } from '../models/filter-chip';
import { IdeasEventsView } from '../models/ideas-events-view';
import { LocalEventDto } from '../models/local-event.dto';
import { EVENT_SUBMISSIONS_SERVICE } from './event-submissions.service.contract';
import { EventsWindow, IEventsService } from './events.service.contract';

const THIS_WEEKEND: EventsWindow = 'This weekend';
const NEXT_WEEKEND: EventsWindow = 'Next weekend';
const WINDOWS: readonly EventsWindow[] = [THIS_WEEKEND, NEXT_WEEKEND];

/** How far from home the segment looks; also the copy in the subtitle. */
export const EVENTS_DRIVE_WINDOW = 45;

const SUBTITLE = `What is on within ${EVENTS_DRIVE_WINDOW} minutes of home.`;
const SUBTITLE_MINE = 'Only you can see it until it is approved';
const SUBTITLE_SOON = 'Worth a note in the calendar';
const PENDING_REVIEW = 'Pending review';

/** Category chips in display order; anything else sorts after, A→Z. */
const CATEGORY_TONES: ReadonlyArray<{ label: string; tone: ChipTone }> = [
  { label: 'Outdoor', tone: 'leaf' },
  { label: 'Indoor', tone: 'indoor' },
  { label: 'Seasonal', tone: 'sun' },
  { label: 'Theatre', tone: 'indoor' },
  { label: 'Festival', tone: 'leaf' },
];

/** The tone for a category chip; unknown categories are neutral. */
export function categoryTone(category: string): ChipTone {
  return CATEGORY_TONES.find((t) => t.label === category)?.tone ?? 'neutral';
}

/** "17" / "May" — the date-tile parts for an ISO date, parsed as UTC. */
function tileFor(iso: string): DateTile {
  const d = parseIsoDate(iso);
  return { day: String(d.getUTCDate()), mon: monthAbbr(d) };
}

/** "Milton · Sat 17 May" (or "… · Sat 17 May to Sun 18 May" for a span). */
function metaFor(dto: LocalEventDto): string {
  const start = formatEventDate(dto.startsOn);
  const when =
    dto.endsOn && dto.endsOn !== dto.startsOn
      ? `${start} to ${formatEventDate(dto.endsOn)}`
      : start;
  return dto.location ? `${dto.location} · ${when}` : when;
}

/**
 * To Card.
 */
function toCard(dto: LocalEventDto): EventCard {
  const chips: ChipView[] = [];
  if (dto.category) chips.push({ tone: categoryTone(dto.category), label: dto.category });
  chips.push({ tone: 'sky', icon: 'car', label: `${dto.driveMinutes} min` });
  return {
    id: dto.id,
    title: dto.name,
    meta: metaFor(dto),
    tile: tileFor(dto.startsOn),
    chips,
    url: dto.url || null,
    pending: false,
  };
}

/**
 * To Pending Card — the family's own suggestion, visible only to them.
 */
function toPendingCard(dto: EventSubmissionDto): EventCard {
  const dateIso = dto.startsAtLocal.substring(0, 10);
  const when = formatEventDate(dateIso);
  return {
    id: dto.id,
    title: dto.title,
    meta: dto.location ? `${dto.location} · ${when}` : when,
    tile: tileFor(dateIso),
    chips: [{ tone: 'sun', label: PENDING_REVIEW }],
    url: dto.sourceUrl || null,
    pending: true,
  };
}

/** True when the event runs on `iso` (multi-day events overlap). */
function overlaps(e: LocalEventDto, iso: string): boolean {
  const end = e.endsOn || e.startsOn;
  return e.startsOn <= iso && end >= iso;
}

/**
 * Group events into Saturday / Sunday / Coming soon. A multi-day event
 * shows on the first weekend day it touches; everything later lands in
 * Coming soon.
 */
function thisWeekendSections(
  weekendOf: string,
  dtos: ReadonlyArray<LocalEventDto>,
): EventSection[] {
  const sat = weekendOf;
  const sun = addDaysIso(weekendOf, 1);

  const saturday = dtos.filter((e) => overlaps(e, sat));
  const seen = new Set(saturday.map((e) => e.id));
  const sunday = dtos.filter((e) => !seen.has(e.id) && overlaps(e, sun));
  sunday.forEach((e) => seen.add(e.id));
  const comingSoon = dtos.filter((e) => !seen.has(e.id) && e.startsOn > sun);

  return [
    { title: 'Saturday', subtitle: formatDayDate(sat), events: saturday.map(toCard) },
    { title: 'Sunday', subtitle: formatDayDate(sun), events: sunday.map(toCard) },
    { title: 'Coming soon', subtitle: SUBTITLE_SOON, events: comingSoon.map(toCard) },
  ];
}

/** Everything touching the following Saturday or Sunday. */
function nextWeekendSections(
  weekendOf: string,
  dtos: ReadonlyArray<LocalEventDto>,
): EventSection[] {
  const sat = addDaysIso(weekendOf, 7);
  const sun = addDaysIso(weekendOf, 8);
  const events = dtos.filter((e) => overlaps(e, sat) || overlaps(e, sun));
  return [
    { title: 'Next weekend', subtitle: formatWeekendEyebrow(sat), events: events.map(toCard) },
  ];
}

/**
 * Category Chips — one per category present, ranked by the known order
 * then A→Z; none active means "all".
 */
function categoryChips(dtos: ReadonlyArray<LocalEventDto>, active: string | null): FilterChip[] {
  const categories = Array.from(new Set(dtos.map((e) => e.category).filter((c) => !!c)));
  const rank = (c: string) => {
    const i = CATEGORY_TONES.findIndex((t) => t.label === c);
    return i === -1 ? CATEGORY_TONES.length : i;
  };
  categories.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return categories.map((c) => ({ label: c, tone: categoryTone(c), active: c === active }));
}

@Injectable({ providedIn: 'root' })
export class EventsService implements IEventsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);

  private readonly _rows = signal<ReadonlyArray<LocalEventDto>>([]);
  private readonly _weekendOf = signal<string>(upcomingSaturdayIso());
  private readonly _window = signal<EventsWindow>(THIS_WEEKEND);
  private readonly _category = signal<string | null>(null);

  private readonly _view = computed<IdeasEventsView>(() => {
    const rows = this._rows();
    const weekendOf = this._weekendOf();
    const window = this._window();
    const category = this._category();
    const narrowed = category ? rows.filter((e) => e.category === category) : rows;

    const pending = this.submissions
      .mine()()
      .filter((s) => s.status === 'Pending');
    const mine: EventSection[] =
      pending.length > 0
        ? [
            {
              title: 'Your suggestion',
              subtitle: SUBTITLE_MINE,
              events: pending.map(toPendingCard),
            },
          ]
        : [];

    const grouped =
      window === NEXT_WEEKEND
        ? nextWeekendSections(weekendOf, narrowed)
        : thisWeekendSections(weekendOf, narrowed);

    return {
      subtitle: SUBTITLE,
      windowChips: WINDOWS.map((w) => ({ label: w, tone: 'default', active: w === window })),
      categoryChips: categoryChips(rows, category),
      sections: [...mine, ...grouped.filter((s) => s.events.length > 0)],
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
   * @returns {Signal<IdeasEventsView>} The result of the operation
   */
  list(): Signal<IdeasEventsView> {
    return this._view;
  }

  /**
   * Set Window.
   *
   * @param {EventsWindow} window - The window
   */
  setWindow(window: EventsWindow): void {
    this._window.set(window);
  }

  /**
   * Set Category.
   *
   * @param {string | null} label - The category, or `null` for all
   */
  setCategory(label: string | null): void {
    this._category.set(label);
  }

  /**
   * Load — the events within the drive window, and the family's own
   * submissions so a pending suggestion shows at the top.
   *
   * @param {string} weekendOfIso - The Saturday, `YYYY-MM-DD`
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(weekendOfIso?: string): Promise<void> {
    const weekendOf = weekendOfIso ?? upcomingSaturdayIso();
    const mine = this.submissions.loadMine().catch((err: unknown) => {
      console.error('EventsService.load could not load submissions', err);
    });
    try {
      const rows = await firstValueFrom(
        this.http.get<LocalEventDto[]>(
          `${this.baseUrl}/api/events?weekendOf=${weekendOf}&maxDriveMinutes=${EVENTS_DRIVE_WINDOW}`,
        ),
      );
      this._weekendOf.set(weekendOf);
      this._rows.set(rows ?? []);
    } catch (err) {
      console.error('EventsService.load failed', err);
    }
    await mine;
  }
}
