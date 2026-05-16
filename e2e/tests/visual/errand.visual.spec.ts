import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Errand", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("errand");
    await pages.errand.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("errand.full.png", {
      fullPage: true,
    });
  });

  test("suggested slot callout matches the mock", async ({ pages }) => {
    await expect(pages.errand.suggestedSlotCard()).toHaveScreenshot(
      "errand.suggested-slot.png"
    );
  });
});
