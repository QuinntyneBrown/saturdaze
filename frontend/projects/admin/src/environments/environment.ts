/**
 * Runtime environment for Saturdaze Admin (ADR-014).
 *
 * `apiBaseUrl` points at the Saturdaze API, the same one the family app
 * uses; `familyAppUrl` is where "Open Saturdaze" sends a non-administrator.
 * Production swaps this file with `environment.prod.ts` via `fileReplacements`.
 */
export const environment = {
  apiBaseUrl: 'http://localhost:5100',
  familyAppUrl: 'http://localhost:4200',
};
