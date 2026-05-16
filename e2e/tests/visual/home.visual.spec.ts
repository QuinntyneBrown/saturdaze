import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Pixel-perfect parity with pages/home.html.
 *
 * The baselines are generated once from the mock skeleton (run
 * `npm run e2e:baseline`). Subsequent runs hit the Angular implementation
 * at the same path and compare. The baselines are per-viewport, written
 * into `home.visual.spec.ts-snapshots/`.
 */

test.describe("Visual: Home", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("home");
    await pages.home.waitForComponentsReady();
    await settle();
  });

  test("matches the mock pixel-for-pixel @full-page", async ({ page }) => {
    await expect(page).toHaveScreenshot("home.full.png", {
      fullPage: true,
    });
  });

  test("hero region matches the mock", async ({ pages }) => {
    await expect(pages.home.hero).toHaveScreenshot("home.hero.png");
  });

  test("weather strip matches the mock", async ({ pages }) => {
    await expect(pages.home.weatherStrip()).toHaveScreenshot(
      "home.weather-strip.png"
    );
  });

  test("Saturday day card matches the mock", async ({ pages }) => {
    await expect(pages.home.dayCard("Saturday")).toHaveScreenshot(
      "home.day-card.sat.png"
    );
  });

  test("Sunday day card matches the mock", async ({ pages }) => {
    await expect(pages.home.dayCard("Sunday")).toHaveScreenshot(
      "home.day-card.sun.png"
    );
  });

  test("anticipate callouts match the mock", async ({ pages }) => {
    await expect(pages.home.anticipateSection()).toHaveScreenshot(
      "home.anticipate.png"
    );
  });

  test("quick actions match the mock", async ({ pages }) => {
    await expect(pages.home.quickActionsSection()).toHaveScreenshot(
      "home.quick-actions.png"
    );
  });

  test("bottom nav matches the mock", async ({ pages }) => {
    await expect(pages.home.bottomNav).toHaveScreenshot("home.bottom-nav.png");
  });
});

test.describe("Visual: Home — desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("detail pane matches the mock", async ({ goto, pages, settle }) => {
    await goto("home");
    await pages.home.waitForComponentsReady();
    await settle();
    await expect(pages.home.detailPane()).toHaveScreenshot(
      "home.detail-pane.png"
    );
  });
});
