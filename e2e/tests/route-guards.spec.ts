import { test, expect } from "../fixtures/sd-test.js";

/**
 * Route-guard behaviour. Validates both directions:
 *   - anonymous → guarded URL bounces to /login?returnUrl=…
 *   - signed-in → public auth URL bounces to /weekend
 */

test.describe("requireAuth (G2)", () => {
  test("anonymous /weekend → /login?returnUrl=/weekend", async ({
    page,
    settle,
  }) => {
    await page.goto("/weekend");
    await settle();

    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnUrl")).toBe("/weekend");
  });

  test("anonymous /itinerary bounces", async ({ page, settle }) => {
    await page.goto("/itinerary");
    await settle();
    expect(new URL(page.url()).pathname).toBe("/login");
  });

  test("anonymous /profile bounces", async ({ page, settle }) => {
    await page.goto("/profile");
    await settle();
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});

test.describe("requireAnonymous (G1)", () => {
  test("authed user hitting /login → /weekend", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    // First sign in.
    await goto("login");
    await pages.login.waitForReady();
    await settle();
    await pages.login.fillCredentials("test@example.com", "password123");
    await pages.login.submit();
    await page.waitForURL("**/weekend");

    // Now visit /login again — should bounce.
    await page.goto("/login");
    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  test("authed user hitting / → /weekend", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();
    await pages.login.fillCredentials("test@example.com", "password123");
    await pages.login.submit();
    await page.waitForURL("**/weekend");

    await page.goto("/");
    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });
});
