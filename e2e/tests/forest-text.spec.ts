import { test, expect } from "../fixtures/sd-test.js";

/**
 * Forest text contrast (drift D07, WCAG 1.4.3). Text on the forest and leaf
 * tints reads `--colorStatusSuccessForeground1` / `--colorPaletteLeafForeground1`,
 * forest #256B51: 5.25:1 on its tint. The old #2D7D5F was 4.11:1; it stays
 * as the solid fill.
 */

const FOREST_INK = "rgb(37, 107, 81)"; // #256B51

test.describe("Forest text contrast", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("dialogs");
    await pages.dialogs.waitForReady();
  });

  test("Given a food pick, when a person reads its Wife-approved chip, then it is the AA forest ink", async ({
    pages,
  }) => {
    const d = pages.dialogs;
    expect(await d.textColor(d.chip("lock-in", "Wife-approved"))).toBe(FOREST_INK);
  });

  test("Given a food pick, when a person reads its leaf vote chip, then it is the AA forest ink", async ({
    pages,
  }) => {
    const d = pages.dialogs;
    expect(await d.textColor(d.chip("lock-in", "3 of 4 yes"))).toBe(FOREST_INK);
  });
});
