import { isBaseline, MOCKED_ROUTES, RouteKey } from "./routes.js";

/**
 * Screen inventory for the responsive audit and the no-horizontal-overflow
 * regression guard, split by guard type (11 + 11).
 *
 * The auth pages stack all their states on one mock file, so the state
 * keys below dedupe to the same capture in mock mode but exercise distinct
 * cards in the app. `sharedWeekend` has no mock: `auditable()` drops it in
 * baseline mode (21 routes) and keeps it against the app (22 routes), where
 * the `goto` fixture mints the share link.
 */

/** Routes behind `requireAuth` / `requireAdmin` — need a signed-in session. */
export const AUTHED_ROUTES: RouteKey[] = [
  "weekend",
  "weekendEmpty",
  "weekendGenerating",
  "ideas",
  "ideasFood",
  "ideasEvents",
  "past",
  "pastEmpty",
  "family",
  "reviewSubmissions",
  "reviewEmpty",
];

/** Public + `requireAnonymous` routes — need a clean session. */
export const ANON_ROUTES: RouteKey[] = [
  "landing",
  "signIn",
  "createAccount",
  "resetRequest",
  "resetExpired",
  "verifyVerified",
  "verifyExpired",
  "legal",
  "legalPrivacy",
  "dialogs",
  "sharedWeekend",
];

/** The keys of `list` that can be visited in the current mode. */
export function auditable(list: RouteKey[]): RouteKey[] {
  return isBaseline() ? list.filter((key) => MOCKED_ROUTES.includes(key)) : list;
}
