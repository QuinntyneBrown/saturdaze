/**
 * Single source of truth for which URL serves each screen.
 *
 * - The Angular app uses clean routes that mirror the mock filenames.
 * - The mock skeleton uses `./pages/<name>.html` under the static server.
 *
 * Tests reference routes by key; the fixture rewrites to the right URL
 * depending on whether we're capturing baselines (SD_BASELINE=1) or
 * verifying the Angular implementation.
 */

export const ROUTES = {
  home:           { app: "/weekend",          mock: "/pages/home.html" },
  itinerary:      { app: "/itinerary",        mock: "/pages/itinerary.html" },
  activities:     { app: "/activities",       mock: "/pages/activities.html" },
  restaurants:    { app: "/restaurants",      mock: "/pages/restaurants.html" },
  saved:          { app: "/saved",            mock: "/pages/saved.html" },
  events:         { app: "/events",           mock: "/pages/events.html" },
  eventsSubmit:   { app: "/events/submit",    mock: "/pages/events.submit.html" },
  eventsSubmitted:{ app: "/events/submitted", mock: "/pages/events.submitted.html" },
  adminEvents:    { app: "/admin/events",     mock: "/pages/admin.events.html" },
  errand:         { app: "/errand",           mock: "/pages/errand.html" },
  profile:        { app: "/profile",          mock: "/pages/profile.html" },
  dialogs:        { app: "/dialogs",          mock: "/pages/dialogs.html" },
  components:     { app: "/components",       mock: "/pages/components.html" },

  // Auth flow (per docs/auth-implementation-plan.md). Each app route is
  // implemented in a later slice; the mock skeletons are authoritative for
  // visual baselines today.
  splash:         { app: "/",                 mock: "/pages/splash.html" },
  login:          { app: "/login",            mock: "/pages/login.html" },
  signup:         { app: "/signup",           mock: "/pages/signup.html" },
  forgotPassword: { app: "/forgot-password",  mock: "/pages/forgot-password.html" },
  checkEmail:     { app: "/check-email",      mock: "/pages/check-email.html" },
  resetPassword:  { app: "/reset-password",   mock: "/pages/reset-password.html" },
  verifyEmail:    { app: "/verify-email",     mock: "/pages/verify-email.html" },
} as const;

export type RouteKey = keyof typeof ROUTES;

export function pathFor(key: RouteKey): string {
  return process.env.SD_BASELINE === "1"
    ? ROUTES[key].mock
    : ROUTES[key].app;
}
