import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { addDaysIso, upcomingSaturdayIso } from '../api/weekend-dates';
import { projectWeekend } from '../api/weekend-projection';
import { RestaurantDto } from '../models/restaurant.dto';
import { settle, weekendDto } from '../testing/weekend-fixture';
import { EditableFamilyProfile, FAMILY_SERVICE } from './family.service.contract';
import { DEFAULT_FOOD_FILTERS, RestaurantService } from './restaurant.service';
import { WEEKEND_PLAN_SERVICE } from './weekend-plan.service.contract';

const BASE = 'http://localhost:3000';

const profile = signal<EditableFamilyProfile | null>({
  name: 'The Browns',
  homeLocation: 'Port Credit',
  budgetEnabled: false,
  tryNewEnabled: false,
  fridayPreviewEnabled: true,
  members: [
    { id: 'm1', name: 'Quinn', age: 38 },
    { id: 'm2', name: 'Sara', age: 36 },
    { id: 'm3', name: 'Eli', age: 9 },
    { id: 'm4', name: 'Mae', age: 5 },
  ],
  commitments: [],
  preferences: [],
});

const weekend = signal(projectWeekend(weekendDto()));

function restaurant(overrides: Partial<RestaurantDto> = {}): RestaurantDto {
  return {
    id: 'r1',
    name: 'La Marina',
    style: 'Mediterranean',
    slot: 'Lunch',
    wifeApproved: true,
    driveMinutes: 6,
    notes: 'Patio',
    menuUrl: 'https://example.com/la-marina/menu',
    votes: [
      { voterName: 'Quinn', vote: 'up' },
      { voterName: 'Sara', vote: 'up' },
    ],
    ...overrides,
  };
}

const SAT_LUNCH: RestaurantDto[] = [
  restaurant({
    id: 'r3',
    name: 'Sicilian',
    style: 'Italian',
    wifeApproved: false,
    driveMinutes: 12,
    notes: '',
    votes: [],
  }),
  restaurant({
    id: 'r2',
    name: 'Symposium',
    style: 'Brunch',
    driveMinutes: 9,
    notes: '',
    votes: [],
    menuUrl: null,
  }),
  restaurant(),
];
const SAT_DINNER: RestaurantDto[] = [
  restaurant({
    id: 'r4',
    name: "Jack Astor's",
    style: 'Casual',
    slot: 'Dinner',
    driveMinutes: 2,
    notes: '',
  }),
  restaurant({
    id: 'r5',
    name: 'Pho Corner',
    style: 'Vietnamese',
    slot: 'Dinner',
    wifeApproved: false,
    driveMinutes: 20,
    notes: '',
    votes: [],
  }),
];
const SUN_LUNCH: RestaurantDto[] = [
  restaurant({
    id: 'r6',
    name: 'Sunday Diner',
    style: 'Diner',
    driveMinutes: 4,
    notes: '',
    votes: [],
  }),
];
const SUN_DINNER: RestaurantDto[] = [];

