import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

/**
 * Create account — family name, email, password with a live strength
 * meter, a terms checkbox that gates the primary, and the Friday preview
 * opt-in. Success registers through the API and lands on the first step
 * of the onboarding wizard, /welcome/home (L2-157).
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

  // Traces to: L2-143 AC3, AC4
  test("the rule checklist marks each password rule as it is met", async ({ pages }) => {
    const c = pages.createAccount;
    await c.passwordInput().fill("abc");
    await expect(c.passwordRule("8 or more characters")).not.toHaveClass(/rules__item--met/);
    await expect(c.passwordRule("A number or symbol")).not.toHaveClass(/rules__item--met/);
    await expect(c.passwordRule("A number or symbol")).toContainText("not yet met");
    await c.passwordInput().fill("abcdefg1");
    await expect(c.passwordRule("8 or more characters")).toHaveClass(/rules__item--met/);
    await expect(c.passwordRule("A number or symbol")).toHaveClass(/rules__item--met/);
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

  // Traces to: L2-157 AC1
  test("a valid form registers and lands on the wizard's home step, signed in", async ({ page, pages }) => {
    const c = pages.createAccount;
    const account = fresh();
    await c.fill(account);
    await c.termsCheckbox().check();

    const registered = page.waitForResponse((r) => r.url().endsWith("/api/auth/register"));
    await c.createButton().click();
    expect((await registered).ok()).toBeTruthy();

    await page.waitForURL("**/welcome/home");
    await pages.welcome.waitForReady();
    await expect(pages.welcome.stepperLabel()).toHaveText("Step 1 of 4");
    await expect(pages.welcome.cardTitle()).toHaveText("Where's home?");
    expect(await page.evaluate(() => localStorage.getItem("sd.auth.token"))).toBeTruthy();
  });

  // Traces to: L2-157 AC2
  test("an email that is already registered shows an error and stays put", async ({ page, pages }) => {
    const c = pages.createAccount;
    await c.fill({ ...fresh(), email: SEEDED_USER.email });
    await c.termsCheckbox().check();
    const registered = page.waitForResponse((r) => r.url().endsWith("/api/auth/register"));
    await c.createButton().click();
    expect((await registered).status()).toBeGreaterThanOrEqual(400);
    // The conflict belongs to the email, so it sits on that field rather than a banner.
    await expect(c.fieldError()).toContainText("already has an account");
    await expect(c.emailInput()).toHaveAttribute("aria-invalid", "true");
    expect(new URL(page.url()).pathname).toBe("/create-account");
  });

  // Traces to: L2-157 AC1, L2-163 AC2, L2-013 AC1 — the current weekend is drafted on first visit.
  test("skipping every wizard step after sign-up opens the newly drafted weekend", async ({ page, pages }) => {
    const c = pages.createAccount;
    await c.fill(fresh());
    await c.termsCheckbox().check();
    await c.createButton().click();
    await page.waitForURL("**/welcome/home");
    const w = pages.welcome;
    for (const next of ["family", "likes", "preferences", "done"]) {
      await w.skipButton().click();
      await page.waitForURL(`**/welcome/${next}`);
    }
    await expect(w.cardTitle()).toHaveText("You're set");
    await w.planWeekendLink().click();
    await page.waitForURL("**/weekend");
    await pages.weekend.waitForReady();
    await expect(pages.weekend.pageTitle()).toHaveText("This weekend");
  });
});
