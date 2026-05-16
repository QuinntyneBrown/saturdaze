import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import {
  ACTIVITY_SERVICE,
  API_BASE_URL,
  ActivityService,
  EVENTS_SERVICE,
  EventsService,
  FAMILY_SERVICE,
  FamilyService,
  RESTAURANT_SERVICE,
  RestaurantService,
  SAVED_SERVICE,
  SavedService,
  WEEKEND_PLAN_SERVICE,
  WeekendPlanService,
} from 'api';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },

    // Composition root: pages depend on tokens; the production host binds
    // each token to its real implementation. Swap any of these to a mock at
    // test time without touching page code.
    { provide: ACTIVITY_SERVICE, useExisting: ActivityService },
    { provide: EVENTS_SERVICE, useExisting: EventsService },
    { provide: FAMILY_SERVICE, useExisting: FamilyService },
    { provide: RESTAURANT_SERVICE, useExisting: RestaurantService },
    { provide: SAVED_SERVICE, useExisting: SavedService },
    { provide: WEEKEND_PLAN_SERVICE, useExisting: WeekendPlanService },
  ],
};
