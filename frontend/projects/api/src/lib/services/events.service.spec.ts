import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { upcomingSaturdayIso } from '../api/weekend-dates';
import { EventSubmissionDto } from '../models/event-submission.dto';
import { LocalEventDto } from '../models/local-event.dto';
import { settle } from '../testing/weekend-fixture';
import { EVENT_SUBMISSIONS_SERVICE } from './event-submissions.service.contract';
import { EVENTS_DRIVE_WINDOW, EventsService, categoryTone } from './events.service';

const BASE = 'http://localhost:3000';
const WEEKEND = '2026-05-16';

function event(overrides: Partial<LocalEventDto> = {}): LocalEventDto {
  return {
    id: 'ev1',
    name: 'Terre Bleu Lavender Bloom Opening',
    startsOn: '2026-05-16',
    endsOn: '2026-05-16',
    location: 'Milton',
    driveMinutes: 45,
    url: 'https://example.com/terre-bleu',
    category: 'Seasonal',
    ...overrides,
  };
}

const EVENTS: LocalEventDto[] = [
  event(),
  event({
    id: 'ev2',
    name: 'Cirque Mechanics',
    location: 'Living Arts Centre',
    driveMinutes: 5,
    category: 'Theatre',
    url: '',
  }),
  event({
    id: 'ev3',
    name: 'Spring Tulip Festival',
    startsOn: '2026-05-15',
    endsOn: '2026-05-17',
    location: 'RBG',
    category: 'Festival',
  }),
  event({
    id: 'ev4',
    name: 'Symphony Kids',
    startsOn: '2026-05-17',
    endsOn: '2026-05-17',
    category: 'Theatre',
  }),
  event({
    id: 'ev5',
    name: 'Farmers Market',
    startsOn: '2026-05-17',
    endsOn: '',
    category: 'Local',
  }),
  event({
    id: 'ev6',
    name: 'Buskerfest',
    startsOn: '2026-05-30',
    endsOn: '2026-05-31',
    category: 'Outdoor',
  }),
  event({
    id: 'ev7',
    name: 'Next-weekend fair',
    startsOn: '2026-05-23',
    endsOn: '2026-05-23',
    category: 'Indoor',
  }),
];

function submission(overrides: Partial<EventSubmissionDto> = {}): EventSubmissionDto {
  return {
    id: 'sub1',
    title: 'Port Credit Buskerfest',
    startsAtLocal: '2026-06-20T14:00',
    endsAtLocal: '2026-06-20T21:00',
    location: 'Lakeshore Rd',
    description: null,
    costNote: null,
    ageRange: null,
    sourceUrl: 'https://example.com/buskerfest',
    status: 'Pending',
    submittedByUserId: 'u1',
    submittedByEmail: 'quinn@example.com',
    submittedAtUtc: '2026-05-10T12:00:00Z',
    reviewedAtUtc: null,
    rejectionReason: null,
    ...overrides,
  };
}

