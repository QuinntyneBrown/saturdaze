import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_STORE } from '../services/session-store.contract';
import { AUTH_ROUTES } from './auth-routes';

/**
 * Gate every signed-in surface (`/weekend`, `/ideas`, `/past`, `/family`, …).
 *
 * Anonymous visitors are bounced to `AUTH_ROUTES.signIn` with `?returnUrl=<original>`
 * so the login handler can drop them back where they started.
 *
 * The guard runs *after* `SessionStore.rehydrate()` completes — the App
 * shell holds the router outlet behind a loading curtain until then, so
 * `isAuthenticated()` is authoritative on first paint.
 */
export const requireAuth: CanActivateFn = (_route, state) => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);
  const routes = inject(AUTH_ROUTES);
  if (session.isAuthenticated()) return true;
  return router.createUrlTree([routes.signIn], {
    queryParams: { returnUrl: state.url },
  });
};
