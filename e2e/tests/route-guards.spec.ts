import { test, expect } from "../fixtures/sd-test.js";

/**
 * Route-guard behaviour. Validates every direction:
 *   - anonymous → guarded URL bounces to /login?returnUrl=…
 *   - signed-in → public auth URL bounces to /weekend
 *   - non-admin → /admin/events bounces to /weekend; admin gets in
 *
 * Sessions come from the `goto` fixture (API login + storage seed), so these
 * tests never drive the login form — `login.spec.ts` covers that.
 */

test.describe("requireAuth (G2)", () => {
  test("anonymous /weekend → /login?returnUrl=/weekend", async ({ page, goto, settle }) => {
    await goto("home", { anonymous: true });
    await settle();

    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnUrl")).toBe("/weekend");
  });

  for (const key of ["itinerary", "profile", "saved", "errand"] as const) {
    test(`anonymous /${key} bounces to /login`, async ({ page, goto, settle }) => {
      await goto(key, { anonymous: true });
      await settle();
      expect(new URL(page.url()).pathname).toBe("/login");
    });
  }

  test("anonymous /admin/events bounces to /login", async ({ page, goto, settle }) => {
    await goto("adminEvents", { anonymous: true });
    await settle();
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});

test.describe("requireAdmin (G3)", () => {
  test("signed-in non-admin /admin/events → /weekend", async ({ page, goto }) => {
    await goto("adminEvents", { as: "user" });
    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  test("admin session reaches /admin/events", async ({ page, goto, pages }) => {
    await goto("adminEvents");
    await pages.adminEvents.waitForComponentsReady();
    expect(new URL(page.url()).pathname).toBe("/admin/events");
  });
});

test.describe("requireAnonymous (G1)", () => {
  test("authed user hitting /login → /weekend", async ({ page, goto }) => {
    await goto("login", { as: "user" });
    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  test("authed user hitting / → /weekend", async ({ page, goto }) => {
    await goto("splash", { as: "user" });
    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  test("returnUrl is honoured after signing in", async ({ page, goto, pages, settle }) => {
    await goto("saved", { anonymous: true });
    await settle();
    expect(new URL(page.url()).searchParams.get("returnUrl")).toBe("/saved");

    await pages.login.waitForReady();
    await pages.login.fillCredentials("quinntynebrown@gmail.com", "password123");
    await pages.login.submit();
    await page.waitForURL("**/saved", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/saved");
  });
});
