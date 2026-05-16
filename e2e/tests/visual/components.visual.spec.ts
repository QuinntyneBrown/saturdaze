import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Component gallery", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("components");
    await pages.components.waitForComponentsReady();
    await settle();
  });

  test("full gallery matches the mock", async ({ page }) => {
    await expect(page).toHaveScreenshot("components.full.png", {
      fullPage: true,
    });
  });

  test("buttons row matches the mock", async ({ pages }) => {
    await expect(pages.components.buttonsSection()).toHaveScreenshot(
      "components.buttons.png"
    );
  });

  test("chips row matches the mock", async ({ pages }) => {
    await expect(pages.components.section("Chips")).toHaveScreenshot(
      "components.chips.png"
    );
  });

  test("avatars row matches the mock", async ({ pages }) => {
    await expect(pages.components.section("Avatars")).toHaveScreenshot(
      "components.avatars.png"
    );
  });

  test("cards stack matches the mock", async ({ pages }) => {
    await expect(pages.components.section("Cards")).toHaveScreenshot(
      "components.cards.png"
    );
  });

  test("weather strip matches the mock", async ({ pages }) => {
    await expect(pages.components.weatherStrip()).toHaveScreenshot(
      "components.weather-strip.png"
    );
  });

  test("timeline block stack matches the mock", async ({ pages }) => {
    await expect(pages.components.section("Timeline block")).toHaveScreenshot(
      "components.timeline.png"
    );
  });

  test("anticipate callout matches the mock", async ({ pages }) => {
    await expect(pages.components.anticipate()).toHaveScreenshot(
      "components.anticipate.png"
    );
  });

  test("empty state matches the mock", async ({ pages }) => {
    await expect(pages.components.emptyState()).toHaveScreenshot(
      "components.empty.png"
    );
  });
});
