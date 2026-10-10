import { test, expect } from "../fixtures/sd-test.js";
import { stubWeekendCover } from "../fixtures/weekend-cover.js";

/**
 * Text over photos (drift D11, WCAG 1.4.3). A photo credit or photo-pick
 * name sits on `--colorBackgroundOverlayStrong`, slate at 72%, and is set at
 * 12px (`--fontSizeBase200`), so white text stays above 4.5:1 over any
 * photo. The mocks' 11px text on a 55 to 60% pill fell under it over light
 * photos.
 */

const OVERLAY_STRONG = "rgba(31, 41, 55, 0.72)";
const CAPTION = "12px";

test.describe("Text over photos", () => {
  test("Given a weekend with a cover photo, when a person reads its credit, then it is 12px on the strong overlay", async ({
    page,
    goto,
    pages,
  }) => {
    await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    expect(await w.fillColor(w.coverCredit())).toBe(OVERLAY_STRONG);
    expect(await w.fontSize(w.coverCredit())).toBe(CAPTION);
  });

  test("Given the cover photo dialog, when a person reads a stop's photo name, then it is 12px on the strong overlay", async ({
    page,
    goto,
    pages,
  }) => {
    const stub = await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    await w.changePhotoButton().click();

    const name = w.coverPhotoName(stub.stops[0]!);
    expect(await w.fillColor(name)).toBe(OVERLAY_STRONG);
    expect(await w.fontSize(name)).toBe(CAPTION);
  });
});
