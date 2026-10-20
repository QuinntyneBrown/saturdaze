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
};
