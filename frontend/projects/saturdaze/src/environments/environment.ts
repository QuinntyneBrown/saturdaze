/**
 * Runtime environment for the Angular app.
 *
 * `apiBaseUrl` points at the Saturdaze API. Override per environment via
 * `fileReplacements` in `angular.json`. In development the default is the
 * locally running API process. In production the build should swap this
 * file with `environment.prod.ts` carrying the production origin.
 */
export const environment = {
  apiBaseUrl: 'http://localhost:5100',
};
