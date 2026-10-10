import { test, expect } from "../fixtures/sd-test.js";

/**
 * Control edge contrast (drift D06, WCAG 1.4.11). Text field borders and the
 * off switch track read `--colorNeutralStrokeAccessible`, slate #80868F:
 * 3.67:1 on white and 3.20:1 on wells. The old 16% ink line was 1.36:1.
 */

const ACCESSIBLE_STROKE = "rgb(128, 134, 143)"; // #80868F

test.describe("Control edge contrast", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
  });

  test("Given the sign-in screen, when a person looks for the email field, then its border is the accessible stroke", async ({
    pages,
  }) => {
    const s = pages.signIn;
    expect(await s.borderColor(s.emailInput())).toBe(ACCESSIBLE_STROKE);
  });

  test("Given the sign-in screen, when a person turns Remember me off, then its track is the accessible stroke", async ({
    pages,
  }) => {
    const s = pages.signIn;
    await s.rememberToggle().click();
    await expect(s.rememberToggle()).not.toBeChecked();
    await s.settleTransitions(s.rememberTrack());
    expect(await s.fillColor(s.rememberTrack())).toBe(ACCESSIBLE_STROKE);
  });
});
