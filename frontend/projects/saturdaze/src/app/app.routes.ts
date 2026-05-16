import { Routes } from '@angular/router';

/**
 * Saturdaze application routes.
 *
 * Clean URLs that mirror the mock filenames (`home`, `itinerary`, ...).
 * Pages are lazy so the home payload stays small. Each route is one
 * vertical slice in `docs/frontend-implementation-plan.md`.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'itinerary',
    loadComponent: () =>
      import('./pages/itinerary/itinerary.page').then((m) => m.ItineraryPage),
  },
  {
    path: 'activities',
    loadComponent: () =>
      import('./pages/activities/activities.page').then(
        (m) => m.ActivitiesPage,
      ),
  },
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./pages/restaurants/restaurants.page').then(
        (m) => m.RestaurantsPage,
      ),
  },
  {
    path: 'saved',
    loadComponent: () =>
      import('./pages/saved/saved.page').then((m) => m.SavedPage),
  },
  {
    path: 'events',
    loadComponent: () =>
      import('./pages/events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'errand',
    loadComponent: () =>
      import('./pages/errand/errand.page').then((m) => m.ErrandPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
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
];
