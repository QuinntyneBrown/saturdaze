import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { weekendDto } from '../testing/weekend-fixture';
import { SharedWeekendService } from './shared-weekend.service';

const BASE = 'http://localhost:3000';

describe('SharedWeekendService', () => {
  let service: SharedWeekendService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SharedWeekendService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(SharedWeekendService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('resolves the token into the same view the weekend page renders', async () => {
    const promise = service.load('abc/123');
    const req = httpMock.expectOne(`${BASE}/api/weekends/shared/abc%2F123`);
    expect(req.request.method).toBe('GET');
    req.flush(weekendDto());
    const view = await promise;
    expect(view.status).toBe('ready');
    expect(view.id).toBe('w1');
    expect(view.headline).toBe('This weekend');
    expect(view.subtitle).toBe(
      'Sunny Saturday for Lavender fields, a cloudy Sunday for The Rec Room.',
    );
    expect(view.days.map((d) => d.blocks.length)).toEqual([5, 3]);
    expect(view.days[0]!.blocks[0]).toMatchObject({ title: 'Swim lessons', commitment: true });
  });

  it('stays ready even for a shared weekend with no blocks', async () => {
    const promise = service.load('empty');
    httpMock.expectOne(`${BASE}/api/weekends/shared/empty`).flush(weekendDto({ blocks: [] }));
    const view = await promise;
    expect(view.status).toBe('ready');
    expect(view.days).toHaveLength(2);
  });

  it('rejects when the link is invalid', async () => {
    const promise = service.load('gone');
    promise.catch(() => undefined);
    httpMock
      .expectOne(`${BASE}/api/weekends/shared/gone`)
      .flush(null, { status: 404, statusText: 'Not Found' });
    await expect(promise).rejects.toBeTruthy();
  });
});
