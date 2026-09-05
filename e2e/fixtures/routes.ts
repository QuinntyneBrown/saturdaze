/**
 * Single source of truth for which URL serves each screen (and each static
 * screen *state*).
 *
 * - The Angular app uses the v2 route table (`app.routes.ts`). Static states
 *   that the mocks render as separate files or `#state-*` specimens are
 *   reached through the dev-only `?state=` override (gated on
 *   `environment.galleryRoutes`, compile-time false in production).
 * - The mocks (`docs/mocks-v2/pages/`) use `./pages/<name>.html`, with a
 *   `#state-<id>` fragment for the stacked auth states.
 * - `guard` records which session a route needs in the Angular app, so the
 *   `goto` fixture can sign in automatically. Mock pages have no auth.
 * - `mock` is optional: app-only keys (the share link) have no mock, and
 *   `pathFor` throws for them in baseline mode so a visual spec can never
 *   silently capture the wrong thing.
 *
 * Tests reference routes by key; the fixture rewrites to the right URL
 * depending on whether we're capturing baselines (SD_BASELINE=1) or
 * verifying the Angular implementation.
 */

export type RouteGuard = "auth" | "admin";

/** `body[data-page]` value every screen stamps (route data in the app). */
export type PageSlug =
  | "weekend"
  | "ideas"
  | "past"
  | "family"
  | "review-submissions"
  | "sign-in"
  | "create-account"
  | "reset-password"
  | "verify-email"
  | "landing"
  | "legal"
  | "shared-weekend"
  | "dialogs";

interface RouteEntry {
  readonly app: string;
  readonly mock?: string;
  readonly guard?: RouteGuard;
  readonly page: PageSlug;
}

export const ROUTES = {
  // ---- core (app shell: top bar ≥720, bottom nav <720) ----
  weekend:           { app: "/weekend",                        mock: "/pages/weekend.html",                  guard: "auth",  page: "weekend" },
  weekendEmpty:      { app: "/weekend?state=empty",            mock: "/pages/weekend.empty.html",            guard: "auth",  page: "weekend" },
  weekendGenerating: { app: "/weekend?state=generating",       mock: "/pages/weekend.generating.html",       guard: "auth",  page: "weekend" },
  ideas:             { app: "/ideas",                          mock: "/pages/ideas.html",                    guard: "auth",  page: "ideas" },
  ideasFood:         { app: "/ideas/food",                     mock: "/pages/ideas.food.html",               guard: "auth",  page: "ideas" },
  ideasEvents:       { app: "/ideas/events",                   mock: "/pages/ideas.events.html",             guard: "auth",  page: "ideas" },
  past:              { app: "/past",                           mock: "/pages/past.html",                     guard: "auth",  page: "past" },
  pastEmpty:         { app: "/past?state=empty",               mock: "/pages/past.empty.html",               guard: "auth",  page: "past" },
  family:            { app: "/family",                         mock: "/pages/family.html",                   guard: "auth",  page: "family" },
  reviewSubmissions: { app: "/review-submissions",             mock: "/pages/review-submissions.html",       guard: "admin", page: "review-submissions" },
  reviewEmpty:       { app: "/review-submissions?state=empty", mock: "/pages/review-submissions.empty.html", guard: "admin", page: "review-submissions" },

  // ---- auth (bare shell; the mocks stack every state on one page) ----
  signIn:            { app: "/sign-in",                        mock: "/pages/sign-in.html#state-default",        page: "sign-in" },
  signInError:       { app: "/sign-in?state=error",            mock: "/pages/sign-in.html#state-error",          page: "sign-in" },
  createAccount:     { app: "/create-account",                 mock: "/pages/create-account.html",               page: "create-account" },
  resetRequest:      { app: "/reset-password",                 mock: "/pages/reset-password.html#state-request", page: "reset-password" },
  resetSent:         { app: "/reset-password?state=sent",      mock: "/pages/reset-password.html#state-sent",    page: "reset-password" },
  resetNew:          { app: "/reset-password?state=new",       mock: "/pages/reset-password.html#state-new",     page: "reset-password" },
  resetDone:         { app: "/reset-password?state=done",      mock: "/pages/reset-password.html#state-done",    page: "reset-password" },
  resetExpired:      { app: "/reset-password?state=expired",   mock: "/pages/reset-password.html#state-expired", page: "reset-password" },
  verifySent:        { app: "/verify-email?state=sent",        mock: "/pages/verify-email.html#state-sent",      page: "verify-email" },
  verifyVerifying:   { app: "/verify-email?state=verifying",   mock: "/pages/verify-email.html#state-verifying", page: "verify-email" },
  verifyVerified:    { app: "/verify-email?state=verified",    mock: "/pages/verify-email.html#state-verified",  page: "verify-email" },
  verifyExpired:     { app: "/verify-email?state=expired",     mock: "/pages/verify-email.html#state-expired",   page: "verify-email" },

  // ---- public (site shell: sitebar at every width) ----
  landing:           { app: "/",                               mock: "/pages/landing.html",          page: "landing" },
  legal:             { app: "/legal",                          mock: "/pages/legal.html",            page: "legal" },
  legalPrivacy:      { app: "/legal#privacy",                  mock: "/pages/legal.html#privacy",    page: "legal" },
  /** App-only. `goto` plans a weekend, mints a share link and substitutes `{token}`. */
  sharedWeekend:     { app: "/sample-weekend?share={token}",                                         page: "shared-weekend" },

  // ---- dialogs gallery (30 specimens rendered statically inline) ----
  dialogs:           { app: "/dialogs",                        mock: "/pages/dialogs.html",          page: "dialogs" },
} as const satisfies Record<string, RouteEntry>;

export type RouteKey = keyof typeof ROUTES;

export const isBaseline = (): boolean => process.env.SD_BASELINE === "1";

/** Keys that have a mock page (everything but the share link). */
export const MOCKED_ROUTES = (Object.keys(ROUTES) as RouteKey[]).filter(
  (key) => (ROUTES[key] as RouteEntry).mock !== undefined,
);

/** Keys that only exist in the Angular app. */
export const APP_ONLY_ROUTES = (Object.keys(ROUTES) as RouteKey[]).filter(
  (key) => (ROUTES[key] as RouteEntry).mock === undefined,
);

export function pathFor(key: RouteKey): string {
  const entry = ROUTES[key] as RouteEntry;
  if (!isBaseline()) return entry.app;
  if (entry.mock === undefined) {
    throw new Error(
      `Route "${key}" is app-only (no docs/mocks-v2 page) and cannot be visited in baseline mode.`,
    );
  }
  return entry.mock;
}

export function guardFor(key: RouteKey): RouteGuard | undefined {
  return (ROUTES[key] as RouteEntry).guard;
}

export function pageSlugFor(key: RouteKey): PageSlug {
  return (ROUTES[key] as RouteEntry).page;
}

/** The `#state-<id>` specimen the mock addresses for this key, if any. */
export function mockStateFor(key: RouteKey): string | undefined {
  const mock = (ROUTES[key] as RouteEntry).mock;
  const match = mock?.match(/#state-([a-z-]+)$/);
  return match?.[1];
}
