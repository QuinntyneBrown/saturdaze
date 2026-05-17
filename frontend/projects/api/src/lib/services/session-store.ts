import { Injectable, Signal, computed, inject, signal } from '@angular/core';

import { AuthError } from '../models/auth-error';
import { AuthErrorCode } from '../models/auth-error-code';
import { AuthToken } from '../models/auth-token';
import { ForgotPasswordRequest } from '../models/forgot-password-request';
import { LoginRequest } from '../models/login-request';
import { ResetPasswordRequest } from '../models/reset-password-request';
import { ResendVerificationRequest } from '../models/resend-verification-request';
import { SignupRequest } from '../models/signup-request';
import { User } from '../models/user';
import { VerifyEmailRequest } from '../models/verify-email-request';
import { AUTH_SERVICE } from './auth.service.contract';
import { ISessionStore } from './session-store.contract';

const TOKEN_KEY = 'sd.auth.token';
const STORAGE_FLAG_KEY = 'sd.auth.storage';
const REMEMBERED_EMAIL_KEY = 'sd.auth.remember.email';
const LEGACY_MOCK_KEYS = ['sd.mock.auth.user-id', 'sd.mock.auth.users'] as const;

function isAuthError(value: unknown): value is AuthError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

function asAuthError(value: unknown, fallback: AuthErrorCode = 'invalid_credentials'): AuthError {
  if (isAuthError(value)) return value;
  return { code: fallback, message: 'Something went wrong. Try again in a moment.' };
}

interface StoredToken {
  value: string;
  expiresUtc: string;
}

/**
 * Signal-based session state.
 *
 * Persists the token in `localStorage` when `remember=true` and in
 * `sessionStorage` otherwise. `rehydrate()` runs once at bootstrap to
 * resolve the persisted token back into a `user` via `IAuthService.me()`.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore implements ISessionStore {
  private readonly auth = inject(AUTH_SERVICE);

  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<AuthToken | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<AuthError | null>(null);
  private readonly _rememberedEmail = signal<string | null>(readRememberedEmail());

  readonly user: Signal<User | null> = this._user.asReadonly();
  readonly token: Signal<AuthToken | null> = this._token.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<AuthError | null> = this._error.asReadonly();
  readonly rememberedEmail: Signal<string | null> = this._rememberedEmail.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  private rehydratePromise: Promise<void> | null = null;
  private rehydrated = false;

  async signUp(req: SignupRequest): Promise<void> {
    this._error.set(null);
    try {
      const { token, user } = await this.auth.signUp(req);
      this.persist(token, true);
      this._token.set(token);
      this._user.set(user);
    } catch (e) {
      const err = asAuthError(e);
      this._error.set(err);
      throw err;
    }
  }

  async login(req: LoginRequest, remember: boolean): Promise<void> {
    this._error.set(null);
    try {
      const { token, user } = await this.auth.login(req);
      this.persist(token, remember);
      this.persistRememberedEmail(remember ? req.email : null);
      this._token.set(token);
      this._user.set(user);
    } catch (e) {
      const err = asAuthError(e);
      this._error.set(err);
      throw err;
    }
  }

  logout(): void {
    this.clearPersisted();
    this._token.set(null);
    this._user.set(null);
    this._error.set(null);
  }

  async forgotPassword(req: ForgotPasswordRequest): Promise<void> {
    this._error.set(null);
    try {
      await this.auth.forgotPassword(req);
    } catch (e) {
      const err = asAuthError(e);
      this._error.set(err);
      throw err;
    }
  }

  async resendVerification(req: ResendVerificationRequest): Promise<void> {
    this._error.set(null);
    try {
      await this.auth.resendVerification(req);
    } catch (e) {
      const err = asAuthError(e);
      this._error.set(err);
      throw err;
    }
  }

  async resetPassword(req: ResetPasswordRequest): Promise<void> {
    this._error.set(null);
    try {
      await this.auth.resetPassword(req);
    } catch (e) {
      const err = asAuthError(e, 'token_invalid');
      this._error.set(err);
      throw err;
    }
  }

  async verifyEmail(req: VerifyEmailRequest): Promise<void> {
    this._error.set(null);
    try {
      await this.auth.verifyEmail(req);
      const current = this._user();
      if (current) {
        this._user.set({ ...current, emailVerifiedUtc: new Date().toISOString() });
      }
    } catch (e) {
      const err = asAuthError(e, 'token_invalid');
      this._error.set(err);
      throw err;
    }
  }

  async rehydrate(): Promise<void> {
    if (this.rehydrated) return;
    if (this.rehydratePromise) return this.rehydratePromise;
    this.rehydratePromise = this.performRehydrate();
    await this.rehydratePromise;
  }

  private async performRehydrate(): Promise<void> {
    // One-time cleanup: drop keys written by the now-removed MockAuthService.
    // Safe to remove once enough time has passed for users to refresh.
    for (const key of LEGACY_MOCK_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    const stored = this.readPersisted();
    if (!stored) {
      this._loading.set(false);
      this.rehydrated = true;
      return;
    }
    if (new Date(stored.expiresUtc).getTime() <= Date.now()) {
      this.clearPersisted();
      this._loading.set(false);
      this.rehydrated = true;
      return;
    }
    this._token.set({ value: stored.value, expiresUtc: stored.expiresUtc });
    try {
      const user = await this.auth.me();
      this._user.set(user);
    } catch {
      this.clearPersisted();
      this._token.set(null);
    } finally {
      this._loading.set(false);
      this.rehydrated = true;
    }
  }

  clearError(): void {
    this._error.set(null);
  }

  private persist(token: AuthToken, remember: boolean): void {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    const payload: StoredToken = { value: token.value, expiresUtc: token.expiresUtc };
    target.setItem(TOKEN_KEY, JSON.stringify(payload));
    target.setItem(STORAGE_FLAG_KEY, remember ? 'local' : 'session');
    other.removeItem(TOKEN_KEY);
    other.removeItem(STORAGE_FLAG_KEY);
  }

  private readPersisted(): StoredToken | null {
    for (const store of [localStorage, sessionStorage]) {
      const raw = store.getItem(TOKEN_KEY);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as StoredToken;
        if (parsed.value && parsed.expiresUtc) return parsed;
      } catch {
        store.removeItem(TOKEN_KEY);
      }
    }
    return null;
  }

  private clearPersisted(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_FLAG_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_FLAG_KEY);
  }

  /**
   * Writes (or clears) the remembered email used to pre-fill the
   * sign-in form on return. Sign-out deliberately leaves this in place
   * so the next sign-in is one tap less.
   */
  private persistRememberedEmail(email: string | null): void {
    if (email && email.trim()) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      this._rememberedEmail.set(email.trim());
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      this._rememberedEmail.set(null);
    }
  }
}

function readRememberedEmail(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(REMEMBERED_EMAIL_KEY);
  return value && value.trim() ? value.trim() : null;
}
