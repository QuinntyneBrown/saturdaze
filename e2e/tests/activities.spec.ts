import { test, expect } from "../fixtures/sd-test.js";

/**
 * Activity suggestions (Discover) against the seeded catalogue.
 */

test.describe("Activity suggestions (Discover)", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("activities");
    await pages.activities.waitForComponentsReady();
    await expect(pages.activities.allActivityCards().first()).toBeVisible();
  });

  test("top bar reads Discover, has back link and 'Try something new' action", async ({ pages }) => {
    await expect(pages.activities.topBarTitle()).toHaveText("Discover");
    await expect(pages.activities.topBarBackLink()).toBeVisible();
    await expect(pages.activities.trySomethingNewButton()).toBeVisible();
  });

  test("renders a lede built from the family profile", async ({ pages, page }) => {
    await expect(pages.activities.headingTitle()).toBeVisible();
    await expect(page.locator(".activities-lede p")).toHaveText(/close to Port Credit/);
  });

  test("filter chips render in the documented order", async ({ pages }) => {
    const labels = ["All", "Outdoor", "Indoor", "< 30 min", "Ages 5+", "Weather-safe"];
    await expect(pages.activities.filterChips()).toHaveCount(labels.length);
    for (let i = 0; i < labels.length; i++) {
      await expect(pages.activities.filterChips().nth(i)).toContainText(labels[i]!);
    }
    await expect(pages.activities.filterChips().nth(0)).toHaveAttribute("tone", "primary");
  });

  test("three suggestion sections appear, each capped at three cards", async ({ pages }) => {
    for (const section of [
      pages.activities.weatherFitSection(),
      pages.activities.ifWeatherTurnsSection(),
      pages.activities.trySomethingNewSection(),
    ]) {
      await expect(section).toBeVisible();
      expect(await section.locator("sd-activity-card").count()).toBeLessThanOrEqual(3);
    }
    await expect(pages.activities.weatherFitSection().locator("sd-activity-card").first()).toBeVisible();
  });

  test("'Try something new' cards are tagged First time", async ({ pages }) => {
    const cards = pages.activities.trySomethingNewSection().locator("sd-activity-card");
    const n = await cards.count();
    for (let i = 0; i < n; i++) await expect(cards.nth(i)).toHaveAttribute("tag", "First time");
  });

  test("cards carry drive time and an age range from the catalogue", async ({ pages }) => {
    const card = pages.activities.allActivityCards().first();
    await expect(card).toHaveAttribute("drive", /^\d+ min$/);
    await expect(card).toHaveAttribute("ages", /.+/);
  });

  test("'Indoor' hides outdoor activities and highlights the chip", async ({ pages }) => {
    await pages.activities.filterChip("Indoor").click();
    await expect(pages.activities.filterChip("Indoor")).toHaveAttribute("tone", "primary");
    await expect(pages.activities.filterChip("Indoor")).toHaveAttribute("aria-pressed", "true");
    await expect(pages.activities.activityCard("Terre Bleu Lavender Farm")).toHaveCount(0);
    await expect(pages.activities.activityCard("Ontario Science Centre")).toBeVisible();
  });

  test("the sparkle action opens the surprise dialog", async ({ pages, page }) => {
    await pages.activities.trySomethingNewButton().click();
    const dialog = page.locator("sd-dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("bottom nav highlights the activities tab", async ({ pages }) => {
    await expect(pages.activities.activeNavKey()).toHaveAttribute("href", /\/activities$/);
  });
});
