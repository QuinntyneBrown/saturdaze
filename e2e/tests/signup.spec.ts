import { test, expect } from "../fixtures/sd-test.js";

/**
 * Behaviour specs for `/signup`.
 *
 * Mock auth seeds `test@example.com` already, so the email_in_use path can
 * be exercised by signing up with that address.
 */

test.describe("Signup: happy path (D2)", () => {
  test("fresh email + accepted terms → /check-email", async ({
    page,
    goto,
    pages,
    settle,
  }) => {
    await goto("signup");
    await pages.signup.waitForReady();
    await settle();

    await pages.signup.fill({
      email: `fresh-${Date.now()}@example.com`,
      password: "secret-1234",
    });
    await pages.signup.termsCheckbox().check();
    await pages.signup.submit();

    await page.waitForURL("**/check-email", { timeout: 8_000 });
    expect(new URL(page.url()).pathname).toBe("/check-email");
  });
});

test.describe("Signup: client-side validation (D3)", () => {
  test("submit disabled until Terms checked", async ({
    goto,
    pages,
    settle,
  }) => {
    await goto("signup");
    await pages.signup.waitForReady();
    await settle();

    await pages.signup.fill({
      email: `gates-${Date.now()}@example.com`,
      password: "secret-1234",
    });

    const btn = pages.signup.submitButton().locator('button');
    await expect(btn).toBeDisabled();
    await pages.signup.termsCheckbox().check();
    await expect(btn).toBeEnabled();
  });

  test("weak password shows inline hint", async ({ goto, pages, settle }) => {
    await goto("signup");
    await pages.signup.waitForReady();
    await settle();

    await pages.signup.passwordInput().fill("abc");
    await pages.signup.passwordInput().blur();
    await expect(pages.signup.passwordHint()).toBeVisible();
    await expect(pages.signup.passwordHint()).toContainText(/at least 8 characters/i);
  });
});

test.describe("Signup: email_in_use (D4)", () => {
  test("existing email → inline error from store", async ({
    goto,
    pages,
    settle,
  }) => {
    await goto("signup");
    await pages.signup.waitForReady();
    await settle();

    await pages.signup.fill({
      email: "test@example.com",
      password: "secret-1234",
    });
    await pages.signup.termsCheckbox().check();
    await pages.signup.submit();

    await expect(pages.signup.errorMessage()).toBeVisible();
    await expect(pages.signup.errorMessage()).toContainText(/already exists/i);
  });
});
