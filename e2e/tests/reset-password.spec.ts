import { test, expect } from "../fixtures/sd-test.js";
import { API_URL, devToken, registerThrowaway } from "../fixtures/auth.js";

/**
 * Reset password — one screen, five states:
 *   request → sent (any email) · new (`?token=`) → done · expired
 * Tokens are real: outside Production the API hands back the reset token
 * it would otherwise email (`AuthController.DevDelivery`), so each test
 * registers a throwaway account and completes the flow in the browser.
 */

test.describe("Reset password — request", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("resetRequest");
    await pages.resetPassword.waitForReady();
  });

  test("renders the request card", async ({ pages }) => {
    const r = pages.resetPassword;
    await expect(r.body).toHaveAttribute("data-page", "reset-password");
    await expect(r.cardTitle()).toHaveText("Reset your password");
    await expect(r.emailInput()).toBeVisible();
    await expect(r.sendLinkButton()).toBeVisible();
    await expect(r.backToSignInLink()).toHaveAttribute("href", /\/sign-in$/);
  });

  test("submitting any email moves to the 'sent' state with a masked email chip", async ({ page, pages }) => {
    const r = pages.resetPassword;
    await r.emailInput().fill("nobody@example.com");
    const sent = page.waitForResponse((r2) => r2.url().endsWith("/api/auth/forgot-password"));
    await r.sendLinkButton().click();
    expect((await sent).ok()).toBeTruthy();
    await expect(r.cardTitle()).toHaveText("Check your email");
    await expect(r.emailChip()).toHaveText(/n•+y@example\.com/);
    await expect(r.resendButton()).toBeVisible();
    await expect(r.backToSignInLink()).toBeVisible();
  });
});

test.describe("Reset password — new password", () => {
  test("a valid token sets a new password and the 'done' state signs in", async ({ page, pages, request }) => {
    const account = await registerThrowaway(request, "reset");
    const token = await devToken(request, "/api/auth/forgot-password", account.email);

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    const r = pages.resetPassword;
    await r.waitForReady();
    await expect(r.cardTitle()).toHaveText("Choose a new password");

    await r.newPasswordInput().fill("Brand-new-pass-1");
    await expect(r.strength()).toHaveClass(/strength--strong/);
    await r.confirmPasswordInput().fill("Brand-new-pass-1");
    const reset = page.waitForResponse((r2) => r2.url().endsWith("/api/auth/reset-password"));
    await r.savePasswordButton().click();
    expect((await reset).ok()).toBeTruthy();

    await expect(r.cardTitle()).toHaveText("Password updated");
    await r.signInButton().click();
    await page.waitForURL("**/sign-in");

    const oldLogin = await request.post(`${API_URL}/api/auth/login`, { data: account });
    expect(oldLogin.status()).toBe(401);
    const newLogin = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: account.email, password: "Brand-new-pass-1" },
    });
    expect(newLogin.status()).toBe(200);
  });

  test("passwords that do not match block the save", async ({ page, pages }) => {
    await page.goto("/reset-password?token=anything");
    const r = pages.resetPassword;
    await r.waitForReady();
    await r.newPasswordInput().fill("Brand-new-pass-1");
    await r.confirmPasswordInput().fill("typo-no-match");
    await r.confirmPasswordInput().blur();
    await expect(r.fieldError()).toContainText(/match/i);
    await expect(r.confirmPasswordInput()).toHaveAttribute("aria-invalid", "true");
    await expect(r.savePasswordButton()).toBeDisabled();
  });

  test("a consumed token lands on the 'expired' state", async ({ page, pages, request }) => {
    const account = await registerThrowaway(request, "reset");
    const token = await devToken(request, "/api/auth/forgot-password", account.email);
    const first = await request.post(`${API_URL}/api/auth/reset-password`, {
      data: { token, newPassword: "Already-used-1" },
    });
    expect(first.ok()).toBeTruthy();

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    const r = pages.resetPassword;
    await r.waitForReady();
    await r.newPasswordInput().fill("Brand-new-pass-1");
    await r.confirmPasswordInput().fill("Brand-new-pass-1");
    await r.savePasswordButton().click();

    await expect(r.cardTitle()).toHaveText("This link has expired");
    await expect(r.sendNewLinkButton()).toBeVisible();
    await expect(r.backToSignInLink()).toBeVisible();
  });

  test("a garbage token lands on the 'expired' state", async ({ page, pages }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    const r = pages.resetPassword;
    await r.waitForReady();
    await r.newPasswordInput().fill("Brand-new-pass-1");
    await r.confirmPasswordInput().fill("Brand-new-pass-1");
    await r.savePasswordButton().click();
    await expect(r.cardTitle()).toHaveText("This link has expired");
  });

  test("'Send a new link' from the expired state returns to the request card", async ({ goto, pages }) => {
    await goto("resetExpired");
    const r = pages.resetPassword;
    await r.waitForReady();
    await expect(r.cardTitle()).toHaveText("This link has expired");
    await r.sendNewLinkButton().click();
    await expect(r.cardTitle()).toHaveText("Reset your password");
  });
});

test.describe("Reset password — ?state= overrides (dev only)", () => {
  for (const [key, title] of [
    ["resetSent", "Check your email"],
    ["resetNew", "Choose a new password"],
    ["resetDone", "Password updated"],
    ["resetExpired", "This link has expired"],
  ] as const) {
    test(`${key} renders "${title}"`, async ({ goto, pages }) => {
      await goto(key);
      await pages.resetPassword.waitForReady();
      await expect(pages.resetPassword.cardTitle()).toHaveText(title);
    });
  }
});
