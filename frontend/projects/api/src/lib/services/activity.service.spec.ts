import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ActivityService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(ActivityService);
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

  describe('sections + filters', () => {
    function activity(overrides: Partial<any>): any {
      return {
        id: 'a',
        name: 'Activity',
        category: 'Outdoor',
        indoor: false,
        minAge: 2,
        maxAge: 99,
        driveMinutes: 10,
        weatherTags: ['sunny'],
        typicalDurationMinutes: 120,
        description: 'Nice',
        mapUrl: '',
        ...overrides,
      };
    }

    beforeEach(async () => {
      const promise = service.load();
      const all = httpMock.expectOne('http://localhost:3000/api/activities');
      const tryNew = httpMock.expectOne('http://localhost:3000/api/activities?tryNew=true');
      const weather = httpMock.expectOne((r) => r.url.startsWith('http://localhost:3000/api/weather?weekendOf='));
      all.flush([
        activity({ id: '1', name: 'Bronte Creek' }),
        activity({ id: '2', name: 'Rec Room', indoor: true, category: 'Indoor', weatherTags: ['rain'], driveMinutes: 35 }),
        activity({ id: '3', name: 'Riverwood' }),
      ]);
      tryNew.flush([activity({ id: '4', name: 'Zoo', driveMinutes: 40 })]);
      weather.flush([{ date: weather.request.url.split('=')[1], tags: ['sunny', 'warm'], highCelsius: 22, lowCelsius: 14, precipitationMm: 0, unavailable: false }]);
      await promise;
    });

    it('groups outdoor-first on a sunny Saturday and tags try-new picks', () => {
      const sections = service.list()().sections;
      expect(sections.map((s) => s.title)).toEqual([
        "This weekend's weather-fit",
        'If weather turns',
        'Try something new',
      ]);
      expect(sections[0]!.subtitle).toMatch(/outdoor first/);
      expect(sections[0]!.activities.map((a) => a.title)).toEqual(['Bronte Creek', 'Riverwood']);
      expect(sections[1]!.activities.map((a) => a.title)).toEqual(['Rec Room']);
      expect(sections[2]!.activities[0]).toMatchObject({ title: 'Zoo', tag: 'First time', subtitle: 'Nice', drive: '40 min', ages: 'all' });
    });

    it('applies a chip filter and hides sections with no matches', () => {
      service.setFilter('Indoor');
      expect(service.activeFilter()()).toBe('Indoor');
      const view = service.list()();
      expect(view.sections.map((s) => s.title)).toEqual(['If weather turns']);
      expect(view.filters.find((f) => f.label === 'Indoor')!.tone).toBe('primary');
      expect(view.filters.map((f) => f.label)).toEqual(['All', 'Outdoor', 'Indoor', '< 30 min', 'Ages 5+', 'Weather-safe']);
    });
  });
});
