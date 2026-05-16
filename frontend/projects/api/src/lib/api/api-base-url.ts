import { InjectionToken } from '@angular/core';

/**
 * Base URL for the Saturdaze API. The application's bootstrap (or a test
 * harness) provides this token. Services in the api library never reach
 * into the application's environment object directly — they consume this
 * token so the library stays standalone.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
