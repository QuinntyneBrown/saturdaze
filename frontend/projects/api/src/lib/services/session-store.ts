import { Injectable, Signal, computed, inject, signal } from '@angular/core';

import { AuthError } from '../models/auth-error';
import { AuthErrorCode } from '../models/auth-error-code';
import { AuthToken, isTokenExpiring } from '../models/auth-token';
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

/** Access tokens inside this window are refreshed rather than used. */
const REFRESH_SKEW_MS = 60_000;

type StorageTier = 'local' | 'session';

/**
 * Is Auth Error.
 *
 * @param {unknown} value - The value
 *
 * @returns {value is AuthError} The result of the operation
 */
function isAuthError(value: unknown): value is AuthError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

/**
 * As Auth Error.
 *
 * @param {unknown} value - The value
 * @param {AuthErrorCode} fallback - The fallback
 *
 * @returns {AuthError} The result of the operation
 */
function asAuthError(value: unknown, fallback: AuthErrorCode = 'invalid_credentials'): AuthError {
  if (isAuthError(value)) return value;
  return { code: fallback, message: 'Something went wrong. Try again in a moment.' };
}

/**
 * Stored Token: the JSON shape under `sd.auth.token`. `refreshToken` is
 * optional on read so a pair persisted before refresh support still loads.
 */
interface StoredToken {
  /**
   * Value.
   */
  value: string;
  /**
   * Expires Utc.
   */
  expiresUtc: string;
  /**
   * Refresh Token.
   */
  refreshToken?: string;
}

/**
 * A persisted token plus the storage tier it was read from.
 */
interface PersistedToken {
  /**
   * Token.
   */
  readonly token: AuthToken;
  /**
   * Tier.
   */
  readonly tier: StorageTier;
}

