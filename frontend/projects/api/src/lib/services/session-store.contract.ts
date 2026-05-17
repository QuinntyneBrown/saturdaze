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
  readonly user: Signal<User | null>;
  readonly isAuthenticated: Signal<boolean>;
  readonly token: Signal<AuthToken | null>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<AuthError | null>;

  signUp(req: SignupRequest): Promise<void>;
  login(req: LoginRequest, remember: boolean): Promise<void>;
  logout(): void;
  forgotPassword(req: ForgotPasswordRequest): Promise<void>;
  resendVerification(req: ResendVerificationRequest): Promise<void>;
  resetPassword(req: ResetPasswordRequest): Promise<void>;
  verifyEmail(req: VerifyEmailRequest): Promise<void>;
  rehydrate(): Promise<void>;
  clearError(): void;
}

export const SESSION_STORE = new InjectionToken<ISessionStore>('SESSION_STORE');
