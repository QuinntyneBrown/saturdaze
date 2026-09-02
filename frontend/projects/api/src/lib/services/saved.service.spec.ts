import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { WeekendSummaryDto } from '../models/weekend-summary.dto';
import { settle, weekendDto } from '../testing/weekend-fixture';
import { SavedService, pastSubtitle, toPastCard } from './saved.service';

const BASE = 'http://localhost:3000';
const HISTORY = `${BASE}/api/weekends/history?take=50`;
const YEAR = new Date().getFullYear();

function row(overrides: Partial<WeekendSummaryDto> = {}): WeekendSummaryDto {
  return {
    id: 'w1',
    weekendOf: `${YEAR}-05-09`,
    isFavourite: true,
    regenerateCount: 0,
    blockCount: 8,
    activityHighlights: ['Bronte Creek', 'Rec Room', 'Splash pad', 'Ice cream'],
    title: null,
    rating: 5,
    ...overrides,
  };
}

const ROWS: WeekendSummaryDto[] = [
  row({
    id: 'w2',
    weekendOf: `${YEAR}-04-04`,
    isFavourite: false,
    rating: 2,
    activityHighlights: ['The Rec Room'],
    title: 'Rainy Rec Room',
  }),
  row(),
  row({
    id: 'w3',
    weekendOf: `${YEAR - 1}-12-27`,
    isFavourite: false,
    rating: null,
    activityHighlights: [],
    title: null,
  }),
];

