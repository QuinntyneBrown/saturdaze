// Traces to: L2-151, L2-152
import { test, expect } from "../../fixtures/sd-test.js";

for (const [width, height] of [
  [390, 844],
  [820, 1180],
  [1440, 900],
]) {
  test(`Given a ${width}px wide screen, when the marketing page loads, then nothing scrolls sideways`, async ({ page, goto, pages }) => {
    await page.setViewportSize({ width, height });
    await goto("marketing");
    await pages.marketing.waitForReady();
    expect(await pages.marketing.sidewaysScroll()).toBeLessThanOrEqual(0);
  });
}

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ goto, pages }) => {
    await goto("marketing");
    await pages.marketing.waitForReady();
  });

  test("Given the closed menu, when its button is used from the keyboard, then it opens and Escape closes it again", async ({ page, pages }) => {
    const marketing = pages.marketing;
    await expect(marketing.menuButton()).toHaveAccessibleName("Open navigation");
    await expect(marketing.menuButton()).toHaveAttribute("aria-controls", "mobile-menu");
    await expect(marketing.menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(await marketing.isMenuInert()).toBe(true);

    await marketing.menuButton().focus();
    await page.keyboard.press("Enter");
    await expect(marketing.menuButton()).toHaveAttribute("aria-expanded", "true");
    await expect(marketing.menuButton()).toHaveAccessibleName("Close navigation");
    expect(await marketing.isMenuInert()).toBe(false);
    await expect(marketing.mobileMenuLink("How it works")).toBeVisible();
    await expect(marketing.mobileMenuLink("Open the app")).toHaveAttribute("href", "https://app.saturdaze.ca/sign-in");

    await page.keyboard.press("Escape");
    await expect(marketing.menuButton()).toHaveAttribute("aria-expanded", "false");
    await expect(marketing.menuButton()).toHaveAccessibleName("Open navigation");
    expect(await marketing.isMenuInert()).toBe(true);
  });

  test("Given the open menu, when a link is chosen, then the menu closes", async ({ pages }) => {
    const marketing = pages.marketing;
    await marketing.menuButton().click();
    await marketing.mobileMenuLink("How it works").click();
    await expect(marketing.menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(await marketing.isMenuInert()).toBe(true);
  });
});

test("Given motion is allowed, then sections below the fold wait to rise into view", async ({ goto, pages }) => {
  await goto("marketing");
  await pages.marketing.waitForReady();
  expect((await pages.marketing.revealed()).some((shown) => !shown)).toBe(true);
});

test.describe("with reduced motion", () => {
  test("Given reduced motion is requested, when the page loads, then every section is shown at once", async ({ goto, pages }) => {
    await pages.marketing.preferReducedMotion();
    await goto("marketing");
    await pages.marketing.waitForReady();
    const shown = await pages.marketing.revealed();
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every(Boolean)).toBe(true);
  });
});
