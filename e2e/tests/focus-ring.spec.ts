import { test, expect } from "../fixtures/sd-test.js";

/**
 * Keyboard focus ring (drift D03, WCAG 1.4.11 and 2.4.7). The ring, and a
 * text field's focus border, read `--colorStrokeFocus2`, the deep coral
 * #A04B2C: 5.56:1 on the cream canvas and 5.18:1 on wells. The old ring was the brand coral #E07856 at 2.81:1.
 */

const AA_FOCUS_CORAL = "rgb(160, 75, 44)"; // #A04B2C

test.describe("Keyboard focus ring", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
  });

  test("Given the sign-in screen, when a person tabs to a link, then its ring is the AA focus coral", async ({
    pages,
  }) => {
    const s = pages.signIn;
    expect(await s.focusRingColor(s.forgotPasswordLink())).toBe(AA_FOCUS_CORAL);
  });

  test("Given the sign-in screen, when a person tabs to the primary button, then its ring is the AA focus coral", async ({
    pages,
  }) => {
    const s = pages.signIn;
    expect(await s.focusRingColor(s.signInButton())).toBe(AA_FOCUS_CORAL);
  });

  test("Given the sign-in screen, when a person tabs into a text field, then its focus border is the AA focus coral", async ({
    pages,
  }) => {
    const s = pages.signIn;
    expect(await s.focusBorderColor(s.emailInput())).toBe(AA_FOCUS_CORAL);
  });
});
