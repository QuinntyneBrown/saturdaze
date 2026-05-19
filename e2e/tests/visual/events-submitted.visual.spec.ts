import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Event submitted", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("eventsSubmitted");
    await pages.eventsSubmitted.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("events-submitted.full.png", { fullPage: true });
  });
});
