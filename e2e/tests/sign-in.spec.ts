import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

/**
 * Sign in — the form drives the real API. Sessions persist to localStorage
 * (remember me, default) or sessionStorage (remember me off) under
 * `sd.auth.token`.
 */

test.describe("Sign in", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
  });

  test("renders the bare-shell card with brand, fields, remember me and links", async ({ pages }) => {
    const s = pages.signIn;
    await expect(s.body).toHaveAttribute("data-page", "sign-in");
    await expect(s.body).toHaveAttribute("data-shell", "bare");
    await expect(s.topbar).toHaveCount(0);
    await expect(s.bottomNav).toHaveCount(0);
    await expect(s.sitebar).toHaveCount(0);
    await expect(s.brand()).toHaveText("Saturdaze");
    await expect(s.cardTitle()).toHaveText("Welcome back");
    await expect(s.emailInput()).toBeVisible();
    await expect(s.passwordInput()).toHaveAttribute("type", "password");
    await expect(s.rememberToggle()).toBeChecked();
    await expect(s.forgotPasswordLink()).toHaveAttribute("href", /\/reset-password$/);
    await expect(s.createAccountLink()).toHaveAttribute("href", /\/create-account$/);
    await expect(s.footLink("Terms")).toHaveAttribute("href", /\/legal$/);
    await expect(s.footLink("Privacy")).toHaveAttribute("href", /\/legal#privacy$/);
    await expect(s.footLink("Back to Saturdaze")).toHaveAttribute("href", /\/$/);
  });

  test("happy path lands on /weekend with a persisted local session that survives a reload", async ({ page, pages }) => {
    const login = page.waitForResponse((r) => r.url().endsWith("/api/auth/login"));
    await pages.signIn.signIn(SEEDED_USER.email, SEEDED_USER.password);
    expect((await login).status()).toBe(200);
    await page.waitForURL("**/weekend");
    await expect(page.locator('body[data-page="weekend"]')).toBeAttached();
    const stored = await page.evaluate(() => localStorage.getItem("sd.auth.token"));
    expect(stored).toBeTruthy();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeNull();

    await page.reload();
    await pages.weekend.waitForReady();
    expect(new URL(page.url()).pathname).toBe("/weekend");
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeTruthy();
  });

  test("remember me off keeps the session in sessionStorage", async ({ page, pages }) => {
    const s = pages.signIn;
    await s.rememberToggle().click();
    await expect(s.rememberToggle()).not.toBeChecked();
    await s.signIn(SEEDED_USER.email, SEEDED_USER.password);
    await page.waitForURL("**/weekend");
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("sd.auth.token"))).toBeTruthy();
  });

  test("wrong password shows the banner and marks both fields invalid", async ({ page, pages }) => {
    const s = pages.signIn;
    const login = page.waitForResponse((r) => r.url().endsWith("/api/auth/login"));
    await s.signIn(SEEDED_USER.email, "not-the-password");
    expect((await login).status()).toBe(401);
    await expect(s.errorBanner()).toHaveText(/did not match/);
    await expect(s.emailInput()).toHaveAttribute("aria-invalid", "true");
    await expect(s.passwordInput()).toHaveAttribute("aria-invalid", "true");
    await expect(s.passwordInput()).toHaveValue("");
    expect(new URL(page.url()).pathname).toBe("/sign-in");
  });

  test("a sign-in error does not leak onto /create-account", async ({ page, pages }) => {
    const s = pages.signIn;
    await s.signIn(SEEDED_USER.email, "not-the-password");
    await expect(s.errorBanner()).toBeVisible();
    await s.createAccountLink().click();
    await page.waitForURL("**/create-account");
    await pages.createAccount.waitForReady();
    await expect(pages.createAccount.errorBanner()).toHaveCount(0);
    await expect(pages.createAccount.emailInput()).not.toHaveAttribute("aria-invalid", "true");
  });

  test("submit is blocked while a field is empty", async ({ page, pages }) => {
    const s = pages.signIn;
    await s.emailInput().fill(SEEDED_USER.email);
    await s.submit();
    await expect(s.passwordInput()).toHaveAttribute("aria-invalid", "true");
    expect(new URL(page.url()).pathname).toBe("/sign-in");
  });

  test("the links go where they say", async ({ page, pages }) => {
    await pages.signIn.forgotPasswordLink().click();
    await page.waitForURL("**/reset-password");
    await page.goBack();
    await pages.signIn.waitForReady();
    await pages.signIn.createAccountLink().click();
    await page.waitForURL("**/create-account");
  });
});

test.describe("Sign in — ?state=error (dev only)", () => {
  test("renders the wrong-password state statically", async ({ goto, pages }) => {
    await goto("signInError");
    await pages.signIn.waitForReady();
    await expect(pages.signIn.errorBanner()).toHaveAttribute("role", "alert");
    await expect(pages.signIn.errorBanner()).toHaveText(/did not match/);
    await expect(pages.signIn.emailInput()).toHaveAttribute("aria-invalid", "true");
  });
});
