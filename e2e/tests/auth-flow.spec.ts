import { test, expect } from "../fixtures/sd-test.js";

/**
 * Behaviour specs for the forgot/reset/verify-email flow.
 *
 * NOTE: the backend forgot/reset/verify-email endpoints are deferred (H7 in
 * docs/auth-implementation-plan.md). These specs exercised the now-removed
 * mock auth service's fixed token strings and will be re-enabled when the
 * real endpoints land.
 */

test.describe("Forgot password (E1)", () => {
  test("submit any email → /check-email", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await goto("forgotPassword");
    await pages.forgotPassword.waitForReady();
    await settle();

    await pages.forgotPassword.submit("nobody@example.com");
    await page.waitForURL("**/check-email", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/check-email");
  });
});

test.describe("Reset password (E3, E4)", () => {
  test("valid token → /login?reset=1", async ({ page, goto, pages, settle }) => {
    await page.goto("/reset-password?token=valid-mock-reset-token");
    await pages.resetPassword.waitForReady();
    await settle();

    await pages.resetPassword.passwordInput().fill("brand-new-pass");
    await pages.resetPassword.confirmInput().fill("brand-new-pass");
    await pages.resetPassword.submitButton().locator('button').click();

    await page.waitForURL("**/login?reset=1", { timeout: 8_000 });
  });

  test("expired token → inline error with link to forgot", async ({
    page,
    pages,
    settle,
  }) => {
    await page.goto("/reset-password?token=expired-mock-reset-token");
    await pages.resetPassword.waitForReady();
    await settle();

    await pages.resetPassword.passwordInput().fill("brand-new-pass");
    await pages.resetPassword.confirmInput().fill("brand-new-pass");
    await pages.resetPassword.submitButton().locator('button').click();

    await expect(pages.resetPassword.authError()).toBeVisible();
    await expect(pages.resetPassword.authError()).toContainText(/expired/i);
  });

  test("missing token → error state with link to forgot", async ({
    page,
    pages,
    settle,
  }) => {
    await page.goto("/reset-password");
    await pages.resetPassword.waitForReady();
    await settle();

    await expect(pages.resetPassword.errorState()).toBeVisible();
    await expect(pages.resetPassword.errorState()).toContainText(/missing a token/i);
  });

  test("passwords don't match → inline error", async ({
    page,
    pages,
    settle,
  }) => {
    await page.goto("/reset-password?token=valid-mock-reset-token");
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
  test("valid token → success state", async ({ page, pages, settle }) => {
    await page.goto("/verify-email?token=valid-mock-verify-token");
    await pages.verifyEmail.waitForReady();
    await settle();

    await expect(pages.verifyEmail.success()).toBeVisible();
    await expect(pages.verifyEmail.setupFamilyButton()).toBeVisible();
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
