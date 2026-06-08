import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Admin event moderation", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("adminEvents");
    await pages.adminEvents.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("admin-events.full.png", { fullPage: true });
  });
});
