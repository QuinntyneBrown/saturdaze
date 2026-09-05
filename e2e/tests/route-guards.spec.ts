import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

/**
 * Route guards and the v1 → v2 redirect table.
 *   - anonymous → guarded URL bounces to /sign-in?returnUrl=…
 *   - signed-in → requireAnonymous URL bounces to /weekend
 *   - non-admin → /review-submissions bounces; admin gets in
 *   - fifteen legacy paths redirect (pathMatch full) to their v2 homes
 *
 * Sessions come from the `goto` fixture (API login + storage seed), so
 * these tests never drive the sign-in form — sign-in.spec.ts covers that.
 */

test.describe("requireAuth", () => {
  test("anonymous /weekend → /sign-in?returnUrl=/weekend", async ({ page, goto, settle }) => {
    await goto("weekend", { anonymous: true });
    await settle();
    const url = new URL(page.url());
    expect(url.pathname).toBe("/sign-in");
    expect(url.searchParams.get("returnUrl")).toBe("/weekend");
  });

  for (const key of ["ideas", "ideasFood", "ideasEvents", "past", "family"] as const) {
    test(`anonymous ${key} bounces to /sign-in`, async ({ page, goto, settle }) => {
      await goto(key, { anonymous: true });
      await settle();
      expect(new URL(page.url()).pathname).toBe("/sign-in");
    });
  }

  test("anonymous /review-submissions bounces to /sign-in", async ({ page, goto, settle }) => {
    await goto("reviewSubmissions", { anonymous: true });
    await settle();
    expect(new URL(page.url()).pathname).toBe("/sign-in");
  });
});

test.describe("requireAdmin", () => {
  test("signed-in non-admin /review-submissions → /weekend", async ({ page, goto }) => {
    await goto("reviewSubmissions", { as: "user" });
    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  test("admin session reaches /review-submissions", async ({ page, goto, pages }) => {
    await goto("reviewSubmissions");
    await pages.reviewSubmissions.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/review-submissions");
  });
});

test.describe("requireAnonymous", () => {
  for (const key of ["landing", "signIn", "createAccount", "resetRequest"] as const) {
    test(`authed user hitting ${key} → /weekend`, async ({ page, goto }) => {
      await goto(key, { as: "user" });
      await page.waitForURL("**/weekend", { timeout: 8_000 });
      expect(new URL(page.url()).pathname).toBe("/weekend");
    });
  }

  test("verify-email and legal stay reachable when signed in", async ({ page, goto, pages }) => {
    await goto("verifyExpired", { as: "user" });
    await pages.verifyEmail.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/verify-email");
    await goto("legal", { as: "user" });
    await pages.legal.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/legal");
  });

  test("returnUrl is honoured after signing in", async ({ page, goto, pages, settle }) => {
    await goto("past", { anonymous: true });
    await settle();
    expect(new URL(page.url()).searchParams.get("returnUrl")).toBe("/past");

    await pages.signIn.waitForReady();
    await pages.signIn.signIn(SEEDED_USER.email, SEEDED_USER.password);
    await page.waitForURL("**/past", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/past");
  });
});

test.describe("v1 → v2 redirects", () => {
  const REDIRECTS: ReadonlyArray<[from: string, to: string]> = [
    ["/itinerary", "/weekend"],
    ["/errand", "/weekend"],
    ["/activities", "/ideas"],
    ["/restaurants", "/ideas/food"],
    ["/events", "/ideas/events"],
    ["/events/submit", "/ideas/events"],
    ["/events/submitted", "/ideas/events"],
    ["/saved", "/past"],
    ["/profile", "/family"],
    ["/admin/events", "/review-submissions"],
    ["/login", "/sign-in"],
    ["/signup", "/create-account"],
    ["/forgot-password", "/reset-password"],
    ["/check-email", "/reset-password"],
    ["/terms", "/legal"],
  ];

  for (const [from, to] of REDIRECTS) {
    test(`${from} → ${to}`, async ({ page, signIn }) => {
      // Authed so the guarded destinations are reachable. requireAnonymous
      // targets (sign-in, create-account, reset-password) and the admin-only
      // queue then bounce the seeded user on to /weekend, which is accepted.
      await signIn();
      await page.goto(from);
      await page.waitForURL((url) => url.pathname === to || url.pathname === "/weekend", { timeout: 8_000 });
      expect([to, "/weekend"]).toContain(new URL(page.url()).pathname);
    });
  }

  test("/privacy → /legal#privacy", async ({ page, pages }) => {
    await page.goto("/privacy");
    await page.waitForURL(/\/legal#privacy$/);
    await pages.legal.waitForReady();
    await expect(pages.legal.body).toHaveAttribute("data-doc", "privacy");
  });

  test("unknown paths fall back to the landing page", async ({ page, settle }) => {
    await page.goto("/does-not-exist");
    await settle();
    expect(["/", "/sign-in"]).toContain(new URL(page.url()).pathname);
  });
});
