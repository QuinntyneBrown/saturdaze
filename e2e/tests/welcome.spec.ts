import { test, expect } from "../fixtures/sd-test.js";
import { FakeApi, installFakeApi, freshFamily } from "../fixtures/fake-api.js";

/**
 * Welcome — the onboarding wizard a new account lands in (L1-038): one
 * question per step, each saved as it is completed, each skippable.
 *
 * The API is stood in for by `fixtures/fake-api.ts` (an in-memory family
 * behind `page.route`), so every assertion is about what the wizard sends
 * and shows; the endpoints themselves are covered by the API tests and the
 * Family specs.
 */

const WIDTHS = [320, 390, 820, 1440, 1920] as const;

test.describe("Welcome — one step at a time (L2-158)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page }) => {
    api = await installFakeApi(page);
  });

  // Traces to: L2-158 AC1, AC5, AC6
  test("step 1 renders in the bare shell under a stepper reading Step 1 of 4", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await expect(w.body).toHaveAttribute("data-page", "welcome");
    await expect(w.body).toHaveAttribute("data-shell", "bare");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");
    await expect(w.stepperTrack()).toHaveAttribute("aria-hidden", "true");
    await expect(w.stepperSegments()).toHaveCount(4);
    await expect(w.card().locator("h1.auth-card__title")).toHaveText("Where's home?");
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await expect(w.topbar).toHaveCount(0);
      await expect(w.bottomNav).toHaveCount(0);
      await expect(w.continueButton()).toBeVisible();
      expect(await w.hasHorizontalOverflow()).toBe(false);
    }
  });

  // Traces to: L2-158 AC2
  test("Continue and Skip for now move on; Back returns", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await expect(w.backButton()).toHaveCount(0);
    await w.skipButton().click();
    await page.waitForURL("**/welcome/family");
    await expect(w.stepperLabel()).toHaveText("Step 2 of 4");
    expect(api.family.homeLocation).toBe("");

    await w.backButton().click();
    await page.waitForURL("**/welcome/home");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");

    await w.homeInput().fill("Port Credit, Mississauga");
    await w.continueButton().click();
    await page.waitForURL("**/welcome/family");
    await expect(w.stepperLabel()).toHaveText("Step 2 of 4");
  });

  // Traces to: L2-158 AC3
  test("/welcome and an unknown step open the home step", async ({ page, pages }) => {
    const w = pages.welcome;
    await page.goto("/welcome");
    await page.waitForURL("**/welcome/home");
    await w.waitForReady();
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");

    await page.goto("/welcome/nope");
    await page.waitForURL("**/welcome/home");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");
  });

  // Traces to: L2-158 AC5
  test("the stepper's text is the progress a keyboard user hears, and Continue is reachable by Tab", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await w.homeInput().fill("Port Credit");
    await w.tabTo(w.continueButton());
    await page.keyboard.press("Enter");
    await page.waitForURL("**/welcome/family");
  });
});

// Traces to: L2-158 AC4
test("a signed-out visitor is sent to sign in and back to the step", async ({ page, settle }) => {
  await page.goto("/welcome/home");
  await settle();
  const url = new URL(page.url());
  expect(url.pathname).toBe("/sign-in");
  expect(url.searchParams.get("returnUrl")).toBe("/welcome/home");
});

test.describe("Welcome — where's home (L2-159)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page }) => {
    api = await installFakeApi(page);
  });

  // Traces to: L2-159 AC1, AC2
  test("Continue waits for an address, then saves it and moves on", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await expect(w.cardTitle()).toHaveText("Where's home?");
    await expect(w.cardSubtitle()).toHaveText("Weather and drive times start here.");
    await expect(w.homeInput()).toHaveValue("");
    await expect(w.continueButton()).toBeDisabled();

    await w.homeInput().fill("   ");
    await expect(w.continueButton()).toBeDisabled();

    await w.homeInput().fill("Port Credit, Mississauga");
    await expect(w.continueButton()).toBeEnabled();
    const saved = w.nextProfileSave();
    await w.continueButton().click();
    expect((await saved)["homeLocation"]).toBe("Port Credit, Mississauga");
    await page.waitForURL("**/welcome/family");
    expect(api.family.homeLocation).toBe("Port Credit, Mississauga");
  });

  // Traces to: L2-159 AC3
  test("a home already set is prefilled", async ({ page, pages }) => {
    await page.unroute("**/api/**");
    await installFakeApi(page, { family: { ...freshFamily(), homeLocation: "Streetsville" } });
    const w = pages.welcome;
    await w.open("home");
    await expect(w.homeInput()).toHaveValue("Streetsville");
    await expect(w.continueButton()).toBeEnabled();
  });

  // Traces to: L2-159 AC4
  test("a failed save keeps the step open with the error banner", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    api.failNextSave(500);
    await w.homeInput().fill("Port Credit");
    await w.continueButton().click();
    await expect(w.errorBanner()).toHaveText("That did not save. Try again in a moment.");
    expect(new URL(page.url()).pathname).toBe("/welcome/home");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");
  });
});
