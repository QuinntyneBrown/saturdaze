import { test, expect } from "../fixtures/sd-test.js";

/**
 * Form fields on touch screens (L2-028 AC7). iOS zooms the page into a focused
 * field whose text is under 16px and never zooms back, leaving every screen
 * cut off at the right edge. On a touch device the text, select and tag
 * fields are 16px; a pointer device keeps the type scale's 15px.
 */

test.describe("Form fields on a touch screen", () => {
  // A touch screen: Chromium then matches (hover: none) and (pointer: coarse).
  test.use({ hasTouch: true });

  test("Given a touch screen, when a person adds an errand, then its text and select fields are 16px", async ({
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await goto("weekend");
    await w.waitForPlan();
    await w.addErrandRow("Saturday").click();

    expect(await w.fontSize(w.dialogField("What is it"))).toBe("16px");
    expect(await w.fontSize(w.dialogField("Roughly how long"))).toBe("16px");
  });

  test("Given a touch screen, when a person edits likes, then the tag field is 16px", async ({
    goto,
    pages,
  }) => {
    const f = pages.family;
    await goto("family");
    await f.waitForReady();
    await f.editLikesButton().click();

    expect(await f.fontSize(f.dialogField("Likes"))).toBe("16px");
  });
});

test.describe("Form fields with a pointer", () => {
  test("Given a pointer, when a person adds an errand, then its text field keeps the 15px type scale", async ({
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await goto("weekend");
    await w.waitForPlan();
    await w.addErrandRow("Saturday").click();

    expect(await w.fontSize(w.dialogField("What is it"))).toBe("15px");
  });
});
