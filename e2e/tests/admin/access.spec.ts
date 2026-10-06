import { test, expect } from "../../fixtures/sd-test.js";
import { SEEDED_ADMIN } from "../../fixtures/auth.js";

/**
 * Saturdaze Admin access (L2-111) and the admin shell (L2-123 AC3).
 *
 *   - a signed-in non-admin sees the gate and nothing from /api/admin/*
 *   - an anonymous visitor is sent to /sign-in?returnUrl=… and lands back
 *     where they asked after signing in as an administrator
 *   - Sign out revokes the session and shows sign-in
 *   - the side navigation marks the current screen at 1440; the bar at 390
 *
 * Sessions come from the `goto` fixture (API login + storage seed) except
 * where the sign-in form itself is under test.
 */

test.describe("Admin gate", () => {
  test("a signed-in non-admin sees the gate and no admin data is requested", async ({ page, goto, pages }) => {
    // Traces to: L2-111 AC1
    const adminRequests: string[] = [];
    page.on("request", (req) => {
      if (/\/api\/admin\//.test(req.url())) adminRequests.push(req.url());
    });

    await goto("adminPlaces", { as: "user" });
    const a = pages.adminPlaces;
    await expect(a.gateTitle()).toHaveText("This account can't use Saturdaze Admin");
    await expect(a.gateSignOutButton()).toBeVisible();
    await expect(a.placeList).toHaveCount(0);
    await expect(a.adminNav).toHaveCount(0);
    expect(adminRequests).toEqual([]);
  });

  test("anonymous visitors sign in and land where they asked", async ({ page, goto, pages }) => {
    // Traces to: L2-111 AC4
    await goto("adminPlaces", { anonymous: true });
    await page.waitForURL("**/sign-in?returnUrl=%2Fplaces");
    await pages.adminSignIn.waitForScreen("sign-in");
    await expect(pages.adminSignIn.cardTitle()).toHaveText("Sign in to Saturdaze Admin");

    await pages.adminSignIn.signIn(SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await page.waitForURL("**/places");
    await pages.adminPlaces.waitForScreen("places");
    await expect(pages.adminPlaces.pageTitle()).toHaveText("Places");
  });

  test("Sign out revokes the session and shows sign-in", async ({ page, goto, pages }) => {
    // Traces to: L2-111 AC5
    await goto("adminPlaces");
    const a = pages.adminPlaces;
    await a.waitForScreen("places");
    const revoked = page.waitForResponse((r) => r.url().endsWith("/api/auth/logout"));
    await a.signOutButton().click();
    expect((await revoked).ok()).toBeTruthy();
    await page.waitForURL(/\/sign-in(\?|$)/);
    await pages.adminSignIn.waitForScreen("sign-in");
  });
});

test.describe("Admin shell", () => {
  test("lists places for an administrator with the side navigation current", async ({ goto, pages }) => {
    // Traces to: L2-113, L2-123 AC3
    await goto("adminPlaces");
    const a = pages.adminPlaces;
    await a.waitForScreen("places");
    await expect(a.body).toHaveAttribute("data-page", "admin");
    await expect(a.adminNav).toBeVisible();
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "places");
    await expect(a.adminNavEmail()).toHaveText(SEEDED_ADMIN.email);
    await expect(a.row("Riverwood Conservancy")).toBeVisible();
    await expect(a.rowMeta(a.row("Riverwood Conservancy"))).toContainText("Activity");
    expect(await a.rows().count()).toBeGreaterThan(3);
  });

  test("the bar replaces the side navigation at 390px with no horizontal overflow", async ({ page, goto, pages }) => {
    // Traces to: L2-123 AC3
    await page.setViewportSize({ width: 390, height: 844 });
    await goto("adminPlaces");
    const a = pages.adminPlaces;
    await a.waitForScreen("places");
    await expect(a.adminNav).toBeVisible();
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "places");
    await expect(a.adminNavEmail()).toBeHidden();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
});
