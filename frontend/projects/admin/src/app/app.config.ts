import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import {
  ADMIN_AUDIT_SERVICE,
  ADMIN_EMAIL_TEMPLATES_SERVICE,
  ADMIN_PHOTOS_SERVICE,
  ADMIN_PLACES_SERVICE,
  API_BASE_URL,
  AUTH_ROUTES,
  AUTH_SERVICE,
  AdminAuditService,
  AdminEmailTemplatesService,
  AdminPhotosService,
  AdminPlacesService,
  AuthService,
  SESSION_STORE,
  SessionStore,
  authInterceptor,
} from 'api';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

/**
 * Saturdaze Admin's composition root (ADR-014). Pages depend on tokens; this
 * host binds each token to its HTTP implementation from the `api` library,
 * mirroring the family app's `app.config.ts`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(SESSION_STORE).rehydrate()),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    // The shared guards send anonymous visitors to /sign-in and signed-in
    // visitors home; the admin home is Photo health at `/`.
    { provide: AUTH_ROUTES, useValue: { signIn: '/sign-in', home: '/' } },

    { provide: ADMIN_PLACES_SERVICE, useExisting: AdminPlacesService },
    { provide: ADMIN_PHOTOS_SERVICE, useExisting: AdminPhotosService },
    { provide: ADMIN_AUDIT_SERVICE, useExisting: AdminAuditService },
    { provide: ADMIN_EMAIL_TEMPLATES_SERVICE, useExisting: AdminEmailTemplatesService },

    { provide: AUTH_SERVICE, useExisting: AuthService },
    { provide: SESSION_STORE, useExisting: SessionStore },
  ],
};
