import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Pixel-perfect parity with pages/splash.html.
 *
 * Baselines are captured once from the mock skeleton (`SD_BASELINE=1`).
 * Subsequent runs hit the Angular implementation at `/` and compare.
 *
 * Splash deliberately ships no `sd-top-bar` / `sd-bottom-nav` — public
 * visitors don't get app chrome — so the POM exposes its own `waitForReady`.
 */

test.describe("Visual: Splash", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("splash");
    await pages.splash.waitForReady();
    await settle();
  });

  test("matches the mock pixel-for-pixel @full-page", async ({ page }) => {
    await expect(page).toHaveScreenshot("splash.full.png", {
      fullPage: true,
    });
  });

  test("hero region matches the mock", async ({ pages }) => {
    await expect(pages.splash.hero).toHaveScreenshot("splash.hero.png");
  });

  test("top nav (brand + sign-in) matches the mock", async ({ pages }) => {
    await expect(pages.splash.nav).toHaveScreenshot("splash.nav.png");
  });
});
