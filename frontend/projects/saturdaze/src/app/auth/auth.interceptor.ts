import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { SESSION_STORE, isTokenExpiring } from 'api';

/** Endpoints that never get a bearer — they mint or exchange tokens. */
const NO_BEARER = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
];

/** Bearer is attached, but a 401 must never trigger a refresh or a redirect. */
const NO_RETRY = ['/api/auth/refresh', '/api/auth/logout'];

/** Marks a request that has already been retried once after a refresh. */
const AUTH_RETRIED = new HttpContextToken<boolean>(() => false);

/** Access tokens inside this window are refreshed before the call. */
const REFRESH_SKEW_MS = 60_000;

/**
 * Attaches `Authorization: Bearer <token>` to outgoing API requests, keeps
 * the session alive, and bounces to `/login?returnUrl=<current>` only when
 * the session is really over.
 *
 * - A token inside the 60 s skew window is refreshed *before* the call.
 * - A 401 on a guarded request triggers one `refreshSession()` (shared by
 *   every concurrent 401) and one retry with the rotated bearer.
 * - `/api/auth/refresh` and `/api/auth/logout` never retry, so a failed
 *   exchange cannot loop.
 * - During the app-initializer rehydrate (`session.loading()`), a failure
 *   does not navigate: the route guards redirect once bootstrap finishes.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SESSION_STORE);
  // The Router is resolved lazily so the interceptor can run inside the
  // app initializer before the router itself is ready.
  const injector = inject(Injector);

  const endsWith = (list: readonly string[]): boolean =>
    list.some((suffix) => req.url.endsWith(suffix));

  if (endsWith(NO_BEARER)) return next(req);

  const retryable = !endsWith(NO_RETRY) && !req.context.get(AUTH_RETRIED);

  const withBearer = (r: HttpRequest<unknown>, retried = false): HttpRequest<unknown> => {
    const token = session.token();
    const cloned = token
      ? r.clone({ setHeaders: { Authorization: `Bearer ${token.value}` } })
      : r;
    return retried
      ? cloned.clone({ context: cloned.context.set(AUTH_RETRIED, true) })
      : cloned;
  };

  const bounceToLogin = (): void => {
    if (session.loading()) return;
    const router = injector.get(Router);
    void router.navigateByUrl(`/login?returnUrl=${encodeURIComponent(router.url)}`);
  };

  const send = () =>
    next(withBearer(req)).pipe(
      catchError((err: unknown) => {
        const status = err instanceof HttpErrorResponse ? err.status : undefined;
        if (status !== 401 || !retryable) return throwError(() => err);
        return from(session.refreshSession()).pipe(
          switchMap((refreshed) => {
            if (refreshed) return next(withBearer(req, true));
            // The store has already cleared itself.
            bounceToLogin();
            return throwError(() => err);
          }),
        );
      }),
    );

  const token = session.token();
  if (retryable && token && isTokenExpiring(token, REFRESH_SKEW_MS)) {
    return from(session.refreshSession()).pipe(switchMap(() => send()));
  }
  return send();
};
