import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SESSION_STORE } from 'api';

const UNGUARDED_SUFFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
];

/**
 * Attaches `Authorization: Bearer <token>` to outgoing API requests and
 * bounces to `/login?returnUrl=<current>` on a 401.
 *
 * Auth endpoints are skipped — they're how the user obtains/refreshes
 * tokens in the first place, and a 401 there is an inline error, not a
 * redirect-the-session signal.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);

  const skip = UNGUARDED_SUFFIXES.some((s) => req.url.endsWith(s));
  const token = session.token();
  const cloned = !skip && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token.value}` } })
    : req;

  return next(cloned).pipe(
    catchError((err) => {
      const status = (err as { status?: number })?.status;
      if (status === 401 && !skip) {
        session.logout();
        void router.navigateByUrl(
          `/login?returnUrl=${encodeURIComponent(router.url)}`,
        );
      }
      return throwError(() => err);
    }),
  );
};