describe('RestaurantService', () => {
  let service: RestaurantService;
  let httpMock: HttpTestingController;
  const saturday = upcomingSaturdayIso();
  const sunday = addDaysIso(saturday, 1);

  const url = (day: string, slot: string) =>
    `${BASE}/api/restaurants?day=${day}&slot=${slot}&wifeApprovedOnly=false&take=10`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestaurantService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: FAMILY_SERVICE, useValue: { getEditableProfile: () => profile } },
        { provide: WEEKEND_PLAN_SERVICE, useValue: { getWeekend: () => weekend } },
      ],
    });
    service = TestBed.inject(RestaurantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushLoad(): Promise<void> {
    httpMock.expectOne(url(saturday, 'Lunch')).flush(SAT_LUNCH);
    httpMock.expectOne(url(saturday, 'Dinner')).flush(SAT_DINNER);
    httpMock.expectOne(url(sunday, 'Lunch')).flush(SUN_LUNCH);
    httpMock.expectOne(url(sunday, 'Dinner')).flush(SUN_DINNER);
    await settle();
  }

  it('fetches both days and both meals on load', async () => {
    await flushLoad();
    const view = service.list()();
    expect(view.subtitle).toBe('Places to eat near what you are already doing.');
    expect(view.sections.map((s) => s.title)).toEqual(['Lunch', 'Dinner']);
    expect(view.sections[0]!.picks).toHaveLength(3);
    expect(view.sections[1]!.picks).toHaveLength(2);
  });

  it('starts on Saturday with no slot narrowed and both toggles off', async () => {
    await flushLoad();
    const view = service.list()();
    expect(DEFAULT_FOOD_FILTERS).toEqual({
      day: 'Saturday',
      slot: null,
      wifeApproved: false,
      quick: false,
    });
    expect(view.dayChips.map((c) => [c.label, c.active])).toEqual([
      ['Saturday', true],
      ['Sunday', false],
    ]);
    expect(view.slotChips.map((c) => c.active)).toEqual([false, false]);
    expect(view.extraChips.map((c) => c.label)).toEqual(['Wife-approved', 'Under 15 min']);
    expect(view.extraChips[0]).toMatchObject({ tone: 'accent', icon: 'heart', active: false });
  });

  it('ranks approved places first, then closest, and marks the top pick', async () => {
    await flushLoad();
    const lunch = service.list()().sections[0]!;
    expect(lunch.picks.map((p) => p.id)).toEqual(['r1', 'r2', 'r3']);
    expect(lunch.picks.map((p) => p.topPick)).toEqual([true, false, false]);
    expect(lunch.lockedId).toBeNull();
  });

  it('builds a card with meta, chips, the roster votes and the menu link', async () => {
    await flushLoad();
    const card = service.list()().sections[0]!.picks[0]!;
    expect(card).toMatchObject({
      id: 'r1',
      name: 'La Marina',
      meta: 'Mediterranean · Patio · 2 of 4 votes',
      menuUrl: 'https://example.com/la-marina/menu',
      locked: false,
      lockedLabel: null,
      dimmed: false,
      votesDisabled: false,
      chips: [
        { tone: 'accent', icon: 'heart', label: 'Wife-approved' },
        { tone: 'sky', icon: 'car', label: '6 min' },
      ],
    });
    expect(card.votes).toEqual([
      { name: 'Quinn', initial: 'Q', tone: 'primary', vote: 'up' },
      { name: 'Sara', initial: 'S', tone: 'leaf', vote: 'up' },
      { name: 'Eli', initial: 'E', tone: 'sky', vote: 'none' },
      { name: 'Mae', initial: 'M', tone: 'sun', vote: 'none' },
    ]);
    const unvoted = service.list()().sections[0]!.picks[2]!;
    expect(unvoted.meta).toBe('Italian');
    expect(unvoted.chips).toEqual([{ tone: 'sky', icon: 'car', label: '12 min' }]);
    expect(service.list()().sections[0]!.picks[1]!.menuUrl).toBeNull();
  });

  it('describes each section from the weekend meal block, else close to home', async () => {
    await flushLoad();
    const [lunch, dinner] = service.list()().sections;
    expect(lunch!.subtitle).toBe('Near Lavender fields · 1:00 to 2:15pm');
    expect(dinner!.subtitle).toBe('Close to home');
    service.setFilters({ day: 'Sunday' });
    expect(service.list()().sections[0]!.subtitle).toBe('Close to home');
  });

  it('narrows to one slot, switches day, and applies the toggles', async () => {
    await flushLoad();
    service.setFilters({ slot: 'Dinner' });
    let view = service.list()();
    expect(view.sections.map((s) => s.title)).toEqual(['Dinner']);
    expect(view.slotChips.map((c) => c.active)).toEqual([false, true]);
    expect(view.sections[0]!.picks.map((p) => p.id)).toEqual(['r4', 'r5']);

    service.setFilters({ slot: null, day: 'Sunday' });
    view = service.list()();
    expect(view.dayChips[1]!.active).toBe(true);
    expect(view.sections.map((s) => s.picks.length)).toEqual([1, 0]);

    service.setFilters({ day: 'Saturday', wifeApproved: true });
    expect(
      service
        .list()()
        .sections[0]!.picks.map((p) => p.id),
    ).toEqual(['r1', 'r2']);
    service.setFilters({ wifeApproved: false, quick: true });
    expect(
      service
        .list()()
        .sections[0]!.picks.map((p) => p.id),
    ).toEqual(['r1', 'r2', 'r3']);
    expect(
      service
        .list()()
        .sections[1]!.picks.map((p) => p.id),
    ).toEqual(['r4']);
  });

  it('locks a pick for the day and slot and dims its siblings', async () => {
    await flushLoad();
    const promise = service.lock('r2', 'Saturday', 'Lunch');
    const req = httpMock.expectOne(`${BASE}/api/restaurants/r2/lock`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ day: 'Saturday', slot: 'Lunch' });
    req.flush(SAT_LUNCH[1]);
    await promise;
    const lunch = service.list()().sections[0]!;
    expect(lunch.lockedId).toBe('r2');
    expect(lunch.picks.map((p) => p.id)).toEqual(['r2', 'r1', 'r3']);
    expect(lunch.picks[0]).toMatchObject({
      locked: true,
      lockedLabel: 'Locked for lunch',
      topPick: false,
      dimmed: false,
      votesDisabled: false,
    });
    expect(lunch.picks[1]).toMatchObject({
      locked: false,
      topPick: false,
      dimmed: true,
      votesDisabled: true,
    });
    expect(service.list()().sections[1]!.lockedId).toBeNull();
  });

  it('records a vote and reflects the server reply', async () => {
    await flushLoad();
    const promise = service.vote('r1', 'Mae', 'down');
    const req = httpMock.expectOne(`${BASE}/api/restaurants/r1/vote`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ voterName: 'Mae', vote: 'down' });
    req.flush(
      restaurant({
        votes: [
          { voterName: 'Quinn', vote: 'up' },
          { voterName: 'Sara', vote: 'up' },
          { voterName: 'Mae', vote: 'down' },
        ],
      }),
    );
    await promise;
    const card = service.list()().sections[0]!.picks[0]!;
    expect(card.votes.find((v) => v.name === 'Mae')?.vote).toBe('down');
    expect(card.meta).toBe('Mediterranean · Patio · 2 of 4 votes');
  });

  it('rejects a failed vote', async () => {
    await flushLoad();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const promise = service.vote('r1', 'Mae', 'up');
    promise.catch(() => undefined);
    httpMock
      .expectOne(`${BASE}/api/restaurants/r1/vote`)
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    await expect(promise).rejects.toBeTruthy();
    vi.restoreAllMocks();
  });

  it('treats a failed list as empty without losing the others', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpMock.expectOne(url(saturday, 'Lunch')).flush(null, { status: 500, statusText: 'Boom' });
    httpMock.expectOne(url(saturday, 'Dinner')).flush(SAT_DINNER);
    httpMock.expectOne(url(sunday, 'Lunch')).flush(SUN_LUNCH);
    httpMock.expectOne(url(sunday, 'Dinner')).flush(SUN_DINNER);
    await settle();
    expect(
      service
        .list()()
        .sections.map((s) => s.picks.length),
    ).toEqual([0, 2]);
    vi.restoreAllMocks();
  });
});
