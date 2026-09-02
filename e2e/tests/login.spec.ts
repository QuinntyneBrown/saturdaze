import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

/**
 * Behaviour specs for `/login`. Visual parity is covered separately under
 * `tests/visual/login.visual.spec.ts`.
 *
 * Credentials hit the real `Saturdaze.Api`; the seeded family account comes
 * from `saturdaze seed` (override with `SD_E2E_EMAIL` / `SD_E2E_PASSWORD`).
 */

interface PersistedToken {
  value: string;
  expiresUtc: string;
  refreshToken: string;
}

test.describe("Login: happy path", () => {
  test("seeded credentials → /weekend", async ({ page, goto, pages, settle }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    await pages.login.fillCredentials(SEEDED_USER.email, SEEDED_USER.password);
    await pages.login.submit();

    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });
});

test.describe("Login: invalid credentials", () => {
  test("wrong password → inline error, stays on /login", async ({ page, goto, pages, settle }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    await pages.login.fillCredentials(SEEDED_USER.email, "not-the-password");
    await pages.login.submit();

    const err = pages.login.errorMessage();
    await expect(err).toBeVisible();
    await expect(err).toHaveText(/Email or password is incorrect/i);
    expect(new URL(page.url()).pathname).toBe("/login");
  });

  test("a login error does not leak onto /signup", async ({ page, goto, pages, settle }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();
    await pages.login.fillCredentials(SEEDED_USER.email, "not-the-password");
    await pages.login.submit();
    await expect(pages.login.errorMessage()).toBeVisible();

    await pages.login.signupLink().click();
    await page.waitForURL("**/signup");
    await pages.signup.waitForReady();
    await expect(pages.signup.errorMessage()).toHaveCount(0);
  });
});

test.describe("Login: remember-me persistence", () => {
  test("remember=true → access + refresh token survive a reload in localStorage", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    // Toggle defaults to checked (remember=true).
    await pages.login.fillCredentials(SEEDED_USER.email, SEEDED_USER.password);
    await pages.login.submit();
    await page.waitForURL("**/weekend");

    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).pathname).toBe("/weekend");

    const raw = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    expect(raw).toBeTruthy();
    const token = JSON.parse(raw!) as PersistedToken;
    expect(token.value.split(".")).toHaveLength(3);
    expect(token.refreshToken.length).toBeGreaterThan(20);
    expect(Date.parse(token.expiresUtc)).toBeGreaterThan(Date.now());
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.storage"))).toBe("local");
  });

  test("remember=false → token lives in sessionStorage only", async ({ page, goto, pages, settle }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    // Click the toggle once to flip it off (default is on).
    await pages.login.rememberToggle().click();
    await pages.login.fillCredentials(SEEDED_USER.email, SEEDED_USER.password);
    await pages.login.submit();
    await page.waitForURL("**/weekend");

    const local = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    const session = await page.evaluate(() => sessionStorage.getItem("sd.auth.token"));
    expect(local).toBeNull();
    expect(session).toBeTruthy();
    expect((JSON.parse(session!) as PersistedToken).refreshToken).toBeTruthy();
  });
});
