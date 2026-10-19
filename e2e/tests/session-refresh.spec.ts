import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER, apiLogin, seedContextSession } from "../fixtures/auth.js";
import { WeekendPage } from "../pages/weekend.page.js";

/**
 * Silent refresh (ADR-007). The `signIn` fixture seeds the persisted session
 * shape with deliberate faults so each path through `SessionStore` /
 * `authInterceptor` is exercised against the real API:
 *
 *   - expired access token on rehydrate → refresh before the first call
 *   - bogus access token with a future expiry → 401 → refresh → retried once
 *   - bad refresh token → sign-out → guard bounces to /sign-in
 *   - remember-me off → session tier survives the refresh
 */

interface PersistedToken {
  value: string;
  expiresUtc: string;
  refreshToken: string;
}

const PAST = new Date(Date.now() - 60_000).toISOString();

async function persisted(page: import("@playwright/test").Page, tier: "local" | "session" = "local") {
  const raw = await page.evaluate(
    (t) => (t === "local" ? localStorage : sessionStorage).getItem("sd.auth.token"),
    tier,
  );
  return raw ? (JSON.parse(raw) as PersistedToken) : null;
}

test.describe("Session refresh", () => {
  test("expired access token refreshes on rehydrate and lands on /weekend", async ({
    page,
    goto,
    signIn,
    pages,
  }) => {
    const session = await signIn(SEEDED_USER, { accessToken: "expired.access.token", expiresUtc: PAST });
    expect(session).not.toBeNull();

    const refreshed = page.waitForResponse((r) => r.url().endsWith("/api/auth/refresh"));
    await goto("weekend");
    expect((await refreshed).status()).toBe(200);

    await pages.weekend.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/weekend");

    const stored = await persisted(page);
    expect(stored?.value.split(".")).toHaveLength(3);
    expect(stored?.refreshToken).not.toBe(session!.refreshToken); // rotated
    expect(Date.parse(stored!.expiresUtc)).toBeGreaterThan(Date.now());
  });

  test("a 401 mid-session refreshes once and retries the request", async ({ page, goto, signIn, pages }) => {
    await signIn(SEEDED_USER, { accessToken: "bogus.access.token" });

    const statuses: number[] = [];
    page.on("response", (r) => {
      if (r.url().endsWith("/api/auth/me")) statuses.push(r.status());
    });
    const refreshed = page.waitForResponse((r) => r.url().endsWith("/api/auth/refresh"));

    await goto("weekend");
    expect((await refreshed).status()).toBe(200);
    await pages.weekend.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/weekend");

    // /me is either retried after the 401 or skipped because refresh already
    // returned the user — either way the app must not have bounced.
    expect(statuses.filter((s) => s === 401).length).toBeLessThanOrEqual(1);
    expect((await persisted(page))?.value).not.toBe("bogus.access.token");
  });

  test("a bad refresh token signs the user out", async ({ page, goto, signIn }) => {
    await signIn(SEEDED_USER, {
      accessToken: "expired.access.token",
      expiresUtc: PAST,
      refreshToken: "not-a-real-refresh-token",
    });

    const refreshed = page.waitForResponse((r) => r.url().endsWith("/api/auth/refresh"));
    await goto("weekend");
    expect((await refreshed).status()).toBe(401);

    await page.waitForURL(/\/sign-in/, { timeout: 8_000 });
    expect(await persisted(page)).toBeNull();
    expect(await persisted(page, "session")).toBeNull();
  });

  test("remember-me off keeps the refreshed pair in sessionStorage", async ({ page, goto, signIn, pages }) => {
    await signIn(SEEDED_USER, { remember: false, accessToken: "expired.access.token", expiresUtc: PAST });

    const refreshed = page.waitForResponse((r) => r.url().endsWith("/api/auth/refresh"));
    await goto("weekend");
    expect((await refreshed).status()).toBe(200);
    await pages.weekend.waitForReady();

    expect(await persisted(page, "local")).toBeNull();
    const stored = await persisted(page, "session");
    expect(stored?.value.split(".")).toHaveLength(3);
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.storage"))).toBe("session");
  });
});

test.describe("Session refresh — recoverable failures (L2-144)", () => {
  // Traces to: L2-144 AC1, AC2
  test("a refresh lost to the network keeps the person signed in, and the next one succeeds", async ({
    page,
    goto,
    signIn,
    pages,
  }) => {
    await signIn(SEEDED_USER);
    await page.clock.install();
    await goto("weekend");
    await pages.weekend.waitForReady();

    await page.route("**/api/auth/refresh", (route) => route.abort("internetdisconnected"));
    const failed = page.waitForEvent("requestfailed", (r) => r.url().endsWith("/api/auth/refresh"));
    // Within a minute of the access token's 15-minute expiry: the next call refreshes first.
    await page.clock.fastForward("14:30");
    await pages.weekend.navLink("past").click();
    await failed;
    await pages.past.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/past");
    expect(await persisted(page)).not.toBeNull();

    await page.unroute("**/api/auth/refresh");
    const refreshed = page.waitForResponse((r) => r.url().endsWith("/api/auth/refresh"));
    await pages.past.navLink("weekend").click();
    expect((await refreshed).status()).toBe(200);
    await pages.weekend.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  // Traces to: L2-144 AC3
  test("a reload during a server error keeps the stored session for the next reload", async ({
    page,
    goto,
    signIn,
    pages,
  }) => {
    const session = await signIn(SEEDED_USER, { expiresUtc: PAST });
    await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 503, body: "" }));
    const failed = page.waitForResponse((r) => r.url().endsWith("/api/auth/refresh"));
    await goto("weekend");
    expect((await failed).status()).toBe(503);
    await expect.poll(async () => (await persisted(page))?.refreshToken).toBe(session!.refreshToken);

    await page.unroute("**/api/auth/refresh");
    const refreshed = page.waitForResponse((r) => r.url().endsWith("/api/auth/refresh"));
    await page.goto("/weekend");
    expect((await refreshed).status()).toBe(200);
    await pages.weekend.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });

  // Traces to: L2-144 AC5
  test("two tabs that need a refresh at once send one refresh and both stay signed in", async ({
    page,
    request,
    pages,
  }) => {
    const context = page.context();
    await seedContextSession(context, await apiLogin(request, SEEDED_USER), { expiresUtc: PAST });
    let refreshes = 0;
    await context.route("**/api/auth/refresh", async (route) => {
      refreshes += 1;
      // Hold the exchange so the second tab asks while the first is still refreshing.
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    const second = await context.newPage();

    await Promise.all([page.goto("/weekend"), second.goto("/weekend")]);
    await pages.weekend.waitForReady();
    await new WeekendPage(second).waitForReady();
    expect(new URL(page.url()).pathname).toBe("/weekend");
    expect(new URL(second.url()).pathname).toBe("/weekend");
    expect(refreshes).toBe(1);
  });
});
