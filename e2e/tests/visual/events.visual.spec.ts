import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Events", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("events");
    await pages.events.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("events.full.png", {
      fullPage: true,
    });
  });

  test("Terre Bleu event card matches the mock", async ({ pages }) => {
    await expect(
      pages.events.eventCard("Terre Bleu — Lavender Bloom Opening")
    ).toHaveScreenshot("events.card.terre-bleu.png");
  });
});
