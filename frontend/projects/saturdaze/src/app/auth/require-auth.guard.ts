import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_STORE } from 'api';

/**
 * Gate every signed-in surface (`/weekend`, `/ideas`, `/past`, `/family`, …).
 *
 * Anonymous visitors are bounced to `/sign-in` with `?returnUrl=<original>`
 * so the login handler can drop them back where they started.
 *
 * The guard runs *after* `SessionStore.rehydrate()` completes — the App
 * shell holds the router outlet behind a loading curtain until then, so
 * `isAuthenticated()` is authoritative on first paint.
 */
export const requireAuth: CanActivateFn = (_route, state) => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);
  if (session.isAuthenticated()) return true;
  return router.createUrlTree(['/sign-in'], {
    queryParams: { returnUrl: state.url },
  });
};
