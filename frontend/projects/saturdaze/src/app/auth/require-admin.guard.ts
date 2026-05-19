import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_STORE } from 'api';

/**
 * Gate admin-only surfaces (`/admin/events`). Non-admins are bounced to
 * `/weekend`; anonymous visitors are bounced to `/login` (handled by the
 * surrounding `requireAuth` guard if chained).
 */
export const requireAdmin: CanActivateFn = () => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);
  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (session.user()?.role === 'Admin') return true;
  return router.createUrlTree(['/weekend']);
};
