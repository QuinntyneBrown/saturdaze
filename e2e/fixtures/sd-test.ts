/**
 * The Saturdaze test fixture.
 *
 * Wraps `@playwright/test`'s `test` with:
 *   - `goto(routeKey, opts?)` — navigates to the right URL for whichever
 *     target we're hitting (mock vs Angular) and, in app mode, signs in
 *     first when the route is guarded (pass `{ anonymous: true }` to skip).
 *   - `signIn(creds?, seed?)` / `signInAsAdmin()` — API login + storage seed,
 *     memoised per test so several `goto`s share one session.
 *   - `pages` — namespaced POMs (e.g. `pages.home`, `pages.itinerary`).
 *   - `settle()` — wait for fonts + network idle so visual diffs are stable.
 *
 * Specs should import `test` and `expect` from this file, not from
 * `@playwright/test` directly, so the routing/pom wiring is consistent.
 */

import { test as base, expect } from "@playwright/test";
import { guardFor, pathFor, RouteKey } from "./routes.js";
import {
  apiLogin,
  Credentials,
  SEEDED_ADMIN,
  SEEDED_USER,
  seedSession,
  SeedOptions,
  TestSession,
} from "./auth.js";

import { HomePage } from "../pages/home.page.js";
import { ItineraryPage } from "../pages/itinerary.page.js";
import { ActivitiesPage } from "../pages/activities.page.js";
import { RestaurantsPage } from "../pages/restaurants.page.js";
import { SavedPage } from "../pages/saved.page.js";
import { EventsPage } from "../pages/events.page.js";
import { EventsSubmitPage } from "../pages/events-submit.page.js";
import { EventsSubmittedPage } from "../pages/events-submitted.page.js";
import { AdminEventsPage } from "../pages/admin-events.page.js";
import { ErrandPage } from "../pages/errand.page.js";
import { ProfilePage } from "../pages/profile.page.js";
import { DialogsPage } from "../pages/dialogs.page.js";
import { ComponentsGalleryPage } from "../pages/components.page.js";
import { SplashPage } from "../pages/splash.page.js";
import { LoginPage } from "../pages/login.page.js";
import { SignupPage } from "../pages/signup.page.js";
import { ForgotPasswordPage } from "../pages/forgot-password.page.js";
import { CheckEmailPage } from "../pages/check-email.page.js";
import { ResetPasswordPage } from "../pages/reset-password.page.js";
import { VerifyEmailPage } from "../pages/verify-email.page.js";

interface Pages {
  home: HomePage;
  itinerary: ItineraryPage;
  activities: ActivitiesPage;
  restaurants: RestaurantsPage;
  saved: SavedPage;
  events: EventsPage;
  eventsSubmit: EventsSubmitPage;
  eventsSubmitted: EventsSubmittedPage;
  adminEvents: AdminEventsPage;
  errand: ErrandPage;
  profile: ProfilePage;
  dialogs: DialogsPage;
  components: ComponentsGalleryPage;
  splash: SplashPage;
  login: LoginPage;
  signup: SignupPage;
  forgotPassword: ForgotPasswordPage;
  checkEmail: CheckEmailPage;
  resetPassword: ResetPasswordPage;
  verifyEmail: VerifyEmailPage;
}

export interface GotoOptions {
  /** Skip the automatic sign-in even for a guarded route. */
  readonly anonymous?: boolean;
  /** Force a particular session for an unguarded route (e.g. `/login` as a signed-in user). */
  readonly as?: "user" | "admin";
}

interface SdFixtures {
  goto: (key: RouteKey, opts?: GotoOptions) => Promise<void>;
  signIn: (creds?: Credentials, seed?: SeedOptions) => Promise<TestSession | null>;
  signInAsAdmin: () => Promise<TestSession | null>;
  pages: Pages;
  /** Pause until web fonts have loaded so visual diffs are font-stable. */
  settle: () => Promise<void>;
}

const isBaseline = (): boolean => process.env.SD_BASELINE === "1";

export const test = base.extend<SdFixtures>({
  signIn: async ({ page, request }, use) => {
    let active: TestSession | null = null;
    await use(async (creds = SEEDED_USER, seed) => {
      if (isBaseline()) return null; // the mock skeleton has no auth
      if (active && active.user.email === creds.email && !seed) return active;
      active = await apiLogin(request, creds);
      await seedSession(page, active, seed);
      return active;
    });
  },

  signInAsAdmin: async ({ signIn }, use) => {
    await use(() => signIn(SEEDED_ADMIN));
  },

  goto: async ({ page, signIn, signInAsAdmin }, use) => {
    await use(async (key, opts = {}) => {
      if (!opts.anonymous && !isBaseline()) {
        const guard = guardFor(key);
        if (opts.as === "admin" || guard === "admin") await signInAsAdmin();
        else if (opts.as === "user" || guard === "auth") await signIn();
      }
      await page.goto(pathFor(key));
    });
  },

  pages: async ({ page }, use) => {
    await use({
      home: new HomePage(page),
      itinerary: new ItineraryPage(page),
      activities: new ActivitiesPage(page),
      restaurants: new RestaurantsPage(page),
      saved: new SavedPage(page),
      events: new EventsPage(page),
      eventsSubmit: new EventsSubmitPage(page),
      eventsSubmitted: new EventsSubmittedPage(page),
      adminEvents: new AdminEventsPage(page),
      errand: new ErrandPage(page),
      profile: new ProfilePage(page),
      dialogs: new DialogsPage(page),
      components: new ComponentsGalleryPage(page),
      splash: new SplashPage(page),
      login: new LoginPage(page),
      signup: new SignupPage(page),
      forgotPassword: new ForgotPasswordPage(page),
      checkEmail: new CheckEmailPage(page),
      resetPassword: new ResetPasswordPage(page),
      verifyEmail: new VerifyEmailPage(page),
    });
  },

  settle: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(async () => {
        const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
        if (fonts?.ready) await fonts.ready;
      });
      await page.waitForLoadState("networkidle");
    });
  },
});

export { expect };
