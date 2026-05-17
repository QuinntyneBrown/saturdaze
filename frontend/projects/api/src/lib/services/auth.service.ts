import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
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
import { IAuthService } from './auth.service.contract';

interface AuthTokensDto {
  readonly accessToken: string;
  readonly accessTokenExpiresAtUtc: string;
}

interface AuthSuccessDto {
  readonly token: AuthTokensDto;
  readonly user: User;
}

interface AuthErrorDto {
  readonly code: AuthErrorCode;
  readonly message: string;
}

function mapToken(dto: AuthTokensDto): AuthToken {
  return { value: dto.accessToken, expiresUtc: dto.accessTokenExpiresAtUtc };
}

function rethrowAsAuthError(err: unknown): never {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object') {
    const body = err.error as Partial<AuthErrorDto>;
    if (body.code && body.message) {
      const out: AuthError = { code: body.code, message: body.message };
      throw out;
    }
  }
  throw {
    code: 'invalid_credentials',
    message: 'Something went wrong. Try again in a moment.',
  } satisfies AuthError;
}

/**
 * Real HTTP `IAuthService`. Bound to `AUTH_SERVICE` in the application
 * composition root. Every method funnels backend errors through
 * `rethrowAsAuthError` so the session store sees the uniform `AuthError`
 * shape regardless of transport quirks.
 */
@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async signUp(req: SignupRequest): Promise<{ token: AuthToken; user: User }> {
    try {
      const dto = await firstValueFrom(
        this.http.post<AuthSuccessDto>(`${this.baseUrl}/api/auth/register`, req),
      );
      return { token: mapToken(dto.token), user: dto.user };
    } catch (e) {
      rethrowAsAuthError(e);
    }
  }

  async login(req: LoginRequest): Promise<{ token: AuthToken; user: User }> {
    try {
      const dto = await firstValueFrom(
        this.http.post<AuthSuccessDto>(`${this.baseUrl}/api/auth/login`, req),
      );
      return { token: mapToken(dto.token), user: dto.user };
    } catch (e) {
      rethrowAsAuthError(e);
    }
  }

  async forgotPassword(req: ForgotPasswordRequest): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.baseUrl}/api/auth/forgot-password`, req),
      );
    } catch (e) {
      rethrowAsAuthError(e);
    }
  }

  async resendVerification(req: ResendVerificationRequest): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.baseUrl}/api/auth/resend-verification`, req),
      );
    } catch (e) {
      rethrowAsAuthError(e);
    }
  }

  async resetPassword(req: ResetPasswordRequest): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.baseUrl}/api/auth/reset-password`, req),
      );
    } catch (e) {
      rethrowAsAuthError(e);
    }
  }

  async verifyEmail(req: VerifyEmailRequest): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.baseUrl}/api/auth/verify-email`, req),
      );
    } catch (e) {
      rethrowAsAuthError(e);
    }
  }

  async me(): Promise<User> {
    try {
      return await firstValueFrom(
        this.http.get<User>(`${this.baseUrl}/api/auth/me`),
      );
    } catch (e) {
      rethrowAsAuthError(e);
    }
  }
}
