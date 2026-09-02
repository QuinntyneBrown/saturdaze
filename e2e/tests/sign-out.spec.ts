import { test, expect } from "../fixtures/sd-test.js";
import { API_URL, SEEDED_USER } from "../fixtures/auth.js";

/**
 * Behaviour specs for sign-out.
 *
 * The session comes from the `signIn` fixture (API login + storage seed);
 * `goto("profile")` reuses it. Sign-out must revoke the refresh token on the
 * server (`POST /api/auth/logout` → 204) as well as clear both storage tiers.
 */

test.describe("Sign out: happy path", () => {
  test("confirm → logout 204, /login, storage cleared, refresh token dead", async ({
    page,
    goto,
    signIn,
    pages,
    request,
  }) => {
    const session = await signIn();
    expect(session).not.toBeNull();

    await goto("profile");
    await pages.profile.accountSection().waitFor();
    await expect(pages.profile.accountEmail()).toHaveText(SEEDED_USER.email);

    await pages.profile.clickSignOut();

    // The CDK dialog renders into the overlay container, outside the page
    // shell. Locate it by title and click the danger action.
    const dialog = page.locator('sd-dialog[title="Sign out?"]');
    await expect(dialog).toBeVisible();

    const logout = page.waitForResponse((r) => r.url().endsWith("/api/auth/logout"));
    await dialog.locator('sd-button[variant="danger"] button').click();
    expect((await logout).status()).toBe(204);

    await page.waitForURL("**/login", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/login");

    const local = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    const stored = await page.evaluate(() => sessionStorage.getItem("sd.auth.token"));
    expect(local).toBeNull();
    expect(stored).toBeNull();

    // The revoked refresh token can no longer mint a session.
    const refresh = await request.post(`${API_URL}/api/auth/refresh`, {
      data: { refreshToken: session!.refreshToken },
    });
    expect(refresh.status()).toBe(401);
    expect(((await refresh.json()) as { code: string }).code).toBe("refresh_token_revoked");

    // requireAuth still blocks the protected route.
    await page.goto("/weekend");
    await page.waitForURL(/\/login\?returnUrl=/, { timeout: 8_000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnUrl")).toBe("/weekend");
  });
});

test.describe("Sign out: cancel", () => {
  test("stay-signed-in keeps session and stays on /profile", async ({ page, goto, pages }) => {
    await goto("profile");
    await pages.profile.accountSection().waitFor();
    await pages.profile.clickSignOut();

    const dialog = page.locator('sd-dialog[title="Sign out?"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('sd-button[variant="secondary"] button').click();

    await expect(dialog).not.toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/profile");

    const local = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    expect(local).toBeTruthy();
  });
});
