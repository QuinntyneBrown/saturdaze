import { test, expect } from "../fixtures/sd-test.js";

/**
 * Hint text contrast (drift D04, WCAG 1.4.3). Placeholders, durations, notes
 * and footers read `--colorNeutralForeground3`, slate #636A77: 4.75:1 on wells
 * and more on the canvas and cards. The old faint grey #9CA3AF was 2.38 to
 * 2.54:1 and is kept for disabled text only.
 */

const HINT_SLATE = "rgb(99, 106, 119)"; // #636A77

test.describe("Hint text contrast", () => {
  test("Given the sign-in screen, when a person reads the footer, then its text is the AA hint slate", async ({
    goto,
    pages,
  }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
    const s = pages.signIn;
    expect(await s.textColor(s.foot())).toBe(HINT_SLATE);
  });

  test("Given the create-account screen, when the family name is empty, then its placeholder is the AA hint slate", async ({
    goto,
    pages,
  }) => {
    await goto("createAccount");
    await pages.createAccount.waitForReady();
    const c = pages.createAccount;
    expect(await c.placeholderColor(c.familyNameInput())).toBe(HINT_SLATE);
  });

  test("Given the landing page, when a person reads the hero note and the footer, then both are the AA hint slate", async ({
    goto,
    pages,
  }) => {
    await goto("landing");
    await pages.landing.waitForReady();
    const l = pages.landing;
    expect(await l.textColor(l.heroNote())).toBe(HINT_SLATE);
    expect(await l.textColor(l.footer)).toBe(HINT_SLATE);
  });
});
