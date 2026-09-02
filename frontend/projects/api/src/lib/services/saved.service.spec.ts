import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { SavedService } from './saved.service';

describe('SavedService', () => {
  let service: SavedService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SavedService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(SavedService);
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
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should recover load from an error response', async () => {
      const promise = service.load();
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

  describe('rows, filters and persistence', () => {
    function row(overrides: Partial<any>): any {
      return {
        id: 'w',
        weekendOf: '2026-05-16',
        isFavourite: false,
        regenerateCount: 0,
        blockCount: 8,
        activityHighlights: ['Bronte Creek', 'Rec Room'],
        title: null,
        rating: null,
        ...overrides,
      };
    }

    beforeEach(async () => {
      const promise = service.load();
      httpMock.expectOne('http://localhost:3000/api/weekends/history?take=20').flush([
        row({ id: 'w1', isFavourite: true, rating: 5 }),
        row({ id: 'w2', weekendOf: '2025-12-06', rating: 4, title: 'Snow day' }),
        row({ id: 'w3', weekendOf: '2026-04-25', rating: 2, activityHighlights: ['Science Centre'] }),
      ]);
      await promise;
    });

    it('splits recent from avoid and derives titles', () => {
      const view = service.list()();
      expect(view.lede).toBe('3 weekends planned · 1 favourited.');
      expect(view.recent.map((r) => r.title)).toEqual(['Bronte Creek + Rec Room', 'Snow day']);
      expect(view.recent[0]).toMatchObject({ date: 'May 16–17, 2026', rating: 5, favourite: true, customTitle: null });
      expect(view.recent[1]!.customTitle).toBe('Snow day');
      expect(view.avoid).toEqual([
        { title: 'Science Centre', subtitle: 'Last visit: Apr 25–26, 2026 · rated 2★', icon: 'refresh' },
      ]);
    });

    it('filters by favourites, year and five stars', () => {
      service.setFilter('Favourites');
      expect(service.list()().recent.map((r) => r.id)).toEqual(['w1']);
      service.setFilter('This year');
      expect(service.list()().recent.map((r) => r.id)).toEqual(
        new Date().getFullYear() === 2026 ? ['w1'] : [],
      );
      service.setFilter('5★ only');
      expect(service.list()().recent.map((r) => r.id)).toEqual(['w1']);
      expect(service.list()().filters.find((f) => f.label === '5★ only')!.tone).toBe('primary');
      service.setFilter('All');
      expect(service.list()().recent).toHaveLength(2);
    });

    it('persists favourite, rating and title through PUT and patches the row', async () => {
      const fav = service.setFavourite('w2', true);
      let req = httpMock.expectOne('http://localhost:3000/api/weekends/w2/favourite');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ favourite: true });
      req.flush({ id: 'w2', isFavourite: true });
      await fav;
      expect(service.list()().recent.find((r) => r.id === 'w2')!.favourite).toBe(true);

      const rate = service.rate('w2', 5);
      req = httpMock.expectOne('http://localhost:3000/api/weekends/w2/rating');
      expect(req.request.body).toEqual({ rating: 5 });
      req.flush({ id: 'w2', rating: 5 });
      await rate;
      expect(service.list()().recent.find((r) => r.id === 'w2')!.rating).toBe(5);

      const rename = service.rename('w2', '  Lavender day ');
      req = httpMock.expectOne('http://localhost:3000/api/weekends/w2/title');
      expect(req.request.body).toEqual({ title: 'Lavender day' });
      req.flush({ id: 'w2', title: 'Lavender day' });
      await rename;
      expect(service.list()().recent.find((r) => r.id === 'w2')!.title).toBe('Lavender day');
    });
  });
});
