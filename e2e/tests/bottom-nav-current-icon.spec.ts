import { test, expect, isPhone } from "../fixtures/sd-test.js";

/**
 * Current bottom-nav icon contrast (drift D10, WCAG 1.4.11). The current
 * tab's icon reads `--colorBrandForeground2`, coral #A04B2C: 4.97:1 on its
 * `--colorBrandBackground2` pill. The old coral #E07856 was 2.6:1, under the
 * 3:1 a state icon needs.
 */

const CORAL_INK = "rgb(160, 75, 44)"; // #A04B2C

test.describe("Current bottom-nav icon contrast", () => {
  test.beforeEach(async ({ goto, pages }, testInfo) => {
    test.skip(!isPhone(testInfo), "The bottom nav shows below 720px only.");
    await goto("weekend");
    await pages.weekend.waitForReady();
  });

  test("Given the Weekend tab is current, when a person reads its icon on the tinted pill, then it is the AA coral ink", async ({
    pages,
  }) => {
    const w = pages.weekend;
    expect(await w.textColor(w.currentBottomNavIcon())).toBe(CORAL_INK);
  });
});
