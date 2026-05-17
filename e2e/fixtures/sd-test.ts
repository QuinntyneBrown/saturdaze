/**
 * The Saturdaze test fixture.
 *
 * Wraps `@playwright/test`'s `test` with:
 *   - `goto(routeKey)` — navigates to the right URL for whichever target
 *     we're hitting (mock vs Angular).
 *   - `pages` — namespaced POMs (e.g. `pages.home`, `pages.itinerary`).
 *
 * Specs should import `test` and `expect` from this file, not from
 * `@playwright/test` directly, so the routing/pom wiring is consistent.
 */

import { test as base, expect, Page } from "@playwright/test";
import { pathFor, RouteKey } from "./routes.js";

import { HomePage } from "../pages/home.page.js";
import { ItineraryPage } from "../pages/itinerary.page.js";
import { ActivitiesPage } from "../pages/activities.page.js";
import { RestaurantsPage } from "../pages/restaurants.page.js";
import { SavedPage } from "../pages/saved.page.js";
import { EventsPage } from "../pages/events.page.js";
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

interface SdFixtures {
  goto: (key: RouteKey) => Promise<void>;
  pages: Pages;
  /** Pause until web fonts have loaded so visual diffs are font-stable. */
  settle: () => Promise<void>;
}

export const test = base.extend<SdFixtures>({
  goto: async ({ page }, use) => {
    await use(async (key: RouteKey) => {
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
        if ((document as any).fonts && (document as any).fonts.ready) {
          await (document as any).fonts.ready;
        }
      });
      await page.waitForLoadState("networkidle");
    });
  },
});

export { expect };

/** Helper to take a viewport-scoped screenshot name based on the project. */
export function screenshotName(page: Page, key: string): string {
  return `${key}.png`;
}
