import { RouteKey } from "./routes.js";

/**
 * Screen inventory for the responsive audit and the no-horizontal-overflow
 * regression guard, split by guard type.
 *
 * `adminEvents` is absent: the page component and mock exist but there is
 * no /admin/events entry in app.routes.ts — it is only reachable in
 * SD_BASELINE (mock) mode.
 */

/** Routes behind `requireAuth` — need a signed-in session. */
export const AUTHED_ROUTES: RouteKey[] = [
  "home",
  "itinerary",
  "activities",
  "restaurants",
  "saved",
  "events",
  "eventsSubmit",
  "eventsSubmitted",
  "errand",
  "profile",
];

/** Public + `requireAnonymous` routes — need a clean session. */
export const ANON_ROUTES: RouteKey[] = [
  "splash",
  "login",
  "signup",
  "forgotPassword",
  "checkEmail",
  "resetPassword",
  "verifyEmail",
  "terms",
  "privacy",
  "sampleWeekend",
  "dialogs",
  "components",
];
