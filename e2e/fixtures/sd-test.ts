/**
 * The Saturdaze test fixture.
 *
 * Wraps `@playwright/test`'s `test` with:
 *   - `goto(routeKey, opts?)` — navigates to the right URL for whichever
 *     target we're hitting (mocks vs Angular) and, in app mode, signs in
 *     first when the route is guarded (pass `{ anonymous: true }` to skip).
 *     `sharedWeekend` is app-only: the fixture signs in through the API,
 *     makes sure a weekend exists, mints a share link and opens it without
 *     seeding a browser session.
 *   - `signIn(creds?, seed?)` / `signInAsAdmin()` — API login + storage seed,
 *     memoised per test so several `goto`s share one session.
 *   - `pages` — namespaced POMs (e.g. `pages.weekend`, `pages.ideas`).
 *   - `settle()` — wait for fonts + network idle so visual diffs are stable.
 *
 * Specs should import `test` and `expect` from this file, not from
 * `@playwright/test` directly, so the routing/pom wiring is consistent.
 */

import { test as base, expect, TestInfo } from "@playwright/test";
import { guardFor, isBaseline, pathFor, RouteKey } from "./routes.js";
import {
  apiLogin,
  Credentials,
  ensureCurrentWeekend,
  SEEDED_ADMIN,
  SEEDED_USER,
  seedSession,
  SeedOptions,
  shareWeekend,
  TestSession,
} from "./auth.js";

import { WeekendPage } from "../pages/weekend.page.js";
import { IdeasPage } from "../pages/ideas.page.js";
import { PastPage } from "../pages/past.page.js";
import { FamilyPage } from "../pages/family.page.js";
import { ReviewSubmissionsPage } from "../pages/review-submissions.page.js";
import { SignInPage } from "../pages/sign-in.page.js";
import { CreateAccountPage } from "../pages/create-account.page.js";
import { ResetPasswordPage } from "../pages/reset-password.page.js";
import { VerifyEmailPage } from "../pages/verify-email.page.js";
import { LandingPage } from "../pages/landing.page.js";
import { LegalPage } from "../pages/legal.page.js";
import { DialogsPage } from "../pages/dialogs.page.js";
import { SharedWeekendPage } from "../pages/shared-weekend.page.js";

interface Pages {
  weekend: WeekendPage;
  ideas: IdeasPage;
  past: PastPage;
  family: FamilyPage;
  reviewSubmissions: ReviewSubmissionsPage;
  signIn: SignInPage;
  createAccount: CreateAccountPage;
  resetPassword: ResetPasswordPage;
  verifyEmail: VerifyEmailPage;
  landing: LandingPage;
  legal: LegalPage;
  dialogs: DialogsPage;
  sharedWeekend: SharedWeekendPage;
}

export interface GotoOptions {
  /** Skip the automatic sign-in even for a guarded route. */
  readonly anonymous?: boolean;
  /** Force a particular session for an unguarded route (e.g. `/sign-in` as a signed-in user). */
  readonly as?: "user" | "admin";
}

interface SdFixtures {
  goto: (key: RouteKey, opts?: GotoOptions) => Promise<void>;
  signIn: (creds?: Credentials, seed?: SeedOptions) => Promise<TestSession | null>;
  signInAsAdmin: () => Promise<TestSession | null>;
  pages: Pages;
  /** Pause until web fonts have loaded and the network is idle so visual diffs are stable. */
  settle: () => Promise<void>;
}

/** Bottom nav / sheets below 720px; top bar / anchored menus at and above. */
export function isPhone(testInfo: TestInfo): boolean {
  return (testInfo.project.use.viewport?.width ?? 1440) < 720;
}

export const test = base.extend<SdFixtures>({
  signIn: async ({ page, request }, use) => {
    let active: TestSession | null = null;
    await use(async (creds = SEEDED_USER, seed) => {
      if (isBaseline()) return null; // the mocks have no auth
      if (active && active.user.email === creds.email && !seed) return active;
      active = await apiLogin(request, creds);
      await seedSession(page, active, seed);
      return active;
    });
  },

  signInAsAdmin: async ({ signIn }, use) => {
    await use(() => signIn(SEEDED_ADMIN));
  },

  goto: async ({ page, request, signIn, signInAsAdmin }, use) => {
    await use(async (key, opts = {}) => {
      if (key === "sharedWeekend" && !isBaseline()) {
        // The share URL is minted per test: API login (no browser seed
        // unless asked), make sure a weekend exists, POST share.
        const owner = await apiLogin(request, SEEDED_USER);
        const weekend = await ensureCurrentWeekend(request, owner);
        const link = await shareWeekend(request, owner, weekend.id);
        if (opts.as === "admin") await signInAsAdmin();
        else if (opts.as === "user") await signIn();
        await page.goto(pathFor(key).replace("{token}", encodeURIComponent(link.token)));
        return;
      }

      if (!opts.anonymous && !isBaseline()) {
        const guard = guardFor(key);
        const who = opts.as ?? (guard === "admin" ? "admin" : guard === "auth" ? "user" : undefined);
        if (who === "admin") await signInAsAdmin();
        else if (who === "user") await signIn();
      }
      await page.goto(pathFor(key));
    });
  },

  pages: async ({ page }, use) => {
    await use({
      weekend: new WeekendPage(page),
      ideas: new IdeasPage(page),
      past: new PastPage(page),
      family: new FamilyPage(page),
      reviewSubmissions: new ReviewSubmissionsPage(page),
      signIn: new SignInPage(page),
      createAccount: new CreateAccountPage(page),
      resetPassword: new ResetPasswordPage(page),
      verifyEmail: new VerifyEmailPage(page),
      landing: new LandingPage(page),
      legal: new LegalPage(page),
      dialogs: new DialogsPage(page),
      sharedWeekend: new SharedWeekendPage(page),
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
