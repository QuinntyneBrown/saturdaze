import { test, expect } from "../fixtures/sd-test.js";

/**
 * Shared weekend — the read-only public view behind a share link
 * (`/sample-weekend?share=<token>`; `GET /api/weekends/shared/{token}` is
 * anonymous). The `goto("sharedWeekend")` fixture plans + shares a weekend
 * through the API and opens the link without a browser session.
 */

test.describe("Shared weekend", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("sharedWeekend");
    await pages.sharedWeekend.waitForReady();
  });

  test("renders read-only days in the site shell for an anonymous visitor", async ({ pages }) => {
    const s = pages.sharedWeekend;
    await expect(s.body).toHaveAttribute("data-page", "shared-weekend");
    await expect(s.body).toHaveAttribute("data-shell", "site");
    await expect(s.sitebar).toBeVisible();
    await expect(s.sitebarSignInLink()).toBeVisible();
    await expect(s.topbar).toHaveCount(0);
    await expect(s.bottomNav).toHaveCount(0);

    await expect(s.infoBanner()).toBeVisible();
    await expect(s.days()).toHaveCount(2);
    expect(await s.blocks("Saturday").count()).toBeGreaterThan(0);
    await expect(s.blocks().filter({ hasText: "Swim lessons" }).first()).toHaveClass(/block--commitment/);
    await expect(s.actionControls()).toHaveCount(0);
  });

  test("the sitebar CTAs lead to sign-in and create-account", async ({ page, pages }) => {
    await pages.sharedWeekend.sitebarSignInLink().click();
    await page.waitForURL("**/sign-in");
    await page.goBack();
    await pages.sharedWeekend.waitForReady();
    await pages.sharedWeekend.sitebarCreateAccountLink().click();
    await page.waitForURL("**/create-account");
  });

  test("a signed-in owner sees the same read-only view", async ({ goto, pages }) => {
    await goto("sharedWeekend", { as: "user" });
    await pages.sharedWeekend.waitForReady();
    await expect(pages.sharedWeekend.days()).toHaveCount(2);
    await expect(pages.sharedWeekend.actionControls()).toHaveCount(0);
  });
});

test.describe("Shared weekend — bad links", () => {
  test("an unknown token shows the not-found empty state", async ({ page, pages }) => {
    await page.goto("/sample-weekend?share=not-a-real-token");
    await pages.sharedWeekend.waitForReady();
    await expect(pages.sharedWeekend.empty).toBeVisible();
    await expect(pages.sharedWeekend.days()).toHaveCount(0);
  });

  test("no token redirects to the landing page", async ({ page }) => {
    await page.goto("/sample-weekend");
    await page.waitForURL((url) => url.pathname === "/");
  });
});
