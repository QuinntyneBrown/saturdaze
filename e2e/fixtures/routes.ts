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
  home:        { app: "/",            mock: "/pages/home.html" },
  itinerary:   { app: "/itinerary",   mock: "/pages/itinerary.html" },
  activities:  { app: "/activities",  mock: "/pages/activities.html" },
  restaurants: { app: "/restaurants", mock: "/pages/restaurants.html" },
  saved:       { app: "/saved",       mock: "/pages/saved.html" },
  events:      { app: "/events",      mock: "/pages/events.html" },
  errand:      { app: "/errand",      mock: "/pages/errand.html" },
  profile:     { app: "/profile",     mock: "/pages/profile.html" },
  dialogs:     { app: "/dialogs",     mock: "/pages/dialogs.html" },
  components:  { app: "/components",  mock: "/pages/components.html" },
} as const;

export type RouteKey = keyof typeof ROUTES;

export function pathFor(key: RouteKey): string {
  return process.env.SD_BASELINE === "1"
    ? ROUTES[key].mock
    : ROUTES[key].app;
}
