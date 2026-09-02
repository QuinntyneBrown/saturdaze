import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { AuthError } from '../models/auth-error';
import { AuthService } from './auth.service';

const BASE = 'http://localhost:3000';

const SUCCESS = {
  token: {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    accessTokenExpiresAtUtc: '2026-09-02T12:00:00Z',
    tokenType: 'Bearer',
  },
  user: { id: 'u1', email: 'quinn@example.com', role: 'User', emailVerifiedUtc: null },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signUp', () => {
    it('POSTs /api/auth/register and maps the token pair', async () => {
      const promise = service.signUp({ familyName: 'Browns', homeLocation: 'Port Credit', email: 'quinn@example.com', password: 'pw', fridayPreview: true });
      const req = httpMock.expectOne(`${BASE}/api/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(SUCCESS);

      const result = await promise;
      expect(result.token).toEqual({ value: 'access-1', expiresUtc: '2026-09-02T12:00:00Z', refreshToken: 'refresh-1' });
      expect(result.user).toEqual(SUCCESS.user);
    });

    it('rethrows the backend AuthError body', async () => {
      const promise = service.signUp({ familyName: 'Browns', homeLocation: 'Port Credit', email: 'quinn@example.com', password: 'pw', fridayPreview: true });
      httpMock.expectOne(`${BASE}/api/auth/register`).flush(
        { code: 'email_in_use', message: 'taken' },
        { status: 409, statusText: 'Conflict' },
      );
      await expect(promise).rejects.toEqual({ code: 'email_in_use', message: 'taken' });
    });
  });

  describe('login', () => {
    it('POSTs /api/auth/login and maps the token pair', async () => {
      const promise = service.login({ email: 'quinn@example.com', password: 'pw' });
      const req = httpMock.expectOne(`${BASE}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(SUCCESS);

      const result = await promise;
      expect(result.token.refreshToken).toBe('refresh-1');
      expect(result.user).toEqual(SUCCESS.user);
    });

    it('falls back to invalid_credentials when the body carries no code', async () => {
      const promise = service.login({ email: 'quinn@example.com', password: 'pw' });
      httpMock.expectOne(`${BASE}/api/auth/login`).flush(null, { status: 500, statusText: 'Server Error' });
      await expect(promise).rejects.toMatchObject({ code: 'invalid_credentials' } satisfies Partial<AuthError>);
    });
  });

  describe('refresh', () => {
    it('POSTs /api/auth/refresh with the refresh token and maps the new pair', async () => {
      const promise = service.refresh({ refreshToken: 'refresh-1' });
      const req = httpMock.expectOne(`${BASE}/api/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'refresh-1' });
      req.flush({ ...SUCCESS, token: { ...SUCCESS.token, accessToken: 'access-2', refreshToken: 'refresh-2' } });

      const result = await promise;
      expect(result.token).toEqual({ value: 'access-2', expiresUtc: '2026-09-02T12:00:00Z', refreshToken: 'refresh-2' });
      expect(result.user).toEqual(SUCCESS.user);
    });

    it('maps any 401 onto token_expired', async () => {
      const promise = service.refresh({ refreshToken: 'stale' });
      httpMock.expectOne(`${BASE}/api/auth/refresh`).flush(
        { code: 'refresh_token_revoked', message: 'Refresh token has been revoked.' },
        { status: 401, statusText: 'Unauthorized' },
      );
      await expect(promise).rejects.toMatchObject({ code: 'token_expired' });
    });

    it('keeps other failures on the generic path', async () => {
      const promise = service.refresh({ refreshToken: 'stale' });
      httpMock.expectOne(`${BASE}/api/auth/refresh`).flush(null, { status: 503, statusText: 'Unavailable' });
      await expect(promise).rejects.toMatchObject({ code: 'invalid_credentials' });
    });
  });

  describe('logout', () => {
    it('POSTs /api/auth/logout with the refresh token', async () => {
      const promise = service.logout({ refreshToken: 'refresh-1' });
      const req = httpMock.expectOne(`${BASE}/api/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'refresh-1' });
      req.flush(null, { status: 204, statusText: 'No Content' });
      await expect(promise).resolves.toBeUndefined();
    });

    it('rejects with an AuthError on transport failure', async () => {
      const promise = service.logout({ refreshToken: 'refresh-1' });
      httpMock.expectOne(`${BASE}/api/auth/logout`).flush(null, { status: 500, statusText: 'Server Error' });
      await expect(promise).rejects.toMatchObject({ code: 'invalid_credentials' });
    });
  });

  describe.each([
    ['forgotPassword', '/api/auth/forgot-password', () => service.forgotPassword({ email: 'quinn@example.com' })],
    ['resendVerification', '/api/auth/resend-verification', () => service.resendVerification({ email: 'quinn@example.com' })],
    ['resetPassword', '/api/auth/reset-password', () => service.resetPassword({ token: 't', password: 'p' })],
    ['verifyEmail', '/api/auth/verify-email', () => service.verifyEmail({ token: 't' })],
  ] as const)('%s', (_name, path, call) => {
    it(`POSTs ${path}`, async () => {
      const promise = call();
      const req = httpMock.expectOne(`${BASE}${path}`);
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 202, statusText: 'Accepted' });
      await expect(promise).resolves.toBeUndefined();
    });

    it('rejects on an error response', async () => {
      const promise = call();
      httpMock.expectOne(`${BASE}${path}`).flush({ code: 'token_invalid', message: 'bad' }, { status: 400, statusText: 'Bad Request' });
      await expect(promise).rejects.toEqual({ code: 'token_invalid', message: 'bad' });
    });
  });

  describe('me', () => {
    it('GETs /api/auth/me', async () => {
      const promise = service.me();
      const req = httpMock.expectOne(`${BASE}/api/auth/me`);
      expect(req.request.method).toBe('GET');
      req.flush(SUCCESS.user);
      await expect(promise).resolves.toEqual(SUCCESS.user);
    });

    it('rejects on an error response', async () => {
      const promise = service.me();
      httpMock.expectOne(`${BASE}/api/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
      await expect(promise).rejects.toMatchObject({ code: 'invalid_credentials' });
    });
  });
});
