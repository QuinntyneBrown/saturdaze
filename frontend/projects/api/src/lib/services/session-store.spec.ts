import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthToken } from '../models/auth-token';
import { User } from '../models/user';
import { AUTH_SERVICE } from './auth.service.contract';
import { SessionStore } from './session-store';

const TOKEN_KEY = 'sd.auth.token';
const STORAGE_FLAG_KEY = 'sd.auth.storage';

const USER: User = { id: 'u1', email: 'quinn@example.com', role: 'User', emailVerifiedUtc: null };

function tokenExpiringIn(ms: number, value = 'access-1', refreshToken = 'refresh-1'): AuthToken {
  return { value, expiresUtc: new Date(Date.now() + ms).toISOString(), refreshToken };
}

function persist(store: Storage, token: AuthToken, tier: 'local' | 'session'): void {
  store.setItem(TOKEN_KEY, JSON.stringify(token));
  store.setItem(STORAGE_FLAG_KEY, tier);
}

function storedToken(store: Storage): AuthToken | null {
  const raw = store.getItem(TOKEN_KEY);
  return raw ? (JSON.parse(raw) as AuthToken) : null;
}

describe('SessionStore', () => {
  let service: SessionStore;
  let auth: {
    signUp: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    forgotPassword: ReturnType<typeof vi.fn>;
    resendVerification: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
    verifyEmail: ReturnType<typeof vi.fn>;
    me: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    auth = {
      signUp: vi.fn(() => Promise.resolve({ token: tokenExpiringIn(900_000), user: USER })),
      login: vi.fn(() => Promise.resolve({ token: tokenExpiringIn(900_000), user: USER })),
      refresh: vi.fn(() => Promise.resolve({ token: tokenExpiringIn(900_000, 'access-2', 'refresh-2'), user: USER })),
      logout: vi.fn(() => Promise.resolve(undefined)),
      forgotPassword: vi.fn(() => Promise.resolve(undefined)),
      resendVerification: vi.fn(() => Promise.resolve(undefined)),
      resetPassword: vi.fn(() => Promise.resolve(undefined)),
      verifyEmail: vi.fn(() => Promise.resolve(undefined)),
      me: vi.fn(() => Promise.resolve(USER)),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        { provide: AUTH_SERVICE, useValue: auth },
      ],
    });

    service = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('login / signUp', () => {
    it('persists the full token pair to localStorage when remember is true', async () => {
      await service.login({ email: 'quinn@example.com', password: 'pw' }, true);
      const stored = storedToken(localStorage);
      expect(stored?.value).toBe('access-1');
      expect(stored?.refreshToken).toBe('refresh-1');
      expect(localStorage.getItem(STORAGE_FLAG_KEY)).toBe('local');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.user()).toEqual(USER);
      expect(service.rememberedEmail()).toBe('quinn@example.com');
    });

    it('persists to sessionStorage when remember is false', async () => {
      await service.login({ email: 'quinn@example.com', password: 'pw' }, false);
      expect(storedToken(sessionStorage)?.refreshToken).toBe('refresh-1');
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('signUp always remembers', async () => {
      await service.signUp({ familyName: 'Browns', homeLocation: 'Port Credit', email: 'quinn@example.com', password: 'pw', fridayPreview: true });
      expect(storedToken(localStorage)?.value).toBe('access-1');
    });

    it('maps a failed login onto the error signal and rethrows', async () => {
      auth.login = vi.fn(() => Promise.reject({ code: 'invalid_credentials', message: 'nope' }));
      await expect(service.login({ email: 'x', password: 'y' }, true)).rejects.toEqual({ code: 'invalid_credentials', message: 'nope' });
      expect(service.error()?.code).toBe('invalid_credentials');
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshSession', () => {
    beforeEach(async () => {
      await service.login({ email: 'quinn@example.com', password: 'pw' }, true);
    });

    it('updates token + user and re-persists to the same tier', async () => {
      await expect(service.refreshSession()).resolves.toBe(true);
      expect(auth.refresh).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
      expect(service.token()?.value).toBe('access-2');
      expect(storedToken(localStorage)?.refreshToken).toBe('refresh-2');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('re-persists to sessionStorage when the pair lived there', async () => {
      await service.login({ email: 'quinn@example.com', password: 'pw' }, false);
      await service.refreshSession();
      expect(storedToken(sessionStorage)?.value).toBe('access-2');
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('clears both storages and the signals when the exchange fails', async () => {
      auth.refresh = vi.fn(() => Promise.reject({ code: 'token_expired', message: 'expired' }));
      await expect(service.refreshSession()).resolves.toBe(false);
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.token()).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('shares one exchange between concurrent callers', async () => {
      const [a, b] = await Promise.all([service.refreshSession(), service.refreshSession()]);
      expect(a).toBe(true);
      expect(b).toBe(true);
      expect(auth.refresh).toHaveBeenCalledTimes(1);
    });

    it('adopts a newer pair another tab persisted instead of refreshing', async () => {
      persist(localStorage, tokenExpiringIn(900_000, 'access-other-tab', 'refresh-other-tab'), 'local');
      await expect(service.refreshSession()).resolves.toBe(true);
      expect(auth.refresh).not.toHaveBeenCalled();
      expect(service.token()?.value).toBe('access-other-tab');
    });

    it('ends the session when there is no refresh token to present', async () => {
      persist(localStorage, tokenExpiringIn(900_000, 'access-1', ''), 'local');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [SessionStore, { provide: AUTH_SERVICE, useValue: auth }] });
      const fresh = TestBed.inject(SessionStore);
      await fresh.rehydrate();
      await expect(fresh.refreshSession()).resolves.toBe(false);
      expect(auth.refresh).not.toHaveBeenCalled();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('rehydrate', () => {
    it('finishes loading with no session when nothing is persisted', async () => {
      await service.rehydrate();
      expect(service.loading()).toBe(false);
      expect(service.user()).toBeNull();
      expect(auth.me).not.toHaveBeenCalled();
    });

    it('resolves a fresh token through me()', async () => {
      persist(localStorage, tokenExpiringIn(900_000), 'local');
      await service.rehydrate();
      expect(auth.me).toHaveBeenCalledTimes(1);
      expect(auth.refresh).not.toHaveBeenCalled();
      expect(service.user()).toEqual(USER);
      expect(service.loading()).toBe(false);
    });

    it('refreshes instead of calling me() when the token expires within 60 s', async () => {
      persist(sessionStorage, tokenExpiringIn(10_000), 'session');
      await service.rehydrate();
      expect(auth.refresh).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
      expect(auth.me).not.toHaveBeenCalled();
      expect(service.user()).toEqual(USER);
      expect(storedToken(sessionStorage)?.value).toBe('access-2');
    });

    it('refreshes an already-expired token too', async () => {
      persist(localStorage, tokenExpiringIn(-60_000), 'local');
      await service.rehydrate();
      expect(auth.refresh).toHaveBeenCalledTimes(1);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('ends with loading=false and user=null when the refresh fails', async () => {
      persist(localStorage, tokenExpiringIn(-60_000), 'local');
      auth.refresh = vi.fn(() => Promise.reject({ code: 'token_expired', message: 'expired' }));
      await service.rehydrate();
      expect(service.loading()).toBe(false);
      expect(service.user()).toBeNull();
      expect(service.token()).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('clears the session when me() rejects', async () => {
      persist(localStorage, tokenExpiringIn(900_000), 'local');
      auth.me = vi.fn(() => Promise.reject({ code: 'invalid_credentials', message: 'x' }));
      await service.rehydrate();
      expect(service.loading()).toBe(false);
      expect(service.token()).toBeNull();
    });

    it('loads a legacy pair persisted without a refresh token', async () => {
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ value: 'legacy', expiresUtc: new Date(Date.now() + 900_000).toISOString() }));
      await service.rehydrate();
      expect(service.token()).toEqual({ value: 'legacy', expiresUtc: expect.any(String), refreshToken: '' });
      expect(auth.me).toHaveBeenCalledTimes(1);
    });

    it('runs once even when awaited twice', async () => {
      persist(localStorage, tokenExpiringIn(900_000), 'local');
      await Promise.all([service.rehydrate(), service.rehydrate()]);
      await service.rehydrate();
      expect(auth.me).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('revokes the refresh token then clears everything', async () => {
      await service.login({ email: 'quinn@example.com', password: 'pw' }, true);
      await service.logout();
      expect(auth.logout).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
      expect(service.token()).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.error()).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      // Sign-out forgets the session, not the device.
      expect(service.rememberedEmail()).toBe('quinn@example.com');
    });

    it('skips the API when there is no session', async () => {
      await service.logout();
      expect(auth.logout).not.toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('still clears locally when the revocation call rejects', async () => {
      await service.login({ email: 'quinn@example.com', password: 'pw' }, true);
      auth.logout = vi.fn(() => Promise.reject(new Error('offline')));
      await expect(service.logout()).resolves.toBeUndefined();
      expect(service.token()).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('other auth flows', () => {
    it('forgotPassword surfaces errors on the error signal', async () => {
      auth.forgotPassword = vi.fn(() => Promise.reject(new Error('boom')));
      await expect(service.forgotPassword({ email: 'x@example.com' })).rejects.toBeTruthy();
      expect(service.error()?.code).toBe('invalid_credentials');
      service.clearError();
      expect(service.error()).toBeNull();
    });

    it('resetPassword falls back to token_invalid', async () => {
      auth.resetPassword = vi.fn(() => Promise.reject(new Error('boom')));
      await expect(service.resetPassword({ token: 't', password: 'p' })).rejects.toBeTruthy();
      expect(service.error()?.code).toBe('token_invalid');
    });

    it('resendVerification resolves on success', async () => {
      await expect(service.resendVerification({ email: 'x@example.com' })).resolves.toBeUndefined();
      expect(service.error()).toBeNull();
    });

    it('verifyEmail marks the current user verified', async () => {
      await service.login({ email: 'quinn@example.com', password: 'pw' }, true);
      await service.verifyEmail({ token: 't' });
      expect(service.user()?.emailVerifiedUtc).toEqual(expect.any(String));
    });

    it('verifyEmail failure maps to token_invalid', async () => {
      auth.verifyEmail = vi.fn(() => Promise.reject(new Error('boom')));
      await expect(service.verifyEmail({ token: 't' })).rejects.toBeTruthy();
      expect(service.error()?.code).toBe('token_invalid');
    });
  });
});
