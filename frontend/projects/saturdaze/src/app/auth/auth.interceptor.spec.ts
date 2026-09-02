import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthToken, SESSION_STORE } from 'api';
import { authInterceptor } from './auth.interceptor';

/** Let queued promise callbacks (the refresh → retry hop) run. */
const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function tokenExpiringIn(ms: number, value = 'access-1'): AuthToken {
  return { value, expiresUtc: new Date(Date.now() + ms).toISOString(), refreshToken: 'refresh-1' };
}

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let session: {
    token: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    refreshSession: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    session = {
      token: vi.fn(() => tokenExpiringIn(15 * 60_000)),
      loading: vi.fn(() => false),
      refreshSession: vi.fn(() => Promise.resolve(false)),
      logout: vi.fn(() => Promise.resolve()),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: session },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigateSpy = vi.fn(() => Promise.resolve(true));
    router.navigateByUrl = navigateSpy as unknown as Router['navigateByUrl'];
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((req) => req.flush(null));
    httpMock.verify();
  });

  it('attaches the Authorization header when a token is present', () => {
    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush({});
  });

  it('sends no bearer to token-minting endpoints', () => {
    for (const url of ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/resend-verification']) {
      httpClient.post(url, {}).subscribe();
      const req = httpMock.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
  });

  it('sends no bearer when the session has no token', () => {
    session.token = vi.fn(() => null);
    httpClient.get('/api/data').subscribe();
    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('retries once with the rotated bearer after a 401 when the refresh succeeds', async () => {
    let current = tokenExpiringIn(15 * 60_000, 'access-1');
    session.token = vi.fn(() => current);
    session.refreshSession = vi.fn(() => {
      current = tokenExpiringIn(15 * 60_000, 'access-2');
      return Promise.resolve(true);
    });

    const results: unknown[] = [];
    httpClient.get('/api/data').subscribe({ next: (r) => results.push(r) });

    const first = httpMock.expectOne('/api/data');
    expect(first.request.headers.get('Authorization')).toBe('Bearer access-1');
    first.flush(null, { status: 401, statusText: 'Unauthorized' });
    await flushPromises();

    const second = httpMock.expectOne('/api/data');
    expect(second.request.headers.get('Authorization')).toBe('Bearer access-2');
    second.flush({ ok: true });
    await flushPromises();

    expect(session.refreshSession).toHaveBeenCalledTimes(1);
    expect(results).toEqual([{ ok: true }]);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not retry and bounces to /sign-in when the refresh fails', async () => {
    session.refreshSession = vi.fn(() => Promise.resolve(false));
    let error: unknown;
    httpClient.get('/api/data').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    await flushPromises();

    httpMock.expectNone('/api/data');
    expect(error).toBeTruthy();
    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(String(navigateSpy.mock.calls[0]?.[0])).toMatch(/^\/sign-in\?returnUrl=/);
  });

  it('does not navigate while the session is still rehydrating', async () => {
    session.loading = vi.fn(() => true);
    httpClient.get('/api/auth/me').subscribe({ error: () => {} });

    httpMock.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await flushPromises();

    expect(session.refreshSession).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('never refreshes on a 401 from the refresh or logout endpoints', async () => {
    for (const url of ['/api/auth/refresh', '/api/auth/logout']) {
      let error: unknown;
      httpClient.post(url, {}).subscribe({ error: (e) => (error = e) });
      httpMock.expectOne(url).flush(null, { status: 401, statusText: 'Unauthorized' });
      await flushPromises();
      expect(error).toBeTruthy();
    }
    expect(session.refreshSession).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('gives up after the retried request also returns 401', async () => {
    session.refreshSession = vi.fn(() => Promise.resolve(true));
    let error: unknown;
    httpClient.get('/api/data').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    await flushPromises();
    httpMock.expectOne('/api/data').flush(null, { status: 401, statusText: 'Unauthorized' });
    await flushPromises();

    httpMock.expectNone('/api/data');
    expect(session.refreshSession).toHaveBeenCalledTimes(1);
    expect(error).toBeTruthy();
  });

  it('refreshes proactively when the token is inside the skew window', async () => {
    session.token = vi.fn(() => tokenExpiringIn(10_000));
    session.refreshSession = vi.fn(() => Promise.resolve(true));

    httpClient.get('/api/data').subscribe();
    await flushPromises();

    expect(session.refreshSession).toHaveBeenCalledTimes(1);
    httpMock.expectOne('/api/data').flush({});
  });

  it('passes non-401 errors through without refreshing', async () => {
    let error: unknown;
    httpClient.get('/api/data').subscribe({ error: (e) => (error = e) });
    httpMock.expectOne('/api/data').flush(null, { status: 500, statusText: 'Error' });
    await flushPromises();

    expect(error).toBeTruthy();
    expect(session.refreshSession).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
