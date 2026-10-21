import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { CalendarService } from './calendar.service';

const BASE = 'http://localhost:3000';

describe('CalendarService', () => {
  let service: CalendarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(CalendarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('reads the settings from GET /api/calendar', async () => {
    const promise = service.settings();
    const req = httpMock.expectOne(`${BASE}/api/calendar`);
    expect(req.request.method).toBe('GET');
    req.flush({
      googleConfigured: false,
      feed: { active: true, createdUtc: '2026-10-20T00:00:00Z' },
    });
    expect((await promise).feed.active).toBe(true);
  });

  it('creates the link with POST and stops it with DELETE', async () => {
    const created = service.createFeed();
    const post = httpMock.expectOne(`${BASE}/api/calendar/feed`);
    expect(post.request.method).toBe('POST');
    post.flush({ url: 'https://api/x.ics', webcalUrl: 'webcal://api/x.ics', createdUtc: 'now' });
    expect((await created).webcalUrl).toBe('webcal://api/x.ics');

    const stopped = service.stopFeed();
    const del = httpMock.expectOne(`${BASE}/api/calendar/feed`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await stopped;
  });

  it('authorizes, connects, updates and disconnects Google', async () => {
    const url = service.authorizeGoogle();
    const authorize = httpMock.expectOne(`${BASE}/api/calendar/google/authorize`);
    expect(authorize.request.method).toBe('POST');
    authorize.flush({ authorizationUrl: 'https://accounts.google.com/x' });
    expect(await url).toBe('https://accounts.google.com/x');

    const settings = {
      googleConfigured: true,
      google: null,
      feed: { active: false, createdUtc: null },
    };
    const connected = service.connectGoogle('c', 's');
    const connect = httpMock.expectOne(`${BASE}/api/calendar/google/connect`);
    expect(connect.request.body).toEqual({ code: 'c', state: 's' });
    connect.flush(settings);
    await connected;

    const updated = service.updateGoogle(false);
    const put = httpMock.expectOne(`${BASE}/api/calendar/google`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ readCommitments: false });
    put.flush(settings);
    await updated;

    const gone = service.disconnectGoogle();
    const del = httpMock.expectOne(`${BASE}/api/calendar/google`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await gone;
  });
});
