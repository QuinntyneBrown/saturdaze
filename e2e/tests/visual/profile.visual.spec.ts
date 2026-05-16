import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Profile", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("profile");
    await pages.profile.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("profile.full.png", {
      fullPage: true,
    });
  });

  test("members section matches the mock", async ({ pages }) => {
    await expect(pages.profile.membersSection()).toHaveScreenshot(
      "profile.members.png"
    );
  });

  test("preferences card matches the mock", async ({ pages }) => {
    await expect(pages.profile.preferencesSection()).toHaveScreenshot(
      "profile.preferences.png"
    );
  });
});
