import { test, expect, isPhone } from "../fixtures/sd-test.js";
import { NavKey } from "../pages/base.page.js";

/**
 * Navigation chrome — four nav items in both chromes (bottom nav <720,
 * top bar ≥720), `aria-current` tracking, the brand link, the account menu
 * (D26) and Ideas' nested segments. Hrefs are real routes so direct open,
 * copy-link and modifier-click behave the same as plain SPA clicks.
 */

const ITEMS: ReadonlyArray<[NavKey, string, string]> = [
  ["weekend", "Weekend", "/weekend"],
  ["ideas", "Ideas", "/ideas"],
  ["past", "Past", "/past"],
  ["family", "Family", "/family"],
];

test.describe("Navigation chrome", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("weekend");
    await pages.weekend.waitForReady();
  });

  test("exactly one chrome is visible for the viewport", async ({ pages }, testInfo) => {
    const w = pages.weekend;
    if (isPhone(testInfo)) {
      await expect(w.bottomNav).toBeVisible();
      await expect(w.topbar).toBeHidden();
    } else {
      await expect(w.topbar).toBeVisible();
      await expect(w.bottomNav).toBeHidden();
    }
    await expect(w.sitebar).toHaveCount(0);
  });

  test("the visible chrome lists the four items with real hrefs and labels", async ({ pages }) => {
    const w = pages.weekend;
    for (const [key, label, href] of ITEMS) {
      const link = w.navLink(key);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveText(label);
      await expect(link).toHaveAttribute("href", href);
    }
  });

  for (const [key, , href] of ITEMS) {
    test(`clicking '${key}' routes to ${href} and moves aria-current`, async ({ page, pages }) => {
      const w = pages.weekend;
      await w.navLink(key).click();
      await page.waitForURL(`**${href}`);
      await expect(w.activeNavLink()).toHaveCount(1);
      await expect(w.activeNavLink()).toHaveAttribute("data-nav", key);
      await expect(w.body).toHaveAttribute("data-page", key);
    });
  }

  test("the brand link returns to the weekend", async ({ page, pages }) => {
    await pages.weekend.navLink("past").click();
    await page.waitForURL("**/past");
    await pages.weekend.brandLink().click();
    await page.waitForURL("**/weekend");
  });

  test("Ideas' child segments keep 'ideas' current in the chrome", async ({ page, pages }) => {
    await pages.ideas.navLink("ideas").click();
    await page.waitForURL("**/ideas");
    await pages.ideas.segmentTab("Food").click();
    await page.waitForURL("**/ideas/food");
    await expect(pages.ideas.activeNavLink()).toHaveAttribute("data-nav", "ideas");
    await expect(pages.ideas.body).toHaveAttribute("data-page", "ideas");
  });

  test("review-submissions keeps 'family' current", async ({ goto, pages }) => {
    await goto("reviewSubmissions");
    await pages.reviewSubmissions.waitForReady();
    await expect(pages.reviewSubmissions.activeNavLink()).toHaveAttribute("data-nav", "family");
  });
});

test.describe("Account menu (top bar, ≥720)", () => {
  test.beforeEach(async ({ goto, pages }, testInfo) => {
    test.skip(isPhone(testInfo), "the top bar (and its avatar) is display:none below 720px");
    await goto("weekend");
    await pages.weekend.waitForReady();
  });

  test("the avatar button opens a menu with the email, Family settings and Sign out", async ({ pages }) => {
    const w = pages.weekend;
    await expect(w.accountMenuButton()).toHaveText(/^[A-Z]$/);
    await w.accountMenuButton().click();
    await expect(w.menu()).toHaveAttribute("aria-label", "Account");
    await expect(w.menu().locator(".menu__header")).toContainText("@");
    await expect(w.menuItem("Family settings")).toBeVisible();
    await expect(w.menuItem("Sign out")).toHaveClass(/menu__item--warn/);
  });

  test("Family settings navigates to /family and closes the menu", async ({ page, pages }) => {
    const w = pages.weekend;
    await w.accountMenuButton().click();
    await w.menuItem("Family settings").click();
    await page.waitForURL("**/family");
    await expect(w.menu()).toHaveCount(0);
  });

  test("Escape closes the menu", async ({ page, pages }) => {
    const w = pages.weekend;
    await w.accountMenuButton().click();
    await expect(w.menu()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(w.menu()).toHaveCount(0);
  });
});
