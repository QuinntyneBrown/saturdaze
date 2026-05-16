import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Itinerary", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("itinerary.full.png", {
      fullPage: true,
    });
  });

  test("day header (eyebrow / title / sub + sun icon) matches the mock", async ({ page }) => {
    await expect(page.locator(".it-head")).toHaveScreenshot(
      "itinerary.head.png"
    );
  });

  test("weekend stats grid matches the mock", async ({ pages }) => {
    await expect(pages.itinerary.weekendStats()).toHaveScreenshot(
      "itinerary.stats.png"
    );
  });

  test("day switcher matches the mock", async ({ pages }) => {
    await expect(pages.itinerary.daySwitcher()).toHaveScreenshot(
      "itinerary.day-switcher.png"
    );
  });
});

test.describe("Visual: Itinerary — mobile timeline", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile timeline block-list matches the mock", async ({ goto, pages, settle, page }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
    await settle();
    await expect(page.locator("#mobile-timeline")).toHaveScreenshot(
      "itinerary.mobile-timeline.png"
    );
  });
});
