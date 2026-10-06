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
  // Photo health (A2) takes `/` once it is built; until then the home is Places.
  { path: '', pathMatch: 'full', redirectTo: 'places' },
  { path: '**', redirectTo: '' },
];
