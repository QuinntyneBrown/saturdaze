import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth/auth.interceptor';

import {
  ACTIVITY_SERVICE,
  API_BASE_URL,
  ActivityService,
  AUTH_SERVICE,
  AuthService,
  EVENTS_SERVICE,
  EventsService,
  FAMILY_SERVICE,
  FamilyService,
  RESTAURANT_SERVICE,
  RestaurantService,
  SAVED_SERVICE,
  SESSION_STORE,
  SavedService,
  SessionStore,
  WEEKEND_PLAN_SERVICE,
  WeekendPlanService,
} from 'api';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
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

    // Auth — bound to the real HTTP `AuthService`. `SessionStore` owns the
    // persistence + error-mapping; pages depend only on `SESSION_STORE`.
    { provide: AUTH_SERVICE, useExisting: AuthService },
    { provide: SESSION_STORE, useExisting: SessionStore },
  ],
};
