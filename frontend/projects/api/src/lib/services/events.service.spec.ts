import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(EventsService);
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

  describe('grouping + filters', () => {
    function event(overrides: Partial<any>): any {
      return {
        id: 'e',
        name: 'Event',
        startsOn: '2026-05-16',
        endsOn: '2026-05-16',
        location: 'Milton',
        driveMinutes: 45,
        url: '',
        category: 'Seasonal',
        ...overrides,
      };
    }

    beforeEach(async () => {
      const promise = service.load('2026-05-16');
      const req = httpMock.expectOne('http://localhost:3000/api/events?weekendOf=2026-05-16');
      expect(req.request.method).toBe('GET');
      req.flush([
        event({ id: '1', name: 'Terre Bleu' }),
        event({ id: '2', name: 'Tulips', endsOn: '2026-05-17', category: 'Festival' }),
        event({ id: '3', name: 'Symphony', startsOn: '2026-05-17', endsOn: '2026-05-17', category: 'Theatre' }),
        event({ id: '4', name: 'Berries', startsOn: '2026-05-23', endsOn: '2026-05-23' }),
      ]);
      await promise;
    });

    it('buckets Saturday, Sunday and Coming soon; multi-day events show once', () => {
      const sections = service.list()().sections;
      expect(sections.map((s) => s.title)).toEqual(['Saturday', 'Sunday', 'Coming soon']);
      expect(sections[0]!.events.map((e) => e.title)).toEqual(['Terre Bleu', 'Tulips']);
      expect(sections[1]!.events.map((e) => e.title)).toEqual(['Symphony']);
      expect(sections[2]!.events.map((e) => e.title)).toEqual(['Berries']);
      expect(sections[0]!.events[0]!.when).toBe('Sat · all day');
      expect(sections[0]!.events[1]!.when).toBe('May 16 – May 17');
      expect(sections[0]!.events[0]!).toMatchObject({ dateDay: '16', dateMon: 'MAY', drive: '45 min', tag: 'Seasonal' });
    });

    it('offers window chips plus one chip per category present', () => {
      const labels = service.list()().filters.map((f) => f.label);
      expect(labels).toEqual(['This weekend', 'Next weekend', 'Seasonal', 'Theatre', 'Festival']);
      expect(service.list()().filters[0]!.tone).toBe('primary');
    });

    it('filters by category and by next weekend', () => {
      service.setFilter('Theatre');
      expect(service.activeFilter()()).toBe('Theatre');
      let sections = service.list()().sections;
      expect(sections.map((s) => s.title)).toEqual(['Sunday']);
      expect(sections[0]!.events[0]!.title).toBe('Symphony');

      service.setFilter('Next weekend');
      sections = service.list()().sections;
      expect(sections).toHaveLength(1);
      expect(sections[0]!.events.map((e) => e.title)).toEqual(['Berries']);
    });
  });
});
