import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Submit an event", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("eventsSubmit");
    await pages.eventsSubmit.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("events-submit.full.png", { fullPage: true });
  });
});
