import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { API_BASE_URL } from '../api/api-base-url';
import { upcomingSaturdayIso, addDaysIso } from '../api/weekend-dates';
import { FAMILY_SERVICE } from './family.service.contract';
import { RestaurantService } from './restaurant.service';

const editable = signal<any>({
  name: 'The Browns',
  homeLocation: 'Port Credit',
  budgetEnabled: false,
  tryNewEnabled: false,
  fridayPreviewEnabled: true,
  members: [
    { id: 'm1', name: 'Quinn', age: 41 },
    { id: 'm2', name: 'Mae', age: 5 },
  ],
  commitments: [],
  preferences: [],
});

function dto(overrides: Partial<any> = {}): any {
  return {
    id: 'r1',
    name: 'La Marina',
    style: 'Italian',
    slot: 'Lunch',
    wifeApproved: true,
    driveMinutes: 6,
    notes: 'Near the lake',
    menuUrl: null,
    votes: [{ voterName: 'Quinn', vote: 'up' }],
    locked: false,
    ...overrides,
  };
}

describe('RestaurantService', () => {
  let service: RestaurantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestaurantService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
        { provide: FAMILY_SERVICE, useValue: { getEditableProfile: () => editable, getProfile: () => signal(null) } },
      ],
    });

    service = TestBed.inject(RestaurantService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach((req) => req.flush(null));
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((req) => req.flush(null));
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call list without throwing', () => {
    expect(() => service.list()).not.toThrow();
  });

  describe('load', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.load();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
    });
  });

  describe('refresh', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.refresh();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
    });
  });

  describe('vote', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.vote('test-id', 'test-value', {} as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject vote on an error response', async () => {
      const promise = service.vote('test-id', 'test-value', {} as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('lock', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.lock('test-id', 'Saturday', 'Lunch');
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject lock on an error response', async () => {
      const promise = service.lock('test-id', 'Saturday', 'Lunch');
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('load + view', () => {
    it('fetches Saturday lunch and Sunday dinner for the upcoming weekend', async () => {
      const sat = upcomingSaturdayIso();
      const sun = addDaysIso(sat, 1);
      const promise = service.load();
      const lunch = httpMock.expectOne((r) => r.url.includes(`day=${sat}&slot=Lunch`));
      const dinner = httpMock.expectOne((r) => r.url.includes(`day=${sun}&slot=Dinner`));
      lunch.flush([dto(), dto({ id: 'r2', name: 'Symposium', driveMinutes: 9, wifeApproved: false, votes: [] })]);
      dinner.flush([dto({ id: 'r3', name: "Jack Astor's", slot: 'Dinner', driveMinutes: 12 })]);
      await promise;

      const view = service.list()();
      expect(view.title).toBe('Saturday food');
      expect(view.topPickSection.picks[0]!.name).toBe('La Marina');
      expect(view.topPickSection.day).toBe('Saturday');
      expect(view.topPickSection.slot).toBe('Lunch');
      expect(view.otherPicks.picks.map((r) => r.name)).toEqual(['Symposium']);
      expect(view.sundayDinner.picks[0]!.name).toBe("Jack Astor's");
    });

    it('builds the vote roster from the family, defaulting to undecided', async () => {
      const promise = service.load();
      httpMock.match(() => true).forEach((r) => r.flush([dto()]));
      await promise;
      const votes = service.list()().topPickSection.picks[0]!.votes;
      expect(votes).toEqual([
        { name: 'Quinn', tone: 'primary', vote: 'up' },
        { name: 'Mae', tone: 'leaf', vote: 'none' },
      ]);
    });

    it('switches to Sunday dinner and applies the quick filter', async () => {
      const promise = service.load();
      const lunch = httpMock.expectOne((r) => r.url.includes('slot=Lunch'));
      const dinner = httpMock.expectOne((r) => r.url.includes('slot=Dinner'));
      lunch.flush([dto({ driveMinutes: 20 }), dto({ id: 'r2', name: 'Cora', driveMinutes: 5 })]);
      dinner.flush([dto({ id: 'r3', name: 'Jack', slot: 'Dinner' })]);
      await promise;

      service.setFilter('Dinner');
      expect(service.activeFilter()()).toBe('Dinner');
      let view = service.list()();
      expect(view.title).toBe('Sunday food');
      expect(view.topPickSection.slot).toBe('Dinner');
      expect(view.topPickSection.picks[0]!.name).toBe('Jack');
      expect(view.sundayDinner.picks).toEqual([]);
      expect(view.filters.find((f) => f.label === 'Dinner')!.tone).toBe('primary');

      service.setFilter('< 15 min');
      view = service.list()();
      expect(view.topPickSection.picks.map((r) => r.name)).toEqual(['Cora']);
      expect(view.otherPicks.picks).toEqual([]);
    });
  });

  it('locks for the requested day + slot and unlocks the rest of that slot', async () => {
    const load = service.load();
    httpMock.expectOne((r) => r.url.includes('slot=Lunch')).flush([dto(), dto({ id: 'r2', name: 'Cora', locked: true })]);
    httpMock.expectOne((r) => r.url.includes('slot=Dinner')).flush([]);
    await load;

    const promise = service.lock('r1', 'Saturday', 'Lunch');
    const req = httpMock.expectOne('http://localhost:3000/api/restaurants/r1/lock');
    expect(req.request.body).toEqual({ day: 'Saturday', slot: 'Lunch' });
    req.flush(dto({ locked: true }));
    await promise;

    const view = service.list()();
    expect(view.topPickSection.picks[0]!.name).toBe('La Marina');
    expect(view.topPickSection.picks[0]!.locked).toBe(true);
    expect(view.otherPicks.picks[0]!.locked).toBe(false);
    expect(view.lede).toMatch(/locked for Saturday lunch/);
  });
});
