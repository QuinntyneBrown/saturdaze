import { test, expect, isPhone } from "../fixtures/sd-test.js";
import { API_URL, SEEDED_USER } from "../fixtures/auth.js";

/**
 * Sign out — from the Family account card (every width) and from the
 * account menu (≥720). D22 confirms; confirming revokes the refresh token
 * on the server (`POST /api/auth/logout` → 204), clears both storage tiers
 * and lands on /sign-in.
 */

test.describe("Sign out: happy path", () => {
  test("Family → Sign out → confirm → logout 204, /sign-in, storage cleared, refresh token dead", async ({
    page,
    goto,
    signIn,
    pages,
    request,
  }) => {
    const session = await signIn();
    expect(session).not.toBeNull();

    await goto("family");
    await pages.family.waitForReady();
    await expect(pages.family.accountEmail()).toHaveText(SEEDED_USER.email);
    await pages.family.signOutButton().click();

    const f = pages.family;
    await expect(f.dialog()).toHaveAttribute("role", "alertdialog");
    await expect(f.dialogTitle()).toHaveText("Sign out?");
    await expect(f.dialogSubtitle()).toHaveText("Your family and weekends stay saved.");

    const logout = page.waitForResponse((r) => r.url().endsWith("/api/auth/logout"));
    await f.dialogAction("Sign out").click();
    expect((await logout).status()).toBe(204);

    await page.waitForURL("**/sign-in", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/sign-in");

    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeNull();

    // The revoked refresh token can no longer mint a session.
    const refresh = await request.post(`${API_URL}/api/auth/refresh`, {
      data: { refreshToken: session!.refreshToken },
    });
    expect(refresh.status()).toBe(401);
    expect(((await refresh.json()) as { code: string }).code).toBe("refresh_token_revoked");

    // requireAuth still blocks the protected route.
    await page.goto("/weekend");
    await page.waitForURL(/\/sign-in\?returnUrl=/, { timeout: 8_000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/sign-in");
    expect(url.searchParams.get("returnUrl")).toBe("/weekend");
  });

  test("account menu → Sign out (≥720) opens the same confirm", async ({ page, goto, pages }, testInfo) => {
    test.skip(isPhone(testInfo), "the account menu lives in the top bar (≥720)");
    await goto("weekend");
    await pages.weekend.waitForReady();
    await pages.weekend.accountMenuButton().click();
    await pages.weekend.menuItem("Sign out").click();
    await expect(pages.weekend.dialogTitle()).toHaveText("Sign out?");
    const logout = page.waitForResponse((r) => r.url().endsWith("/api/auth/logout"));
    await pages.weekend.dialogAction("Sign out").click();
    expect((await logout).status()).toBe(204);
    await page.waitForURL("**/sign-in", { timeout: 8_000 });
  });
});

test.describe("Sign out: cancel", () => {
  test("'Stay signed in' keeps the session and stays on /family", async ({ page, goto, pages }) => {
    await goto("family");
    await pages.family.waitForReady();
    await pages.family.signOutButton().click();

    const f = pages.family;
    await expect(f.dialogTitle()).toHaveText("Sign out?");
    await f.dialogAction("Stay signed in").click();

    await expect(f.dialog()).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe("/family");
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeTruthy();
  });
});
