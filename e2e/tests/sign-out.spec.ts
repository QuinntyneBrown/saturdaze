import { test, expect } from "../fixtures/sd-test.js";

/**
 * Behaviour specs for sign-out.
 *
 * Each test logs in as the seeded `quinntynebrown@gmail.com` / `password123`
 * row (populated by `Saturdaze.Cli.Seed.UserSeeder`), then navigates to
 * /profile in-app via the bottom-nav. In-app navigation keeps the session
 * signal populated, avoiding the rehydrate race that affects fresh page
 * loads on guarded routes.
 */

const SEEDED_EMAIL = "quinntynebrown@gmail.com";
const SEEDED_PASSWORD = "password123";

async function signInAndOpenProfile(
  page: import("@playwright/test").Page,
  goto: (key: "login") => Promise<void>,
  pages: {
    login: {
      waitForReady: () => Promise<void>;
      fillCredentials: (e: string, p: string) => Promise<void>;
      submit: () => Promise<void>;
    };
    profile: { accountSection: () => import("@playwright/test").Locator };
  },
  settle: () => Promise<void>,
): Promise<void> {
  await goto("login");
  await pages.login.waitForReady();
  await settle();
  await pages.login.fillCredentials(SEEDED_EMAIL, SEEDED_PASSWORD);
  await pages.login.submit();
  await page.waitForURL("**/weekend", { timeout: 8_000 });

  // In-app navigation via the bottom-nav (router.navigateByUrl). A
  // `page.goto('/profile')` would re-bootstrap the app and race the route
  // guard against `SessionStore.rehydrate()`.
  await page.locator('sd-bottom-nav a[data-nav-key="profile"]').click();
  await page.waitForURL("**/profile", { timeout: 8_000 });
  await pages.profile.accountSection().waitFor();
}

test.describe("Sign out: happy path", () => {
  test("confirm → /login, persisted token cleared, guard bounces back", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await signInAndOpenProfile(page, goto, pages, settle);
    await expect(pages.profile.accountEmail()).toHaveText(SEEDED_EMAIL);

    await pages.profile.clickSignOut();

    // The CDK dialog renders into the overlay container, outside the page
    // shell. Locate it by title and click the danger action.
    const dialog = page.locator('sd-dialog[title="Sign out?"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('sd-button[variant="danger"] button').click();

    await page.waitForURL("**/login", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/login");

    // SessionStore must clear both storage tiers and reset its signals — the
    // surest check is that requireAuth still blocks the protected route.
    const local = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    const session = await page.evaluate(() => sessionStorage.getItem("sd.auth.token"));
    expect(local).toBeNull();
    expect(session).toBeNull();

    await page.goto("/weekend");
    await page.waitForURL(/\/login\?returnUrl=/, { timeout: 8_000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnUrl")).toBe("/weekend");
  });
});

test.describe("Sign out: cancel", () => {
  test("stay-signed-in keeps session and stays on /profile", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await signInAndOpenProfile(page, goto, pages, settle);
    await pages.profile.clickSignOut();

    const dialog = page.locator('sd-dialog[title="Sign out?"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('sd-button[variant="secondary"] button').click();

    // The dialog goes away, the user stays where they were, and the token
    // is still in storage.
    await expect(dialog).not.toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/profile");

    const local = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    expect(local).toBeTruthy();
  });
});
