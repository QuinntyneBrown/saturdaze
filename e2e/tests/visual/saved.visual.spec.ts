import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Saved", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("saved");
    await pages.saved.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("saved.full.png", {
      fullPage: true,
    });
  });

  test("first saved card matches the mock", async ({ pages }) => {
    await expect(
      pages.saved.savedCard("Bronte Creek + Rec Room")
    ).toHaveScreenshot("saved.card.bronte.png");
  });
});
