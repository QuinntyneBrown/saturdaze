import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

/**
 * Create account — family name, email, password with a live strength
 * meter, a terms checkbox that gates the primary, and the Friday preview
 * opt-in. Success registers through the API and lands on the verify-email
 * "sent" state.
 */

const fresh = () => ({
  familyName: "The E2Es",
  email: `e2e-signup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
  password: "Lavender-17-May",
});

test.describe("Create account", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("createAccount");
    await pages.createAccount.waitForReady();
  });

  test("renders the card with three fields, two checkboxes and the primary", async ({ pages }) => {
    const c = pages.createAccount;
    await expect(c.body).toHaveAttribute("data-page", "create-account");
    await expect(c.cardTitle()).toHaveText("Start planning weekends");
    await expect(c.familyNameInput()).toBeVisible();
    await expect(c.card().locator(".field__hint").first()).toHaveText("How we greet you.");
    await expect(c.emailInput()).toHaveAttribute("type", "email");
    await expect(c.passwordInput()).toHaveAttribute("autocomplete", "new-password");
    await expect(c.termsCheckbox()).toBeVisible();
    await expect(c.fridayPreviewCheckbox()).toBeChecked();
    await expect(c.createButton()).toBeVisible();
    await expect(c.signInLink()).toHaveAttribute("href", /\/sign-in$/);
    await expect(c.termsLink()).toHaveAttribute("href", /\/legal$/);
    await expect(c.privacyLink()).toHaveAttribute("href", /\/legal#privacy$/);
  });

  test("the strength meter follows the password", async ({ pages }) => {
    const c = pages.createAccount;
    await c.passwordInput().fill("short");
    await expect(c.strength()).toHaveClass(/strength--weak/);
    await c.passwordInput().fill("lavender-17");
    await expect(c.strength()).toHaveClass(/strength--ok/);
    await expect(c.strengthLabel()).toContainText(/OK/);
    await c.passwordInput().fill("Lavender-17-May");
    await expect(c.strength()).toHaveClass(/strength--strong/);
    await expect(c.strengthLabel()).toContainText(/Strong/);
  });

  test("the terms checkbox gates the primary", async ({ pages }) => {
    const c = pages.createAccount;
    await c.fill(fresh());
    await expect(c.termsCheckbox()).not.toBeChecked();
    await expect(c.createButton()).toBeDisabled();
    await c.termsCheckbox().check();
    await expect(c.createButton()).toBeEnabled();
    await c.termsCheckbox().uncheck();
    await expect(c.createButton()).toBeDisabled();
  });

  test("a valid form registers and lands on verify-email in the 'sent' state", async ({ page, pages }) => {
    const c = pages.createAccount;
    const account = fresh();
    await c.fill(account);
    await c.termsCheckbox().check();

    const registered = page.waitForResponse((r) => r.url().endsWith("/api/auth/register"));
    await c.createButton().click();
    expect((await registered).ok()).toBeTruthy();

    await page.waitForURL("**/verify-email**");
    await pages.verifyEmail.waitForReady();
    await expect(pages.verifyEmail.cardTitle()).toHaveText("Check your email");
    await expect(pages.verifyEmail.cardSubtitle()).toContainText(/verification link/);
    await expect(pages.verifyEmail.resendButton()).toBeVisible();
    await expect(pages.verifyEmail.skipToWeekendLink()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeTruthy();
  });

  test("an email that is already registered shows an error and stays put", async ({ page, pages }) => {
    const c = pages.createAccount;
    await c.fill({ ...fresh(), email: SEEDED_USER.email });
    await c.termsCheckbox().check();
    const registered = page.waitForResponse((r) => r.url().endsWith("/api/auth/register"));
    await c.createButton().click();
    expect((await registered).status()).toBeGreaterThanOrEqual(400);
    await expect(c.errorBanner()).toBeVisible();
    await expect(c.emailInput()).toHaveAttribute("aria-invalid", "true");
    expect(new URL(page.url()).pathname).toBe("/create-account");
  });

  test("'Skip to this weekend' after sign-up opens the first-run weekend", async ({ page, pages }) => {
    const c = pages.createAccount;
    await c.fill(fresh());
    await c.termsCheckbox().check();
    await c.createButton().click();
    await page.waitForURL("**/verify-email**");
    await pages.verifyEmail.skipToWeekendLink().click();
    await page.waitForURL("**/weekend");
    await pages.weekend.waitForReady();
    await expect(pages.weekend.pageTitle()).toHaveText("Your first weekend");
  });
});
