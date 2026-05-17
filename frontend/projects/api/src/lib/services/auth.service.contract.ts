import { InjectionToken } from '@angular/core';

import { AuthToken } from '../models/auth-token';
import { ForgotPasswordRequest } from '../models/forgot-password-request';
import { LoginRequest } from '../models/login-request';
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
  signUp(req: SignupRequest): Promise<{ token: AuthToken; user: User }>;
  login(req: LoginRequest): Promise<{ token: AuthToken; user: User }>;
  forgotPassword(req: ForgotPasswordRequest): Promise<void>;
  resendVerification(req: ResendVerificationRequest): Promise<void>;
  resetPassword(req: ResetPasswordRequest): Promise<void>;
  verifyEmail(req: VerifyEmailRequest): Promise<void>;
  me(): Promise<User>;
}

export const AUTH_SERVICE = new InjectionToken<IAuthService>('AUTH_SERVICE');
