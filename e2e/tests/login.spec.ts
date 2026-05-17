import { test, expect } from "../fixtures/sd-test.js";

/**
 * Behaviour specs for `/login`. Visual parity is covered separately under
 * `tests/visual/login.visual.spec.ts`.
 *
 * Credentials hit the real `Saturdaze.Api`; the suite assumes a
 * `test@example.com` / `password123` row exists in `dbo.Users` (register it
 * once via `POST /api/auth/register` before running).
 */
test.describe("Login: happy path", () => {
  test("seeded credentials → /weekend", async ({ page, goto, pages, settle }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    await pages.login.fillCredentials("test@example.com", "password123");
    await pages.login.submit();

    await page.waitForURL("**/weekend", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/weekend");
  });
});

test.describe("Login: invalid credentials", () => {
  test("wrong password → inline error, stays on /login", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    await pages.login.fillCredentials("test@example.com", "not-the-password");
    await pages.login.submit();

    const err = pages.login.errorMessage();
    await expect(err).toBeVisible();
    await expect(err).toHaveText(/Email or password is incorrect/i);
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});

test.describe("Login: remember-me persistence", () => {
  test("remember=true → token survives reload", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    // Toggle defaults to checked (remember=true).
    await pages.login.fillCredentials("test@example.com", "password123");
    await pages.login.submit();
    await page.waitForURL("**/weekend");

    await page.reload();
    await page.waitForLoadState("networkidle");

    const token = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    expect(token).toBeTruthy();
  });

  test("remember=false → token cleared from local, lives in session only", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await goto("login");
    await pages.login.waitForReady();
    await settle();

    // Click the toggle once to flip it off (default is on).
    await pages.login.rememberToggle().click();
    await pages.login.fillCredentials("test@example.com", "password123");
    await pages.login.submit();
    await page.waitForURL("**/weekend");

    const local = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    const session = await page.evaluate(() => sessionStorage.getItem("sd.auth.token"));
    expect(local).toBeNull();
    expect(session).toBeTruthy();
  });
});
