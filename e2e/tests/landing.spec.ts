import { test, expect } from "../fixtures/sd-test.js";

/**
 * Landing — the anonymous front door: sitebar CTAs, hero with the static
 * miniature weekend, three "How it works" steps and the footer. A signed-in
 * user never sees it (requireAnonymous → /weekend).
 */

test.describe("Landing", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("landing", { anonymous: true });
    await pages.landing.waitForReady();
  });

  test("renders in the site shell with both CTAs", async ({ pages }) => {
    const l = pages.landing;
    await expect(l.body).toHaveAttribute("data-page", "landing");
    await expect(l.sitebar).toBeVisible();
    await expect(l.topbar).toHaveCount(0);
    await expect(l.bottomNav).toHaveCount(0);
    await expect(l.sitebarCreateAccountLink()).toHaveAttribute("href", /create-account/);
    await expect(l.heroTitle()).toHaveText(/Two days\.\s*Already planned\./);
    await expect(l.heroCta()).toHaveAttribute("href", /create-account/);
    await expect(l.heroSignInLink()).toHaveAttribute("href", /sign-in/);
  });

  test("the hero preview is a static miniature weekend with both days", async ({ pages }) => {
    const l = pages.landing;
    await expect(l.heroPreview()).toHaveAttribute("aria-hidden", "true");
    await expect(l.heroPreview().locator(".day")).toHaveCount(2);
    await expect(l.previewBlocks()).toHaveCount(6);
    await expect(l.previewBlocks().filter({ hasText: "Swim lessons" })).toHaveClass(/block--commitment/);
    await expect(l.heroPreview().locator(".block__actions")).toHaveCount(0);
  });

  test("'How it works' lists three numbered steps", async ({ pages }) => {
    const l = pages.landing;
    await expect(l.how.locator(".how__title")).toHaveText("How a weekend comes together");
    await expect(l.steps()).toHaveCount(3);
    await expect(l.steps().locator(".step__num")).toHaveText(["01", "02", "03"]);
  });

  test("the primary CTA leads to create-account and 'Sign in' to sign-in", async ({ page, pages }) => {
    await pages.landing.heroCta().click();
    await page.waitForURL(/create-account/);
    await page.goBack();
    await pages.landing.waitForReady();
    await pages.landing.heroSignInLink().click();
    await page.waitForURL(/sign-in/);
  });

  test("the footer links to Terms, Privacy and Sign in", async ({ pages }) => {
    const l = pages.landing;
    await expect(l.footerLink("Terms")).toHaveAttribute("href", /legal/);
    await expect(l.footerLink("Privacy")).toHaveAttribute("href", /legal(\.html)?#privacy$/);
    await expect(l.footerLink("Sign in")).toHaveAttribute("href", /sign-in/);
  });
});

test.describe("Landing — signed in", () => {
  test("a signed-in user is sent to /weekend", async ({ page, goto }) => {
    await goto("landing", { as: "user" });
    await page.waitForURL("**/weekend", { timeout: 8_000 });
  });
});
