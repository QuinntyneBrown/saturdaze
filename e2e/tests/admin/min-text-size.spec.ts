import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Minimum text size in Saturdaze Admin (drift D12). The "Admin" tag, the
 * curator's small avatar and the small health chips on place rows were
 * 11px; every one is now 12px (`--fontSizeBase200`).
 */

const MIN_TEXT = "12px";

test.describe("Admin minimum text size", () => {
  test("Given the places list, when a curator reads the Admin tag, their avatar and a row's health chip, then each is 12px", async ({
    goto,
    pages,
  }) => {
    await goto("adminPlaces");
    const a = pages.adminPlaces;
    await a.waitForScreen("places");

    expect(await a.fontSize(a.adminNavTag())).toBe(MIN_TEXT);
    expect(await a.fontSize(a.adminNavAvatar())).toBe(MIN_TEXT);
    expect(await a.fontSize(a.rowFlags(a.row("Riverwood Conservancy")).first())).toBe(MIN_TEXT);
  });
});
