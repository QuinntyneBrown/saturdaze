/**
 * Runtime environment for the Angular app.
 *
 * `apiBaseUrl` points at the Saturdaze API. Override per environment via
 * `fileReplacements` in `angular.json`. In development the default is the
 * locally running API process. In production the build should swap this
 * file with `environment.prod.ts` carrying the production origin.
 *
 * `siteUrl` is the marketing site the wordmark and "Back to Saturdaze" lead
 * to (ADR-018): `marketing/` served by `e2e/fixtures/marketing-server.mjs` in
 * development, https://www.saturdaze.ca in production.
 */
export const environment = {
  apiBaseUrl: 'http://localhost:5100',
  siteUrl: 'http://localhost:4500/',
  galleryRoutes: true,
  /**
   * OAuth client id for "Continue with Google" (L2-164, ADR-019); empty
   * hides the button. This is the Saturdaze web client from the Saturdaze
   * project in console.cloud.google.com; http://localhost:4200 is one of
   * its authorised origins, so a real sign-in works locally when the API
   * has the same id as `Saturdaze:Google:ClientId`.
   */
  googleClientId: '103934248516-lq6nd8k79v6dmg1pe48asd3q09cjptpo.apps.googleusercontent.com',
};
