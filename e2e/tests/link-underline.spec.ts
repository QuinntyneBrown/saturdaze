import { test, expect } from "../fixtures/sd-test.js";

/**
 * Links in sentences (drift D20, WCAG 1.4.1). A `.sd-link` inside running
 * text ("New here? Create an account") is underlined, so it does not rely on
 * colour alone to stand out from the words around it; hover thickens the
 * underline from 1px to 2px.
 */

const RESTING = "underline 1px";
const HOVERED = "underline 2px";

test.describe("Links in sentences are underlined", () => {
  test("Given the sign-in screen, when a person reads the alternative action, then the Create an account link is underlined", async ({
    goto,
    pages,
  }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
    const s = pages.signIn;
    expect(await s.underline(s.createAccountLink())).toBe(RESTING);
  });

  test("Given the sign-in screen, when a person points at the Create an account link, then its underline thickens", async ({
    goto,
    pages,
  }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
    const s = pages.signIn;
    expect(await s.hoverUnderline(s.createAccountLink())).toBe(HOVERED);
  });

  test("Given the create-account screen, when a person reads the terms agreement, then the Terms link is underlined", async ({
    goto,
    pages,
  }) => {
    await goto("createAccount");
    await pages.createAccount.waitForReady();
    const c = pages.createAccount;
    expect(await c.underline(c.termsLink())).toBe(RESTING);
  });
});
