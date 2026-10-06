import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_STORE } from '../services/session-store.contract';
import { AUTH_ROUTES } from './auth-routes';

/**
 * Mirror of `requireAuth` for routes that only make sense when signed-out
 * (splash, login, signup, forgot-password, check-email, reset-password).
 * Authenticated visitors are bounced to `AUTH_ROUTES.home`.
 *
 * Note: `/verify-email` deliberately omits this guard — signed-in users
 * with an unverified address need to reach it from a banner / link.
 */
export const requireAnonymous: CanActivateFn = () => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);
  const routes = inject(AUTH_ROUTES);
  if (!session.isAuthenticated()) return true;
  return router.createUrlTree([routes.home]);
};
