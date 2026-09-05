import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import { requireAdmin } from './auth/require-admin.guard';
import { requireAnonymous } from './auth/require-anonymous.guard';
import { requireAuth } from './auth/require-auth.guard';
import { environment } from '../environments/environment';

/**
 * Saturdaze application routes (docs/mocks-v2).
 *
 * Route data drives the shell (`app.ts`): `shell` picks the chrome
 * (`app` default · `site` public bar · `bare` auth), `nav` the current
 * primary destination, `page` the `<body data-page>` slug, `cta` the site
 * bar's sign-up button. Children inherit their parent's data.
 *
 * - `/` is the landing page for signed-out visitors; signed-in visitors are
 *   bounced to `/weekend` by `requireAnonymous`.
 * - `/verify-email` deliberately has no guard — signed-in *and* signed-out
 *   users reach it from an email link (and right after creating an account).
 * - `/sample-weekend?share=<token>` is the read-only shared weekend; the
 *   backend builds share links with that path.
 * - `/review-submissions` chains `requireAuth` then `requireAdmin`.
 * - The dialogs gallery stays public and dev-only so design review can pull
 *   it up without an account.
 * - Every v1 path redirects to its v2 home.
 */
export const routes: Routes = [
  // ---------------------------------------------------------------- public
  {
    path: '',
    pathMatch: 'full',
    data: { shell: 'site', cta: true, page: 'landing' },
    canActivate: [requireAnonymous],
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'sign-in',
    data: { shell: 'bare', page: 'sign-in' },
    canActivate: [requireAnonymous],
    loadComponent: () => import('./pages/sign-in/sign-in.page').then((m) => m.SignInPage),
  },
  {
    path: 'create-account',
    data: { shell: 'bare', page: 'create-account' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/create-account/create-account.page').then((m) => m.CreateAccountPage),
  },
  {
    path: 'reset-password',
    data: { shell: 'bare', page: 'reset-password' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'verify-email',
    data: { shell: 'bare', page: 'verify-email' },
    loadComponent: () =>
      import('./pages/verify-email/verify-email.page').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'legal',
    data: { shell: 'site', page: 'legal' },
    loadComponent: () => import('./pages/legal/legal.page').then((m) => m.LegalPage),
  },
  {
    path: 'sample-weekend',
    data: { shell: 'site', cta: true, page: 'shared-weekend' },
    loadComponent: () =>
      import('./pages/shared-weekend/shared-weekend.page').then((m) => m.SharedWeekendPage),
  },

  // ---------------------------------------------------------------- app
  {
    path: 'weekend',
    data: { nav: 'weekend', page: 'weekend' },
    canActivate: [requireAuth],
    loadComponent: () => import('./pages/weekend/weekend.page').then((m) => m.WeekendPage),
  },
  {
    path: 'ideas',
    data: { nav: 'ideas', page: 'ideas' },
    canActivate: [requireAuth],
    loadComponent: () => import('./pages/ideas/ideas.page').then((m) => m.IdeasPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: { subtitle: 'Picked for your family, under 45 minutes from home.' },
        loadComponent: () =>
          import('./pages/ideas-activities/ideas-activities.page').then(
            (m) => m.IdeasActivitiesPage,
          ),
      },
      {
        path: 'food',
        data: { subtitle: 'Places to eat near what you are already doing.' },
        loadComponent: () =>
          import('./pages/ideas-food/ideas-food.page').then((m) => m.IdeasFoodPage),
      },
      {
        path: 'events',
        data: { subtitle: 'What is on within 45 minutes of home.' },
        loadComponent: () =>
          import('./pages/ideas-events/ideas-events.page').then((m) => m.IdeasEventsPage),
      },
    ],
  },
  {
    path: 'past',
    data: { nav: 'past', page: 'past' },
    canActivate: [requireAuth],
    loadComponent: () => import('./pages/past/past.page').then((m) => m.PastPage),
  },
  {
    path: 'family',
    data: { nav: 'family', page: 'family' },
    canActivate: [requireAuth],
    loadComponent: () => import('./pages/family/family.page').then((m) => m.FamilyPage),
  },
  {
    path: 'review-submissions',
    data: { nav: 'family', page: 'review-submissions' },
    canActivate: [requireAuth, requireAdmin],
    loadComponent: () =>
      import('./pages/review-submissions/review-submissions.page').then(
        (m) => m.ReviewSubmissionsPage,
      ),
  },

  // ---------------------------------------------------------------- dev only
  ...(environment.galleryRoutes
    ? [
        {
          path: 'dialogs',
          data: { shell: 'site', page: 'dialogs' },
          loadComponent: () => import('./pages/dialogs/dialogs.page').then((m) => m.DialogsPage),
        },
      ]
    : []),

  // ---------------------------------------------------------------- v1 paths
  { path: 'itinerary', pathMatch: 'full', redirectTo: '/weekend' },
  { path: 'errand', pathMatch: 'full', redirectTo: '/weekend' },
  { path: 'activities', pathMatch: 'full', redirectTo: '/ideas' },
  { path: 'restaurants', pathMatch: 'full', redirectTo: '/ideas/food' },
  { path: 'events', pathMatch: 'full', redirectTo: '/ideas/events' },
  { path: 'events/submit', pathMatch: 'full', redirectTo: '/ideas/events' },
  { path: 'events/submitted', pathMatch: 'full', redirectTo: '/ideas/events' },
  { path: 'saved', pathMatch: 'full', redirectTo: '/past' },
  { path: 'profile', pathMatch: 'full', redirectTo: '/family' },
  { path: 'admin/events', pathMatch: 'full', redirectTo: '/review-submissions' },
  { path: 'login', pathMatch: 'full', redirectTo: '/sign-in' },
  { path: 'signup', pathMatch: 'full', redirectTo: '/create-account' },
  { path: 'forgot-password', pathMatch: 'full', redirectTo: '/reset-password' },
  { path: 'check-email', pathMatch: 'full', redirectTo: '/reset-password' },
  { path: 'terms', pathMatch: 'full', redirectTo: '/legal' },
  {
    path: 'privacy',
    pathMatch: 'full',
    redirectTo: () => inject(Router).createUrlTree(['/legal'], { fragment: 'privacy' }),
  },
  { path: '**', redirectTo: '' },
];
