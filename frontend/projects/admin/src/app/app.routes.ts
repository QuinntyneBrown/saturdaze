import { Routes } from '@angular/router';

import { requireAnonymous, requireAuth } from 'api';

/**
 * Saturdaze Admin routes (docs/mocks/pages/admin.*.html).
 *
 * Route data drives the shell (`app.ts`): `shell: 'bare'` lets sign-in own
 * the viewport; `nav` names the current destination for `sd-admin-nav`;
 * `screen` is stamped on `<body data-screen>` (the e2e anchor; every admin
 * page carries `data-page="admin"`).
 *
 * The administrator gate is not a route guard: a signed-in non-admin keeps
 * the URL and sees `sd-admin-gate` instead of the outlet (L2-111 AC1).
 */
export const routes: Routes = [
  {
    path: 'sign-in',
    data: { shell: 'bare', screen: 'sign-in' },
    canActivate: [requireAnonymous],
    loadComponent: () => import('./pages/sign-in/sign-in.page').then((m) => m.SignInPage),
  },
  {
    path: 'places',
    data: { nav: 'places', screen: 'places' },
    canActivate: [requireAuth],
    loadComponent: () => import('./pages/places/places.page').then((m) => m.PlacesPage),
  },
  {
    path: 'places/:kind/:id',
    data: { nav: 'places', screen: 'place' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/place-photos/place-photos.page').then((m) => m.PlacePhotosPage),
  },
  {
    path: 'reviews',
    data: { nav: 'reviews', screen: 'reviews' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/review-queue/review-queue.page').then((m) => m.ReviewQueuePage),
  },
  {
    path: 'ingestion-skips',
    data: { nav: 'skips', screen: 'ingestion-skips' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/ingestion-skips/ingestion-skips.page').then((m) => m.IngestionSkipsPage),
  },
  {
    path: 'activity',
    data: { nav: 'activity', screen: 'activity' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/activity-log/activity-log.page').then((m) => m.ActivityLogPage),
  },
  {
    path: 'email-templates',
    data: { nav: 'emails', screen: 'emails' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/email-templates/email-templates.page').then((m) => m.EmailTemplatesPage),
  },
  {
    path: 'email-templates/:id',
    data: { nav: 'emails', screen: 'email' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/email-template/email-template.page').then((m) => m.EmailTemplatePage),
  },
  {
    path: '',
    pathMatch: 'full',
    data: { nav: 'health', screen: 'health' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/photo-health/photo-health.page').then((m) => m.PhotoHealthPage),
  },
  { path: '**', redirectTo: '' },
];
