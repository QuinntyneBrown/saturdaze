import { InjectionToken } from '@angular/core';

import { AuthToken } from '../models/auth-token';
import { ForgotPasswordRequest } from '../models/forgot-password-request';
import { LoginRequest } from '../models/login-request';
import { LogoutRequest } from '../models/logout-request';
import { RefreshRequest } from '../models/refresh-request';
import { ResetPasswordRequest } from '../models/reset-password-request';
import { ResendVerificationRequest } from '../models/resend-verification-request';
import { SignupRequest } from '../models/signup-request';
import { User } from '../models/user';
import { VerifyEmailRequest } from '../models/verify-email-request';

/**
 * HTTP boundary for `/api/auth/*`. The session store consumes this contract;
 * pages never inject it directly.
 *
 * Methods rejecting with an `AuthError` is the contract — the store maps
 * them onto its `error` signal and the originating call's rejected promise.
 */
export interface IAuthService {
  /**
   * Sign Up.
   *
   * @param {SignupRequest} req - The req
   *
   * @returns {Promise<{ token: AuthToken; user: User }>} The result of the operation
   */
  signUp(req: SignupRequest): Promise<{ token: AuthToken; user: User }>;
  /**
   * Login.
   *
   * @param {LoginRequest} req - The req
   *
   * @returns {Promise<{ token: AuthToken; user: User }>} The result of the operation
   */
  login(req: LoginRequest): Promise<{ token: AuthToken; user: User }>;
  /**
   * Exchange a refresh token for a new access + refresh pair. Rejects with
   * `AuthError { code: 'token_expired' }` when the server answers 401
   * (invalid, revoked or expired refresh token).
   *
   * @param {RefreshRequest} req - The req
   *
   * @returns {Promise<{ token: AuthToken; user: User }>} The result of the operation
   */
  refresh(req: RefreshRequest): Promise<{ token: AuthToken; user: User }>;
  /**
   * Best-effort server-side revocation of the refresh token. Rejects with
   * an `AuthError` on transport failure; callers treat it as advisory.
   *
   * @param {LogoutRequest} req - The req
   *
   * @returns {Promise<void>} The result of the operation
   */
  logout(req: LogoutRequest): Promise<void>;
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
   * Me.
   *
   * @returns {Promise<User>} The result of the operation
   */
  me(): Promise<User>;
}

export const AUTH_SERVICE = new InjectionToken<IAuthService>('AUTH_SERVICE');
