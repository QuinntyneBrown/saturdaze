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
   * OAuth client id for "Continue with Google" (L2-158, ADR-019); empty
   * hides the button. The dev id is a placeholder: Google's button renders
   * but a real sign-in needs a client from console.cloud.google.com whose
   * authorised origin is http://localhost:4200, set here and as
   * `Saturdaze:Google:ClientId` on the API.
   */
  googleClientId: 'saturdaze-dev.apps.googleusercontent.com',
};
