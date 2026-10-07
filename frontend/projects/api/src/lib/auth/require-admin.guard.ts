import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_STORE } from '../services/session-store.contract';
import { AUTH_ROUTES } from './auth-routes';

/**
 * Gate admin-only surfaces (`/review-submissions`). Non-admins are bounced to
 * `AUTH_ROUTES.home`; anonymous visitors to `AUTH_ROUTES.signIn` (handled by
 * the surrounding `requireAuth` guard if chained).
 */
export const requireAdmin: CanActivateFn = () => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);
  const routes = inject(AUTH_ROUTES);
  if (!session.isAuthenticated()) {
    return router.createUrlTree([routes.signIn]);
  }
  if (session.user()?.role === 'Admin') return true;
  return router.createUrlTree([routes.home]);
};
