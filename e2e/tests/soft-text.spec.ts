import { test, expect } from "../fixtures/sd-test.js";

/**
 * Secondary text contrast (drift D05, WCAG 1.4.3). Secondary text, chips and
 * resting segments read `--colorNeutralForeground2`, slate #5B6270: 5.35:1 on
 * wells and 6.13:1 on white. The old soft grey #6B7280 was 4.22:1 on wells.
 */

const SOFT_SLATE = "rgb(91, 98, 112)"; // #5B6270

test.describe("Secondary text contrast", () => {
  test("Given the legal page, when a person reads the resting document segment on its well, then it is the AA soft slate", async ({
    goto,
    pages,
  }) => {
    await goto("legal");
    await pages.legal.waitForReady();
    const l = pages.legal;
    expect(await l.textColor(l.docTab("Privacy"))).toBe(SOFT_SLATE);
  });

  test("Given the sign-in screen, when a person reads the card subtitle, then it is the AA soft slate", async ({
    goto,
    pages,
  }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
    const s = pages.signIn;
    expect(await s.textColor(s.cardSubtitle())).toBe(SOFT_SLATE);
  });

  test("Given the landing page, when a person reads the hero lede, then it is the AA soft slate", async ({
    goto,
    pages,
  }) => {
    await goto("landing");
    await pages.landing.waitForReady();
    const l = pages.landing;
    expect(await l.textColor(l.heroLede())).toBe(SOFT_SLATE);
  });
});
