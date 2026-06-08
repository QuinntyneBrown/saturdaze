import { InjectionToken, Signal } from '@angular/core';

import { AuthError } from '../models/auth-error';
import { AuthToken } from '../models/auth-token';
import { ForgotPasswordRequest } from '../models/forgot-password-request';
import { LoginRequest } from '../models/login-request';
import { ResetPasswordRequest } from '../models/reset-password-request';
import { ResendVerificationRequest } from '../models/resend-verification-request';
import { SignupRequest } from '../models/signup-request';
import { User } from '../models/user';
import { VerifyEmailRequest } from '../models/verify-email-request';

/**
 * Page-facing session state. Signal-based so OnPush components re-render
 * naturally on auth transitions.
 *
 * Owns persistence (local vs session storage based on remember-me) and the
 * single mapping of `IAuthService` rejections onto the `error` signal.
 */
export interface ISessionStore {
  /**
   * User.
   */
  readonly user: Signal<User | null>;
  /**
   * Is Authenticated.
   */
  readonly isAuthenticated: Signal<boolean>;
  /**
   * Token.
   */
  readonly token: Signal<AuthToken | null>;
  /**
   * Loading.
   */
  readonly loading: Signal<boolean>;
  /**
   * Error.
   */
  readonly error: Signal<AuthError | null>;

  /**
   * The email last submitted with `remember=true`, used to pre-fill the
   * sign-in form on return. `null` when the user has not opted in or has
   * since signed in with `remember=false`. Persisted in `localStorage`
   * alongside the JWT; sign-out does **not** clear it (sign-out forgets
   * the session, not the device).
   */
  readonly rememberedEmail: Signal<string | null>;

  /**
   * Sign Up.
   *
   * @param {SignupRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
  signUp(req: SignupRequest): Promise<void>;
  /**
   * Login.
   *
   * @param {LoginRequest} req - The req
   * @param {boolean} remember - The remember
   *
   * @returns {Promise<void>} The result of the operation
   */
  login(req: LoginRequest, remember: boolean): Promise<void>;
  /**
   * Logout.
   *
   * @returns {void} No return value
   */
  logout(): void;
  /**
   * Forgot Password.
   *
   * @param {ForgotPasswordRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
  forgotPassword(req: ForgotPasswordRequest): Promise<void>;
  /**
   * Resend Verification.
   *
   * @param {ResendVerificationRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
  resendVerification(req: ResendVerificationRequest): Promise<void>;
  /**
   * Reset Password.
   *
   * @param {ResetPasswordRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
  resetPassword(req: ResetPasswordRequest): Promise<void>;
  /**
   * Verify Email.
   *
   * @param {VerifyEmailRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
  verifyEmail(req: VerifyEmailRequest): Promise<void>;
  /**
   * Rehydrate.
   *
   * @returns {Promise<void>} The result of the operation
   */
  rehydrate(): Promise<void>;
  /**
   * Clear Error.
   *
   * @returns {void} No return value
   */
  clearError(): void;
}

export const SESSION_STORE = new InjectionToken<ISessionStore>('SESSION_STORE');
