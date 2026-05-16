import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Restaurants", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("restaurants");
    await pages.restaurants.waitForComponentsReady();
    await settle();
  });

  test("full page matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("restaurants.full.png", {
      fullPage: true,
    });
  });

  test("La Marina top-pick card matches the mock", async ({ pages }) => {
    await expect(
      pages.restaurants.restaurantCard("La Marina")
    ).toHaveScreenshot("restaurants.card.la-marina.png");
  });

  test("filter chip row matches the mock", async ({ pages }) => {
    await expect(pages.restaurants.filterChips().first().locator("..")).toHaveScreenshot(
      "restaurants.filter-chips.png"
    );
  });
});
