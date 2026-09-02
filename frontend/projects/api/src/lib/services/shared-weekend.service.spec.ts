import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { SharedWeekendService } from './shared-weekend.service';

describe('SharedWeekendService', () => {
  let service: SharedWeekendService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SharedWeekendService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });
    service = TestBed.inject(SharedWeekendService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs the shared weekend by encoded token and maps the block subset', async () => {
    const promise = service.load('abc def');
    const req = httpMock.expectOne('http://localhost:3000/api/weekends/shared/abc%20def');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'w1',
      weekendOf: '2026-05-16',
      isFavourite: false,
      notes: '',
      regenerateCount: 0,
      title: null,
      rating: null,
      errands: [],
      weather: [],
      blocks: [
        { id: 'b1', day: 'Saturday', startTime: '09:00:00', endTime: '10:00:00', kind: 'Commitment', title: 'Swim', refId: null, isLocked: true, reason: 'r', sortOrder: 0 },
      ],
    });
    const weekend = await promise;
    expect(weekend.weekendOf).toBe('2026-05-16');
    expect(weekend.blocks).toEqual([
      { day: 'Saturday', kind: 'Commitment', title: 'Swim', isLocked: true, startTime: '09:00:00' },
    ]);
  });

  it('rejects when the link is invalid', async () => {
    const promise = service.load('bad');
    httpMock.expectOne('http://localhost:3000/api/weekends/shared/bad')
      .flush({ title: 'Not found' }, { status: 404, statusText: 'Not Found' });
    await expect(promise).rejects.toBeTruthy();
  });
});
