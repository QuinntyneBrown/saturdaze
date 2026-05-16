import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Activities", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("activities");
    await pages.activities.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("activities.full.png", {
      fullPage: true,
    });
  });

  test("Terre Bleu activity card matches the mock", async ({ pages }) => {
    await expect(
      pages.activities.activityCard("Terre Bleu Lavender Farm")
    ).toHaveScreenshot("activities.card.terre-bleu.png");
  });

  test("filter chip row matches the mock", async ({ page }) => {
    await expect(page.locator("sd-tag-group").first()).toHaveScreenshot(
      "activities.filter-chips.png"
    );
  });
});
