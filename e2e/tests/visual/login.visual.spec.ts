import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Pixel-perfect parity with pages/login.html.
 *
 * Baselines captured once from the mock skeleton (`SD_BASELINE=1`); the
 * verify pass hits the Angular `/login` route.
 *
 * The login mock has no top-bar / bottom-nav (signed-out chrome) — the POM
 * exposes its own `waitForReady` via `AuthShellPage`.
 */

test.describe("Visual: Login", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();
  });

  test("matches the mock pixel-for-pixel @full-page", async ({ page }) => {
    await expect(page).toHaveScreenshot("login.full.png", {
      fullPage: true,
    });
  });

  test("auth card matches the mock", async ({ pages }) => {
    await expect(pages.login.authCard).toHaveScreenshot("login.card.png");
  });
});
