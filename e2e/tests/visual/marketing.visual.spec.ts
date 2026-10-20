import { test, expect } from "../../fixtures/sd-test.js";
import { isBaseline } from "../../fixtures/routes.js";

/**
 * Marketing site parity (ADR-010, full-page tier) — marketing/index.html
 * against docs/mocks/pages/marketing.html and its menu-open state. Runs in the
 * `marketing` project. Copy is fixed; reduced motion shows every section at
 * once on the site, as it always does on the script-less mock.
 */

for (const [label, width, height] of [
  ["mobile", 390, 844],
  ["tablet", 820, 1180],
  ["desktop", 1440, 900],
] as const) {
  test.describe(`Visual: Marketing — ${label}`, () => {
    test.use({ viewport: { width, height } });

    test("matches the mock @full-page", async ({ page, goto, pages, settle }) => {
      await pages.marketing.preferReducedMotion();
      await goto("marketing");
      await pages.marketing.waitForReady();
      await settle();
      await expect(page).toHaveScreenshot(`marketing.full.${label}.png`, { fullPage: true });
    });

    test("header", async ({ goto, pages, settle }) => {
      await pages.marketing.preferReducedMotion();
      await goto("marketing");
      await pages.marketing.waitForReady();
      await settle();
      await expect(pages.marketing.header()).toHaveScreenshot(`marketing.header.${label}.png`);
    });
  });
}

test.describe("Visual: Marketing — menu open", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("matches the mock", async ({ page, goto, pages, settle }) => {
    await pages.marketing.preferReducedMotion();
    await goto(isBaseline() ? "marketingMenuOpen" : "marketing");
    await pages.marketing.waitForReady();
    if (!isBaseline()) await pages.marketing.menuButton().click();
    await settle();
    await expect(page).toHaveScreenshot("marketing.menu-open.png");
  });
});
