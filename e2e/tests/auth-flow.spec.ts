import { test, expect } from "../fixtures/sd-test.js";
import { API_URL, devToken, registerThrowaway } from "../fixtures/auth.js";

/**
 * Behaviour specs for the forgot / reset / verify-email flow.
 *
 * Tokens are real: outside Production the API returns the reset and
 * verification tokens it would otherwise email (`AuthController.DevDelivery`),
 * so each test registers a throwaway account, fetches its token through the
 * API, then completes the flow in the browser.
 */

test.describe("Forgot password (E1)", () => {
  test("submit any email → /check-email", async ({ page, goto, pages, settle }) => {
    await goto("forgotPassword");
    await pages.forgotPassword.waitForReady();
    await settle();

    await pages.forgotPassword.submit("nobody@example.com");
    await page.waitForURL(/\/check-email/, { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/check-email");
  });
});

test.describe("Reset password (E3, E4)", () => {
  test("valid token → password updated, new password signs in", async ({ page, pages, settle, request }) => {
    const account = await registerThrowaway(request, "reset");
    const token = await devToken(request, "/api/auth/forgot-password", account.email);

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    await pages.resetPassword.waitForReady();
    await settle();

    await pages.resetPassword.passwordInput().fill("brand-new-pass");
    await pages.resetPassword.confirmInput().fill("brand-new-pass");
    await pages.resetPassword.submitButton().locator("button").click();

    await expect(pages.resetPassword.successState()).toBeVisible();
    await expect(pages.resetPassword.successState()).toContainText(/password updated/i);

    const oldLogin = await request.post(`${API_URL}/api/auth/login`, { data: account });
    expect(oldLogin.status()).toBe(401);
    const newLogin = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: account.email, password: "brand-new-pass" },
    });
    expect(newLogin.status()).toBe(200);
  });

  test("consumed token → inline error with link to forgot", async ({ page, pages, settle, request }) => {
    const account = await registerThrowaway(request, "reset");
    const token = await devToken(request, "/api/auth/forgot-password", account.email);
    const first = await request.post(`${API_URL}/api/auth/reset-password`, {
      data: { token, newPassword: "already-used-1" },
    });
    expect(first.ok()).toBeTruthy();

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    await pages.resetPassword.waitForReady();
    await settle();

    await pages.resetPassword.passwordInput().fill("brand-new-pass");
    await pages.resetPassword.confirmInput().fill("brand-new-pass");
    await pages.resetPassword.submitButton().locator("button").click();

    await expect(pages.resetPassword.authError()).toBeVisible();
    await expect(pages.resetPassword.authError()).toContainText(/already been used/i);
    await expect(pages.resetPassword.authError().locator("a")).toHaveAttribute("href", "/forgot-password");
  });

  test("garbage token → inline 'invalid' error", async ({ page, pages, settle }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    await pages.resetPassword.waitForReady();
    await settle();

    await pages.resetPassword.passwordInput().fill("brand-new-pass");
    await pages.resetPassword.confirmInput().fill("brand-new-pass");
    await pages.resetPassword.submitButton().locator("button").click();

    await expect(pages.resetPassword.authError()).toBeVisible();
    await expect(pages.resetPassword.authError()).toContainText(/invalid/i);
  });

  test("missing token → error state with link to forgot", async ({ page, pages, settle }) => {
    await page.goto("/reset-password");
    await pages.resetPassword.waitForReady();
    await settle();

    await expect(pages.resetPassword.errorState()).toBeVisible();
    await expect(pages.resetPassword.errorState()).toContainText(/missing a token/i);
  });

  test("passwords don't match → inline error", async ({ page, pages, settle }) => {
    await page.goto("/reset-password?token=anything");
    await pages.resetPassword.waitForReady();
    await settle();

    await pages.resetPassword.passwordInput().fill("brand-new-pass");
    await pages.resetPassword.confirmInput().fill("typo-no-match");
    await pages.resetPassword.confirmInput().blur();

    await expect(pages.resetPassword.fieldError()).toBeVisible();
    await expect(pages.resetPassword.fieldError()).toContainText(/don't match/i);
  });
});

test.describe("Verify email (F1, F2)", () => {
  test("valid token → success state", async ({ page, pages, settle, request }) => {
    const account = await registerThrowaway(request, "verify");
    const token = await devToken(request, "/api/auth/resend-verification", account.email);

    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    await pages.verifyEmail.waitForReady();
    await settle();

    await expect(pages.verifyEmail.success()).toBeVisible();
    await expect(pages.verifyEmail.setupFamilyButton()).toBeVisible();
  });

  test("consumed token → error state", async ({ page, pages, settle, request }) => {
    const account = await registerThrowaway(request, "verify");
    const token = await devToken(request, "/api/auth/resend-verification", account.email);
    const first = await request.post(`${API_URL}/api/auth/verify-email`, { data: { token } });
    expect(first.ok()).toBeTruthy();

    await page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
    await pages.verifyEmail.waitForReady();
    await settle();

    await expect(pages.verifyEmail.errorState()).toBeVisible();
    await expect(pages.verifyEmail.errorState()).toContainText(/already been used/i);
  });

  test("invalid token → error state", async ({ page, pages, settle }) => {
    await page.goto("/verify-email?token=garbage");
    await pages.verifyEmail.waitForReady();
    await settle();

    await expect(pages.verifyEmail.errorState()).toBeVisible();
    await expect(pages.verifyEmail.errorState()).toContainText(/didn't work/i);
  });

  test("missing token → error state", async ({ page, pages, settle }) => {
    await page.goto("/verify-email");
    await pages.verifyEmail.waitForReady();
    await settle();

    await expect(pages.verifyEmail.errorState()).toBeVisible();
  });
});

test.describe("Check-email page (E2)", () => {
  test("resend button is present", async ({ goto, pages, settle }) => {
    await goto("checkEmail");
    await pages.checkEmail.waitForReady();
    await settle();

    await expect(pages.checkEmail.resendButton()).toBeVisible();
  });
});