describe('EventsService', () => {
  let service: EventsService;
  let httpMock: HttpTestingController;
  const mine = signal<ReadonlyArray<EventSubmissionDto>>([]);
  const loadMine = vi.fn(() => Promise.resolve());

  const url = (weekendOf: string) =>
    `${BASE}/api/events?weekendOf=${weekendOf}&maxDriveMinutes=${EVENTS_DRIVE_WINDOW}`;

  beforeEach(() => {
    mine.set([]);
    loadMine.mockClear();
    TestBed.configureTestingModule({
      providers: [
        EventsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: { mine: () => mine, loadMine } },
      ],
    });
    service = TestBed.inject(EventsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Answer the constructor's request, then load a fixed weekend. */
  async function loadFixed(rows: LocalEventDto[] = EVENTS): Promise<void> {
    httpMock.expectOne(url(upcomingSaturdayIso())).flush([]);
    const promise = service.load(WEEKEND);
    httpMock.expectOne(url(WEEKEND)).flush(rows);
    await promise;
    await settle();
  }

  it('asks for events within the drive window and the family submissions', async () => {
    await loadFixed();
    expect(loadMine).toHaveBeenCalledTimes(2);
    expect(service.list()().subtitle).toBe('What is on within 45 minutes of home.');
  });

  it('groups this weekend into Saturday, Sunday and Coming soon, dropping empties', async () => {
    await loadFixed();
    const sections = service.list()().sections;
    expect(sections.map((s) => s.title)).toEqual(['Saturday', 'Sunday', 'Coming soon']);
    expect(sections[0]!.subtitle).toBe('16 May');
    expect(sections[0]!.events.map((e) => e.id)).toEqual(['ev1', 'ev2', 'ev3']);
    expect(sections[1]!.subtitle).toBe('17 May');
    expect(sections[1]!.events.map((e) => e.id)).toEqual(['ev4', 'ev5']);
    expect(sections[2]!.subtitle).toBe('Worth a note in the calendar');
    expect(sections[2]!.events.map((e) => e.id)).toEqual(['ev6', 'ev7']);
  });

  it('builds a card with meta, tile, category and drive chips and the details link', async () => {
    await loadFixed();
    const [first, second, span] = service.list()().sections[0]!.events;
    expect(first).toEqual({
      id: 'ev1',
      title: 'Terre Bleu Lavender Bloom Opening',
      meta: 'Milton · Sat 16 May',
      tile: { day: '16', mon: 'May' },
      chips: [
        { tone: 'sun', label: 'Seasonal' },
        { tone: 'sky', icon: 'car', label: '45 min' },
      ],
      url: 'https://example.com/terre-bleu',
      pending: false,
    });
    expect(second!.url).toBeNull();
    expect(second!.chips[0]).toEqual({ tone: 'indoor', label: 'Theatre' });
    expect(span!.meta).toBe('RBG · Fri 15 May to Sun 17 May');
    expect(span!.chips[0]).toEqual({ tone: 'leaf', label: 'Festival' });
    expect(categoryTone('Local')).toBe('neutral');
  });

  it('lists categories in the known order, none active, and narrows on pick', async () => {
    await loadFixed();
    let view = service.list()();
    expect(view.categoryChips.map((c) => c.label)).toEqual([
      'Outdoor',
      'Indoor',
      'Seasonal',
      'Theatre',
      'Festival',
      'Local',
    ]);
    expect(view.categoryChips.every((c) => !c.active)).toBe(true);

    service.setCategory('Theatre');
    view = service.list()();
    expect(view.categoryChips.find((c) => c.active)?.label).toBe('Theatre');
    expect(view.sections.map((s) => [s.title, s.events.map((e) => e.id)])).toEqual([
      ['Saturday', ['ev2']],
      ['Sunday', ['ev4']],
    ]);

    service.setCategory(null);
    expect(service.list()().sections).toHaveLength(3);
  });

  it('switches to next weekend', async () => {
    await loadFixed();
    service.setWindow('Next weekend');
    const view = service.list()();
    expect(view.windowChips.map((c) => [c.label, c.active])).toEqual([
      ['This weekend', false],
      ['Next weekend', true],
    ]);
    expect(view.sections).toHaveLength(1);
    expect(view.sections[0]).toMatchObject({ title: 'Next weekend', subtitle: '23 – 24 May 2026' });
    expect(view.sections[0]!.events.map((e) => e.id)).toEqual(['ev7']);
  });

  it('puts the family’s pending suggestion first', async () => {
    await loadFixed();
    mine.set([submission(), submission({ id: 'sub2', status: 'Approved' })]);
    const sections = service.list()().sections;
    expect(sections[0]!.title).toBe('Your suggestion');
    expect(sections[0]!.subtitle).toBe('Only you can see it until it is approved');
    expect(sections[0]!.events).toEqual([
      {
        id: 'sub1',
        title: 'Port Credit Buskerfest',
        meta: 'Lakeshore Rd · Sat 20 Jun',
        tile: { day: '20', mon: 'Jun' },
        chips: [{ tone: 'sun', label: 'Pending review' }],
        url: 'https://example.com/buskerfest',
        pending: true,
      },
    ]);
    service.setCategory('Theatre');
    expect(service.list()().sections[0]!.title).toBe('Your suggestion');
  });

  it('keeps the previous rows when a load fails', async () => {
    await loadFixed();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = service.load(WEEKEND);
    httpMock.expectOne(url(WEEKEND)).flush(null, { status: 500, statusText: 'Boom' });
    await reload;
    expect(
      service
        .list()()
        .sections.flatMap((s) => s.events),
    ).toHaveLength(7);
    vi.restoreAllMocks();
  });
});
