import { Routes } from '@angular/router';

import { requireAnonymous } from './auth/require-anonymous.guard';
import { requireAuth } from './auth/require-auth.guard';
import { environment } from '../environments/environment';

/**
 * Saturdaze application routes.
 *
 * - `/` serves the marketing splash for signed-out visitors and bounces
 *   authenticated visitors to `/weekend`.
 * - The weekend overview lives at `/weekend`. The remaining app surfaces
 *   are all guarded by `requireAuth`.
 * - `/verify-email` deliberately has no guard — signed-in *and* signed-out
 *   users need to reach it from an email link.
 * - Component galleries (`/dialogs`, `/components`) stay public so design
 *   review can pull them up without an account.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: { shell: 'splash' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'weekend',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    data: { shell: 'auth' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    data: { shell: 'auth' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'forgot-password',
    data: { shell: 'auth' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: 'check-email',
    // No guard: reached BOTH from signup (now authed, awaiting verification)
    // and from forgot-password (still anonymous). /verify-email mirrors this.
    data: { shell: 'auth' },
    loadComponent: () =>
      import('./pages/check-email/check-email.page').then((m) => m.CheckEmailPage),
  },
  {
    path: 'reset-password',
    data: { shell: 'auth' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/reset-password/reset-password.page').then(
        (m) => m.ResetPasswordPage,
      ),
  },
  {
    path: 'verify-email',
    data: { shell: 'auth' },
    loadComponent: () =>
      import('./pages/verify-email/verify-email.page').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pages/legal/legal.page').then((m) => m.LegalPage),
    data: { legal: 'terms' },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/legal/legal.page').then((m) => m.LegalPage),
    data: { legal: 'privacy' },
  },
  {
    path: 'sample-weekend',
    data: { shell: 'splash' },
    loadComponent: () =>
      import('./pages/sample-weekend/sample-weekend.page').then(
        (m) => m.SampleWeekendPage,
      ),
  },
  {
    path: 'itinerary',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/itinerary/itinerary.page').then((m) => m.ItineraryPage),
  },
  {
    path: 'activities',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/activities/activities.page').then(
        (m) => m.ActivitiesPage,
      ),
  },
  {
    path: 'restaurants',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/restaurants/restaurants.page').then(
        (m) => m.RestaurantsPage,
      ),
  },
  {
    path: 'saved',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/saved/saved.page').then((m) => m.SavedPage),
  },
  {
    path: 'events',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'events/submit',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/events-submit/events-submit.page').then(
        (m) => m.EventsSubmitPage,
      ),
  },
  {
    path: 'events/submitted',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/events-submitted/events-submitted.page').then(
        (m) => m.EventsSubmittedPage,
      ),
  },
  {
    path: 'errand',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/errand/errand.page').then((m) => m.ErrandPage),
  },
  {
    path: 'profile',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  ...(environment.galleryRoutes ? [
    {
      path: 'dialogs',
      loadComponent: () =>
        import('./pages/dialogs/dialogs.page').then((m) => m.DialogsPage),
    },
    {
      path: 'components',
      loadComponent: () =>
        import('./pages/components-gallery/components-gallery.page').then(
          (m) => m.ComponentsGalleryPage,
        ),
    },
  ] : []),
];
