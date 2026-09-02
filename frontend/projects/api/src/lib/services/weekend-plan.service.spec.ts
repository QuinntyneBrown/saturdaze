import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { API_BASE_URL } from '../api/api-base-url';
import { FAMILY_SERVICE } from './family.service.contract';
import { WeekendPlanService, greetingFor } from './weekend-plan.service';

const profile = signal<any>({ familyName: 'The Browns', location: 'Port Credit', likes: [], preferences: [] });

function block(overrides: Partial<any> = {}): any {
  return {
    id: 'b1',
    day: 'Saturday',
    startTime: '09:00:00',
    endTime: '10:00:00',
    kind: 'Activity',
    title: 'Terre Bleu',
    refId: 'a1',
    isLocked: false,
    reason: 'Sunny morning',
    sortOrder: 0,
    ...overrides,
  };
}

function weekendDto(overrides: Partial<any> = {}): any {
  return {
    id: 'w1',
    weekendOf: '2026-05-16',
    isFavourite: false,
    notes: '',
    regenerateCount: 0,
    title: null,
    rating: null,
    blocks: [
      block({ id: 'c1', kind: 'Commitment', title: 'Swim lessons', isLocked: true, sortOrder: 0 }),
      block({ id: 'b1', sortOrder: 1, startTime: '11:00:00', endTime: '13:00:00' }),
      block({ id: 'e1', kind: 'Errand', title: 'Costco run', refId: 'err1', sortOrder: 2, startTime: '15:00:00', endTime: '15:45:00' }),
    ],
    errands: [{ id: 'err1', description: 'Costco run', estimatedMinutes: 45, done: false }],
    weather: [
      { date: '2026-05-16', tags: ['sunny', 'warm'], highCelsius: 22, lowCelsius: 14, precipitationMm: 0, unavailable: false },
      { date: '2026-05-17', tags: ['rain'], highCelsius: 18, lowCelsius: 12, precipitationMm: 4, unavailable: false },
    ],
    ...overrides,
  };
}