describe('SavedService', () => {
  let service: SavedService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SavedService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(SavedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushLoad(rows: WeekendSummaryDto[] = ROWS): Promise<void> {
    httpMock.expectOne(HISTORY).flush(rows);
    await settle();
  }

  it('asks for fifty weekends and is loading until they arrive', async () => {
    expect(service.list()().status).toBe('loading');
    expect(
      service
        .list()()
        .filters.map((f) => f.label),
    ).toEqual(['All', 'Favourites', 'This year', '5★']);
    await flushLoad();
    expect(service.list()().status).toBe('ready');
  });

  it('is empty with the first-weekend copy when there is no history', async () => {
    await flushLoad([]);
    expect(service.list()()).toMatchObject({
      status: 'empty',
      subtitle: 'Your first weekend lands here once Sunday is over.',
      weekends: [],
      skipping: [],
      filterEmpty: null,
    });
  });

  it('counts the weekends in words and lists them newest first', async () => {
    await flushLoad();
    const view = service.list()();
    expect(view.subtitle).toBe('Three weekends so far. Repeat what worked, remix the rest.');
    expect(view.weekends.map((w) => w.id)).toEqual(['w1', 'w2', 'w3']);
    expect(pastSubtitle(1)).toBe('One weekend so far. Repeat what worked, remix the rest.');
  });

  it('maps a row to a card', () => {
    expect(toPastCard(row({ weekendOf: '2026-05-09' }))).toEqual({
      id: 'w1',
      weekendOf: '2026-05-09',
      eyebrow: '9 – 10 May 2026',
      title: 'Bronte Creek + Rec Room',
      customTitle: null,
      rating: 5,
      ratingLabel: '5 of 5',
      highlights: 'Bronte Creek · Rec Room · Splash pad',
      favourite: true,
    });
    expect(
      toPastCard(row({ title: ' Zoo day ', rating: null, activityHighlights: [] })),
    ).toMatchObject({
      title: ' Zoo day ',
      customTitle: ' Zoo day ',
      rating: 0,
      ratingLabel: 'Rate it',
      highlights: 'No activities slotted yet.',
    });
    expect(toPastCard(row({ activityHighlights: ['Only one'] })).title).toBe('Only one');
    expect(toPastCard(row({ activityHighlights: [] })).title).toBe('Weekend plan');
    httpMock.expectOne(HISTORY).flush([]);
  });

  it('filters client-side and explains an empty filter', async () => {
    await flushLoad();
    service.setFilter('Favourites');
    let view = service.list()();
    expect(view.filters.find((f) => f.active)?.label).toBe('Favourites');
    expect(view.weekends.map((w) => w.id)).toEqual(['w1']);
    expect(view.filterEmpty).toBeNull();

    service.setFilter('This year');
    expect(
      service
        .list()()
        .weekends.map((w) => w.id),
    ).toEqual(['w1', 'w2']);

    service.setFilter('5★');
    expect(
      service
        .list()()
        .weekends.map((w) => w.id),
    ).toEqual(['w1']);

    await flushAfter(() => service.load(), [row({ rating: 3, isFavourite: false })]);
    service.setFilter('Favourites');
    view = service.list()();
    expect(view.weekends).toEqual([]);
    expect(view.filterEmpty).toBe('No favourites yet. Tap the heart on a weekend you loved.');
    service.setFilter('5★');
    expect(service.list()().filterEmpty).toBe('Nothing rated 5 stars yet.');
    service.setFilter('All');
    expect(service.list()().filterEmpty).toBeNull();
  });

  it('lists what to skip from poorly rated weekends', async () => {
    await flushLoad();
    expect(service.list()().skipping).toEqual([
      { tone: 'warn', icon: 'close', label: 'The Rec Room · rated 2★ on 5 Apr' },
    ]);
  });

  it('PUTs the favourite flag and patches the row', async () => {
    await flushLoad();
    const promise = service.setFavourite('w2', true);
    const req = httpMock.expectOne(`${BASE}/api/weekends/w2/favourite`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ favourite: true });
    req.flush(weekendDto({ id: 'w2', isFavourite: true }));
    await promise;
    expect(
      service
        .list()()
        .weekends.find((w) => w.id === 'w2')?.favourite,
    ).toBe(true);
  });

  it('PUTs the rating, clearing with null', async () => {
    await flushLoad();
    const rate = service.rate('w2', 4);
    const req = httpMock.expectOne(`${BASE}/api/weekends/w2/rating`);
    expect(req.request.body).toEqual({ rating: 4 });
    req.flush(weekendDto({ id: 'w2', rating: 4 }));
    await rate;
    expect(
      service
        .list()()
        .weekends.find((w) => w.id === 'w2'),
    ).toMatchObject({
      rating: 4,
      ratingLabel: '4 of 5',
    });
    expect(service.list()().skipping).toEqual([]);

    const clear = service.rate('w2', null);
    httpMock
      .expectOne(`${BASE}/api/weekends/w2/rating`)
      .flush(weekendDto({ id: 'w2', rating: null }));
    await clear;
    expect(
      service
        .list()()
        .weekends.find((w) => w.id === 'w2')?.ratingLabel,
    ).toBe('Rate it');
  });

  it('PUTs a trimmed title, or null to clear it', async () => {
    await flushLoad();
    const rename = service.rename('w1', '  Lavender day  ');
    const req = httpMock.expectOne(`${BASE}/api/weekends/w1/title`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Lavender day' });
    req.flush(weekendDto({ id: 'w1', title: 'Lavender day' }));
    await rename;
    expect(service.list()().weekends[0]).toMatchObject({
      title: 'Lavender day',
      customTitle: 'Lavender day',
    });

    const clear = service.rename('w1', '   ');
    const clearReq = httpMock.expectOne(`${BASE}/api/weekends/w1/title`);
    expect(clearReq.request.body).toEqual({ title: null });
    clearReq.flush(weekendDto({ id: 'w1', title: null }));
    await clear;
    expect(service.list()().weekends[0]).toMatchObject({
      title: 'Bronte Creek + Rec Room',
      customTitle: null,
    });
  });

  it('shows the empty state when the history call fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpMock.expectOne(HISTORY).flush(null, { status: 500, statusText: 'Boom' });
    await settle();
    expect(service.list()().status).toBe('empty');
    vi.restoreAllMocks();
  });

  async function flushAfter(action: () => Promise<void>, rows: WeekendSummaryDto[]): Promise<void> {
    const promise = action();
    httpMock.expectOne(HISTORY).flush(rows);
    await promise;
  }
});
