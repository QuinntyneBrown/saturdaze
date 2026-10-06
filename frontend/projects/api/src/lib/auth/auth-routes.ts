import { InjectionToken } from '@angular/core';

/**
 * Where the auth guards send people. Both apps share `requireAuth`,
 * `requireAnonymous` and `requireAdmin` (ADR-014); only the destinations
 * differ. The family app keeps the defaults; Saturdaze Admin binds
 * `{ signIn: '/sign-in', home: '/' }` in its composition root.
 */
export interface AuthRoutes {
  /** Where an anonymous visitor signs in (`?returnUrl=` is appended). */
  readonly signIn: string;
  /** Where a signed-in visitor lands when a page is not for them. */
  readonly home: string;
}

export const DEFAULT_AUTH_ROUTES: AuthRoutes = { signIn: '/sign-in', home: '/weekend' };

export const AUTH_ROUTES = new InjectionToken<AuthRoutes>('AUTH_ROUTES', {
  providedIn: 'root',
  factory: () => DEFAULT_AUTH_ROUTES,
});