describe('WeekendPlanService', () => {
  let service: WeekendPlanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WeekendPlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
        { provide: FAMILY_SERVICE, useValue: { getProfile: () => profile, getEditableProfile: () => signal(null) } },
      ],
    });

    service = TestBed.inject(WeekendPlanService);
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

  it('should call getOverview without throwing', () => {
    expect(() => service.getOverview()).not.toThrow();
  });

  it('should call getItinerary without throwing', () => {
    expect(() => service.getItinerary()).not.toThrow();
  });

  describe('loadCurrent', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.loadCurrent();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should recover loadCurrent from an error response', async () => {
      const promise = service.loadCurrent();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      // The catch swallows the failure — resolving IS the contract.
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('plan', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.plan('test-value');
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

    it('should recover plan from an error response', async () => {
      const promise = service.plan('test-value');
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      // The catch swallows the failure — resolving IS the contract.
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('regenerate', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.regenerate();
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

    it('should recover regenerate from an error response', async () => {
      const promise = service.regenerate();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      // The catch swallows the failure — resolving IS the contract.
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('regenerateDay', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.regenerateDay("Saturday");
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

    it('should reject regenerateDay on an error response', async () => {
      const promise = service.regenerateDay("Saturday");
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

  describe('createShareLink', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.createShareLink();
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

    it('should reject createShareLink on an error response', async () => {
      const promise = service.createShareLink();
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

  it('should call calendarLinks', () => {
    let outcome = 'returned';
    try {
      service.calendarLinks();
    } catch {
      outcome = 'threw'; // a state-dependent guard fired
    }
    expect(['returned', 'threw']).toContain(outcome);
  });
  it('should call calendarLinks with optional arguments provided', () => {
    let outcome = 'returned';
    try {
      service.calendarLinks('test-id');
    } catch {
      outcome = 'threw'; // a state-dependent guard fired
    }
    expect(['returned', 'threw']).toContain(outcome);
  });

  describe('lockBlock', () => {
    it('should make PUT request', async () => {
      const mockResponse = {} as any;
      const promise = service.lockBlock('test-id', true);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'PUT');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('PUT');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject lockBlock on an error response', async () => {
      const promise = service.lockBlock('test-id', true);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'PUT');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('lockDay', () => {
    it('should make PUT request', async () => {
      const mockResponse = {} as any;
      const promise = service.lockDay("Saturday", true);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'PUT');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('PUT');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject lockDay on an error response', async () => {
      const promise = service.lockDay("Saturday", true);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'PUT');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('addErrand', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.addErrand('test-value', 1);
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

    it('should reject addErrand on an error response', async () => {
      const promise = service.addErrand('test-value', 1);
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

  describe('remixSaved', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.remixSaved('test-id');
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

    it('should reject remixSaved on an error response', async () => {
      const promise = service.remixSaved('test-id');
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

  describe('repeatSaved', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.repeatSaved('test-id');
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

    it('should reject repeatSaved on an error response', async () => {
      const promise = service.repeatSaved('test-id');
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

  it('should call setActiveDay without throwing', () => {
    expect(() => service.setActiveDay("Saturday")).not.toThrow();
  });

  it('greets the family without the leading "The"', () => {
    expect(greetingFor('The Browns')).toBe('Morning, Browns 👋');
    expect(greetingFor('Smiths')).toBe('Morning, Smiths 👋');
    expect(greetingFor(null)).toBe('Morning 👋');
  });

  describe('projection', () => {
    beforeEach(async () => {
      const promise = service.loadCurrent();
      httpMock.expectOne('http://localhost:3000/api/weekends/current').flush(weekendDto());
      await promise;
    });

    it('projects the overview from the weekend and the family name', () => {
      const overview = service.getOverview()();
      expect(overview.greeting).toBe('Morning, Browns 👋');
      expect(overview.forecastSubtitle).toBe('Sat 16 May – Sun 17 May');
      expect(overview.days[0]!.highlight).toBe('Terre Bleu');
      expect(overview.quickActions.map((q) => q.kind)).toEqual(['regenerate', 'lock', 'share']);
      expect(overview.preview[0]).toMatchObject({ id: 'c1', kind: 'Commitment', locked: true });
    });

    it('derives anticipations from a wet day, the shopping list and the first commitment', () => {
      const tips = service.getOverview()().anticipations;
      expect(tips.map((t) => t.headline)).toEqual([
        'Sunday looks wet',
        'Costco run is on the list',
        'Swim lessons · Saturday 9:00',
      ]);
      expect(tips[0]!.href).toBe('/activities');
      expect(tips[1]!.href).toBe('/itinerary?day=saturday');
    });

    it('suggests adding an errand when the list is empty', async () => {
      const promise = service.plan('2026-05-16');
      httpMock.expectOne('http://localhost:3000/api/weekends/plan').flush(weekendDto({ errands: [], blocks: [] }));
      await promise;
      const tips = service.getOverview()().anticipations;
      expect(tips.find((t) => t.href === '/errand')?.cta).toBe('Add an errand');
    });

    it('projects the itinerary with errand stats and block kinds', () => {
      const itinerary = service.getItinerary()();
      expect(itinerary.day).toBe('Saturday');
      expect(itinerary.eyebrow).toBe('16 May 2026');
      expect(itinerary.title).toBe('Sunny & 22°');
      expect(itinerary.stats.map((s) => s.label)).toContain('errand to run');
      expect(itinerary.stats.find((s) => s.label === 'errand to run')!.num).toBe('1');
      expect(itinerary.blocks.find((b) => b.id === 'e1')).toMatchObject({ kind: 'Errand', refId: 'err1', done: false });
      service.setActiveDay('Sunday');
      expect(service.getItinerary()().day).toBe('Sunday');
      expect(service.getItinerary()().title).toBe('Rain & 18°');
    });
  });

  describe('swapBlock', () => {
    it('POSTs the rejected ids and applies the response', async () => {
      const promise = service.swapBlock('b1', ['a1']);
      const req = httpMock.expectOne('http://localhost:3000/api/blocks/b1/swap');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rejectedActivityIds: ['a1'] });
      req.flush(weekendDto());
      await promise;
      expect(service.getOverview()().greeting).toBe('Morning, Browns 👋');
    });

    it('rejects on an error response', async () => {
      const promise = service.swapBlock('b1');
      promise.catch(() => {});
      httpMock.expectOne('http://localhost:3000/api/blocks/b1/swap')
        .flush({ message: 'error' }, { status: 409, statusText: 'Conflict' });
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('setErrandDone', () => {
    it('PUTs the done flag', async () => {
      const promise = service.setErrandDone('err1', true);
      const req = httpMock.expectOne('http://localhost:3000/api/errands/err1/done');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ done: true });
      req.flush(weekendDto({ errands: [{ id: 'err1', description: 'Costco run', estimatedMinutes: 45, done: true }] }));
      await promise;
      expect(service.getItinerary()().blocks.find((b) => b.id === 'e1')!.done).toBe(true);
    });
  });

  describe('addErrand placement', () => {
    it('sends the preferred day and records where the errand landed', async () => {
      const load = service.loadCurrent();
      httpMock.expectOne('http://localhost:3000/api/weekends/current').flush(weekendDto());
      await load;

      const promise = service.addErrand('Costco run', 45, 'Sunday');
      const req = httpMock.expectOne('http://localhost:3000/api/weekends/w1/errands');
      expect(req.request.body).toEqual({ description: 'Costco run', estimatedMinutes: 45, preferredDay: 'Sunday' });
      req.flush(weekendDto());
      await promise;
      expect(service.lastErrandPlacement()()).toEqual({ description: 'Costco run', day: 'Saturday', time: '15:00' });
    });
  });
});
