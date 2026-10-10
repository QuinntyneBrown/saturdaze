import { test, expect } from "../fixtures/sd-test.js";

/**
 * Rating star contrast (drift D09, WCAG 1.4.11 and 1.4.1). A filled star is a
 * solid glyph in `--colorPaletteSunForeground3`, sun 600 #B07F14 (3.56:1 on
 * white); an empty star is an outline in `--colorNeutralStrokeAccessible`
 * #80868F. The old pale sun #F4C969 (1.57:1) and disabled grey #9CA3AF
 * (2.54:1) were too faint for an input.
 */

const SUN_600 = "rgb(176, 127, 20)"; // #B07F14
const ACCESSIBLE_STROKE = "rgb(128, 134, 143)"; // #80868F

test.describe("Rating star contrast", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("dialogs");
    await pages.dialogs.waitForReady();
  });

  test("Given a five-star rating, when a person reads the stars, then each is a solid sun 600 star", async ({
    pages,
  }) => {
    const d = pages.dialogs;
    for (const n of [1, 5]) {
      expect(await d.glyphFill(d.ratingStar(n))).toBe(SUN_600);
    }
  });

  test("Given a person picks three stars, when they read the rest, then the empty ones are outlines in the accessible stroke", async ({
    pages,
  }) => {
    const d = pages.dialogs;
    await d.rate(3);
    expect(await d.glyphFill(d.ratingStar(3))).toBe(SUN_600);
    for (const n of [4, 5]) {
      expect(await d.glyphFill(d.ratingStar(n))).toBe("none");
      expect(await d.glyphStroke(d.ratingStar(n))).toBe(ACCESSIBLE_STROKE);
    }
  });
});
