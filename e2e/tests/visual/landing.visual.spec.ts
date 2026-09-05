import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Landing parity — pages/landing.html. Entirely static copy (the hero
 * miniature is built from a fixed sample weekend), so the page gets a
 * full-page baseline as well as region shots.
 */

test.describe("Visual: Landing", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("landing");
    await pages.landing.waitForReady();
    await settle();
  });

  test("matches the mock @full-page", async ({ page, pages }) => {
    // The miniature's day meta is sample copy today; masked so the app may
    // date it if the sample ever becomes live.
    await expect(page).toHaveScreenshot("landing.full.png", {
      fullPage: true,
      mask: [pages.landing.heroPreview().locator(".day__meta")],
    });
  });

  test("hero with the miniature weekend", async ({ pages }) => {
    await expect(pages.landing.hero).toHaveScreenshot("landing.hero.png", {
      mask: [pages.landing.heroPreview().locator(".day__meta")],
    });
  });

  test("'How a weekend comes together' steps", async ({ pages }) => {
    await expect(pages.landing.how).toHaveScreenshot("landing.steps.png");
  });

  test("site footer", async ({ pages }) => {
    await expect(pages.landing.footer).toHaveScreenshot("landing.footer.png");
  });
});
