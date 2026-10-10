import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Text over photos in Saturdaze Admin (drift D11, WCAG 1.4.3). The place's
 * photo-pick preview names the place on `--colorBackgroundOverlayStrong`,
 * slate at 72%, at 12px, the same pill the family app shows in D29.
 */

const OVERLAY_STRONG = "rgba(31, 41, 55, 0.72)";
const CAPTION = "12px";

test.describe("Admin text over photos", () => {
  test("Given a place's slot previews, when a curator reads the photo-pick name, then it is 12px on the strong overlay", async ({
    goto,
    pages,
  }) => {
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
    await pages.adminPlaces.row("Riverwood Conservancy").click();
    const a = pages.adminPlace;
    await a.waitForScreen("place");

    expect(await a.fillColor(a.previewPickName())).toBe(OVERLAY_STRONG);
    expect(await a.fontSize(a.previewPickName())).toBe(CAPTION);
  });
});
