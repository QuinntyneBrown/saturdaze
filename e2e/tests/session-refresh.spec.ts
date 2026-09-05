import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

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