/**
 * Signal-based session state.
 *
 * Persists the token pair in `localStorage` when `remember=true` and in
 * `sessionStorage` otherwise. `rehydrate()` runs once at bootstrap: an
 * access token inside the refresh window is exchanged via
 * `refreshSession()`, otherwise the persisted token is resolved back into a
 * `user` via `IAuthService.me()`.
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
  private refreshPromise: Promise<boolean> | null = null;
  /** Which storage holds the current pair; a refresh re-persists to the same tier. */
  private tier: StorageTier = 'local';

  /**
   * Sign Up.
   *
   * @param {SignupRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
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

  /**
   * Login.
   *
   * @param {LoginRequest} req - The req
   * @param {boolean} remember - The remember
   *
   * @returns {Promise<void>} The result of the operation
   */
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

  /**
   * Logout. The revocation call runs *before* the local clear so the
   * interceptor can still attach the bearer; it is best-effort, so an
   * offline device signs out locally regardless.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async logout(): Promise<void> {
    const token = this._token();
    if (token?.refreshToken) {
      try {
        await this.auth.logout({ refreshToken: token.refreshToken });
      } catch {
        // Best effort: the refresh token expires on its own within 14 days.
      }
    }
    this.clearSession();
  }

  /**
   * Refresh Session. Single-flight: concurrent 401s share one exchange.
   *
   * @returns {Promise<boolean>} The result of the operation
   */
  refreshSession(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  /**
   * Perform Refresh.
   *
   * @returns {Promise<boolean>} The result of the operation
   */
  private async performRefresh(): Promise<boolean> {
    // Another tab may already have rotated the pair; adopt it rather than
    // presenting a refresh token the server has just revoked.
    const persisted = this.readPersisted();
    const current = this._token();
    if (
      persisted &&
      current &&
      persisted.token.value !== current.value &&
      !isTokenExpiring(persisted.token, REFRESH_SKEW_MS)
    ) {
      this._token.set(persisted.token);
      this.tier = persisted.tier;
      return true;
    }

    const refreshToken = current?.refreshToken || persisted?.token.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      return false;
    }

    try {
      const { token, user } = await this.auth.refresh({ refreshToken });
      this.persist(token, this.tier === 'local');
      this._token.set(token);
      this._user.set(user);
      return true;
    } catch {
      // v1: any refresh failure ends the session. A transient network
      // error therefore costs a sign-in; distinguishing it is future work.
      this.clearSession();
      return false;
    }
  }

  /**
   * Forgot Password.
   *
   * @param {ForgotPasswordRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
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

  /**
   * Resend Verification.
   *
   * @param {ResendVerificationRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
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

  /**
   * Reset Password.
   *
   * @param {ResetPasswordRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
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

  /**
   * Verify Email.
   *
   * @param {VerifyEmailRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
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

  /**
   * Rehydrate.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async rehydrate(): Promise<void> {
    if (this.rehydrated) return;
    if (this.rehydratePromise) return this.rehydratePromise;
    this.rehydratePromise = this.performRehydrate();
    await this.rehydratePromise;
  }

  /**
   * Perform Rehydrate.
   *
   * @returns {Promise<void>} The result of the operation
   */
  private async performRehydrate(): Promise<void> {
    const stored = this.readPersisted();
    if (!stored) {
      this.finishRehydrate();
      return;
    }
    this.tier = stored.tier;
    this._token.set(stored.token);
    try {
      if (isTokenExpiring(stored.token, REFRESH_SKEW_MS)) {
        // Sets `user` on success; clears the session on failure.
        await this.refreshSession();
      } else {
        // A 401 here is retried once by the interceptor after a refresh.
        this._user.set(await this.auth.me());
      }
    } catch {
      this.clearSession();
    } finally {
      this.finishRehydrate();
    }
  }

  /**
   * Finish Rehydrate.
   *
   * @returns {void} No return value
   */
  private finishRehydrate(): void {
    this._loading.set(false);
    this.rehydrated = true;
  }

  /**
   * Clear Error.
   *
   * @returns {void} No return value
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear Session: forget every credential and signal, keep the
   * remembered email (sign-out forgets the session, not the device).
   *
   * @returns {void} No return value
   */
  private clearSession(): void {
    this.clearPersisted();
    this._token.set(null);
    this._user.set(null);
    this._error.set(null);
  }

  /**
   * Persist.
   *
   * @param {AuthToken} token - The token
   * @param {boolean} remember - The remember
   *
   * @returns {void} No return value
   */
  private persist(token: AuthToken, remember: boolean): void {
    this.tier = remember ? 'local' : 'session';
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    const payload: StoredToken = {
      value: token.value,
      expiresUtc: token.expiresUtc,
      refreshToken: token.refreshToken,
    };
    target.setItem(TOKEN_KEY, JSON.stringify(payload));
    target.setItem(STORAGE_FLAG_KEY, this.tier);
    other.removeItem(TOKEN_KEY);
    other.removeItem(STORAGE_FLAG_KEY);
  }

  /**
   * Read Persisted.
   *
   * @returns {PersistedToken | null} The result of the operation
   */
  private readPersisted(): PersistedToken | null {
    const tiers: ReadonlyArray<[StorageTier, Storage]> = [
      ['local', localStorage],
      ['session', sessionStorage],
    ];
    for (const [tier, store] of tiers) {
      const raw = store.getItem(TOKEN_KEY);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as StoredToken;
        if (parsed.value && parsed.expiresUtc) {
          return {
            tier,
            token: {
              value: parsed.value,
              expiresUtc: parsed.expiresUtc,
              refreshToken: parsed.refreshToken ?? '',
            },
          };
        }
      } catch {
        store.removeItem(TOKEN_KEY);
      }
    }
    return null;
  }

  /**
   * Clear Persisted.
   *
   * @returns {void} No return value
   */
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

/**
 * Read Remembered Email.
 */
function readRememberedEmail(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(REMEMBERED_EMAIL_KEY);
  return value && value.trim() ? value.trim() : null;
}
