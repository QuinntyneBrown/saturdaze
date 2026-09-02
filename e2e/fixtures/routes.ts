/**
 * Single source of truth for which URL serves each screen.
 *
 * - The Angular app uses clean routes that mirror the mock filenames.
 * - The mock skeleton uses `./pages/<name>.html` under the static server.
 * - `guard` records which session a route needs in the Angular app, so the
 *   `goto` fixture can sign in automatically. Mock pages have no auth.
 *
 * Tests reference routes by key; the fixture rewrites to the right URL
 * depending on whether we're capturing baselines (SD_BASELINE=1) or
 * verifying the Angular implementation.
 */

export type RouteGuard = "auth" | "admin";

interface RouteEntry {
  readonly app: string;
  readonly mock: string;
  readonly guard?: RouteGuard;
}

export const ROUTES = {
  home:           { app: "/weekend",          mock: "/pages/home.html",             guard: "auth" },
  itinerary:      { app: "/itinerary",        mock: "/pages/itinerary.html",        guard: "auth" },
  activities:     { app: "/activities",       mock: "/pages/activities.html",       guard: "auth" },
  restaurants:    { app: "/restaurants",      mock: "/pages/restaurants.html",      guard: "auth" },
  saved:          { app: "/saved",            mock: "/pages/saved.html",            guard: "auth" },
  events:         { app: "/events",           mock: "/pages/events.html",           guard: "auth" },
  eventsSubmit:   { app: "/events/submit",    mock: "/pages/events.submit.html",    guard: "auth" },
  eventsSubmitted:{ app: "/events/submitted", mock: "/pages/events.submitted.html", guard: "auth" },
  adminEvents:    { app: "/admin/events",     mock: "/pages/admin.events.html",     guard: "admin" },
  errand:         { app: "/errand",           mock: "/pages/errand.html",           guard: "auth" },
  profile:        { app: "/profile",          mock: "/pages/profile.html",          guard: "auth" },
  dialogs:        { app: "/dialogs",          mock: "/pages/dialogs.html" },
  components:     { app: "/components",       mock: "/pages/components.html" },

  terms:          { app: "/terms",            mock: "/pages/terms.html" },
  privacy:        { app: "/privacy",          mock: "/pages/privacy.html" },
  sampleWeekend:  { app: "/sample-weekend",   mock: "/pages/sample-weekend.html" },

  splash:         { app: "/",                 mock: "/pages/splash.html" },
  login:          { app: "/login",            mock: "/pages/login.html" },
  signup:         { app: "/signup",           mock: "/pages/signup.html" },
  forgotPassword: { app: "/forgot-password",  mock: "/pages/forgot-password.html" },
  checkEmail:     { app: "/check-email",      mock: "/pages/check-email.html" },
  resetPassword:  { app: "/reset-password",   mock: "/pages/reset-password.html" },
  verifyEmail:    { app: "/verify-email",     mock: "/pages/verify-email.html" },
} as const satisfies Record<string, RouteEntry>;

export type RouteKey = keyof typeof ROUTES;

export function pathFor(key: RouteKey): string {
  return process.env.SD_BASELINE === "1"
    ? ROUTES[key].mock
    : ROUTES[key].app;
}

export function guardFor(key: RouteKey): RouteGuard | undefined {
  return (ROUTES[key] as RouteEntry).guard;
}
