import { test, expect } from "../fixtures/sd-test.js";

/**
 * The reader's text size (L2-028 AC5, drift D24, WCAG 1.4.4). Breakpoints
 * are in rem (23.75 / 36 / 45 / 64rem) and type sizes are in rem, so a
 * reader who raises the browser's text size from 16px to 20px gets text
 * 25% larger and, in an 820px window (41rem), the layout made for narrow
 * screens rather than cramped text in the wide one.
 */

const WINDOW = { width: 820, height: 1180 };
const READER_TEXT_SIZE = 20;

test.describe("The reader's text size", () => {
  test.beforeEach(async ({ page, pages }) => {
    await page.setViewportSize(WINDOW);
    await pages.family.setBrowserTextSize(READER_TEXT_SIZE);
  });

  test("Given text set to 20px in an 820px window, when the family page opens, then it uses the narrow layout with the bottom navigation", async ({
    goto,
    pages,
  }) => {
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await expect(f.bottomNav).toBeVisible();
    await expect(f.topbar).toBeHidden();
  });

  test("Given text set to 20px, when the family page opens, then the 26px page title grows to 32.5px", async ({
    goto,
    pages,
  }) => {
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    expect(await f.fontSize(f.pageTitle())).toBe("32.5px");
  });
});
