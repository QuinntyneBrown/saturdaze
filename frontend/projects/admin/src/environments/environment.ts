/**
 * Runtime environment for Saturdaze Admin (ADR-014).
 *
 * `apiBaseUrl` points at the Saturdaze API, the same one the family app
 * uses; `familyAppUrl` is where "Open Saturdaze" sends a non-administrator;
 * `googleClientId` renders Google's sign-in button (L2-182).
 * Production swaps this file with `environment.prod.ts` via `fileReplacements`.
 */
export const environment = {
  apiBaseUrl: 'http://localhost:5100',
  familyAppUrl: 'http://localhost:4200',
  /**
   * OAuth client id for "Continue with Google" (L2-182, ADR-019); empty
   * hides the button. The same Saturdaze web client as the family app;
   * http://localhost:4300 must be one of its authorised origins.
   */
  googleClientId: '103934248516-lq6nd8k79v6dmg1pe48asd3q09cjptpo.apps.googleusercontent.com',
};
