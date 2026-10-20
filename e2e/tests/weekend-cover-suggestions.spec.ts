import { test, expect } from "../fixtures/sd-test.js";
import { stubWeekendCover } from "../fixtures/weekend-cover.js";
import { stubPhotoSuggestions, stubUseSuggestedCover, TWO_SUGGESTIONS } from "../fixtures/photo-suggestions.js";

/** D29 "Suggest photos" — AI photo suggestions for the weekend cover (L2-158). */

test.describe("Weekend — suggested cover photos", () => {
  test("suggestions appear under 'From the web' and the chosen one becomes the cover", async ({ page, goto, pages }) => {
    // Traces to: L2-158 AC4
    await stubWeekendCover(page);
    const stub = await stubPhotoSuggestions(page);
    await stubUseSuggestedCover(page, stub);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.changePhotoButton().click();
    await expect(w.dialogTitle()).toHaveText("Cover photo");
    await w.suggestPhotosButton().click();

    await expect(w.suggestionsHeading()).toHaveText("From the web");
    await expect(w.suggestionOptions()).toHaveCount(2);
    await expect(w.suggestionCaptions()).toHaveText(TWO_SUGGESTIONS.map((s) => s.sourceName));
    await expect(w.suggestionStatus()).toHaveText("2 photos found on the web.");
    expect(stub.searches[0]).toMatchObject({ target: "weekendCover" });

    await w.suggestionOption(/Lavender rows/).check();
    await w.dialogAction("Use this photo").click();
    await expect(w.dialog()).toHaveCount(0);
    expect(stub.uses[0]).toEqual({ suggestionId: TWO_SUGGESTIONS[0].id });
    await expect(w.coverCredit()).toHaveText(TWO_SUGGESTIONS[0].attribution);
  });

  test("a refinement travels with the search", async ({ page, goto, pages }) => {
    // Traces to: L2-158 AC4
    await stubWeekendCover(page);
    const stub = await stubPhotoSuggestions(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.changePhotoButton().click();
    await w.suggestionQueryInput().fill("golden hour");
    await w.suggestPhotosButton().click();
    await expect(w.suggestionOptions()).toHaveCount(2);
    expect(stub.searches[0]).toMatchObject({ target: "weekendCover", query: "golden hour" });
  });

  test("no result says so and a stop photo can still be used", async ({ page, goto, pages }) => {
    // Traces to: L2-158 AC5
    const cover = await stubWeekendCover(page);
    await stubPhotoSuggestions(page, []);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.changePhotoButton().click();
    await w.suggestPhotosButton().click();
    await expect(w.suggestionStatus()).toHaveText("No photos found. Try a different search.");
    await expect(w.suggestionOptions()).toHaveCount(0);
    await expect(w.coverPhotoOption(cover.stops[0]!)).toBeChecked();
    await expect(w.dialogAction("Use this photo")).toBeEnabled();
  });

  test("a failed search shows the error banner and keeps the stop photos selectable", async ({ page, goto, pages }) => {
    // Traces to: L2-158 AC6
    const cover = await stubWeekendCover(page);
    await stubPhotoSuggestions(page, "error");
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    test.skip(cover.stops.length < 2, "the planner gave only one day an activity");

    await w.changePhotoButton().click();
    await w.suggestPhotosButton().click();
    await expect(w.coverPhotoError()).toHaveText(/not available right now|Try again/);
    await w.coverPhotoOption(cover.stops[1]!).check();
    await expect(w.coverPhotoOption(cover.stops[1]!)).toBeChecked();
    await expect(w.dialogAction("Use this photo")).toBeEnabled();
  });

  test("suggestion tiles fit the dialog without horizontal scroll", async ({ page, goto, pages }) => {
    // Traces to: L2-158 AC7
    await stubWeekendCover(page);
    await stubPhotoSuggestions(page);
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.changePhotoButton().click();
    await w.suggestPhotosButton().click();
    await expect(w.suggestionOptions()).toHaveCount(2);
    const overflow = await w.dialogBody().evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
