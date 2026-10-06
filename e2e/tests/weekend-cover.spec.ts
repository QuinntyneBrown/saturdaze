import { test, expect } from "../fixtures/sd-test.js";
import { stubWeekendCover } from "../fixtures/weekend-cover.js";

/** Weekend cover photo — `.cover` and D29 (L2-108). */

test.describe("Weekend — cover photo", () => {
  test("the cover leads with the photo, its credit, the dates, the title and the summary", async ({ page, goto, pages }) => {
    // Traces to: L2-108 AC1
    const stub = await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await expect(w.coverImage()).toHaveAttribute("alt", `Photo of ${stub.stops[0]}`);
    await expect(w.coverCredit()).toHaveText(`From ${stub.stops[0]}`);
    await expect(w.coverEyebrow()).toHaveText(/^\d{1,2}( [A-Z][a-z]{2})? – \d{1,2} [A-Z][a-z]{2}$/);
    await expect(w.coverTitle()).toHaveText("This weekend");
    await expect(w.coverSubtitle()).not.toBeEmpty();
  });

  test("16:9 under 720px, 21:8 from 720px, with the actions below", async ({ page, goto, pages }, testInfo) => {
    // Traces to: L2-108 AC5
    await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    const box = (await w.cover().boundingBox())!;
    const wide = (testInfo.project.use.viewport?.width ?? 1440) >= 720;
    expect(box.width / box.height).toBeCloseTo(wide ? 21 / 8 : 16 / 9, 1);
    const actions = (await w.coverActions().boundingBox())!;
    expect(actions.y).toBeGreaterThanOrEqual(box.y + box.height);
    await expect(w.shareButton()).toBeVisible();
    await expect(w.addToCalendarButton()).toBeVisible();
    await expect(w.moreButton()).toBeVisible();
  });

  test("with no stop photos the cover shows the fallback and keeps the title as the h1", async ({ page, goto, pages }) => {
    // Traces to: L2-108 AC3
    await stubWeekendCover(page, { cover: false });
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    await expect(w.coverImage()).toHaveCount(0);
    await expect(w.coverFallback()).toBeVisible();
    await expect(w.coverTitle()).toHaveText("This weekend");
  });

  test("Change photo offers each stop's photo and switches the cover", async ({ page, goto, pages }) => {
    // Traces to: L2-108 AC2
    const stub = await stubWeekendCover(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    test.skip(stub.stops.length < 2, "the planner gave only one day an activity");

    await w.changePhotoButton().click();
    await expect(w.dialogTitle()).toHaveText("Cover photo");
    await expect(w.coverPhotoOptions()).toHaveCount(stub.stops.length);
    await expect(w.coverPhotoOption(stub.stops[0]!)).toBeChecked();

    await w.coverPhotoOption(stub.stops[1]!).check();
    await w.dialogAction("Use this photo").click();
    await expect(w.dialog()).toHaveCount(0);
    expect(stub.lastPut).toMatchObject({ source: "stop" });
    await expect(w.coverCredit()).toHaveText(`From ${stub.stops[1]}`);
  });
});
