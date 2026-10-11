import { test, expect } from "../fixtures/sd-test.js";

/**
 * Chip remove target (drift D27, WCAG 2.5.8). The remove glyph on a chip in
 * a chip input stays 16px, but its hit area is 24 × 24px, so a tap a few
 * pixels off the glyph still removes the chip.
 */

test.describe("Chip remove target", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("family");
    await pages.family.waitForReady();
  });

  test("Given the likes editor, when a person taps just above a like's remove glyph, then that like is removed", async ({
    pages,
  }) => {
    const f = pages.family;
    const like = `Kites${Date.now().toString(36)}`;
    await f.editLikesButton().click();
    await f.addDialogChip("Likes", like);
    await expect(f.dialogChip(like)).toHaveCount(1);

    await f.tapJustAboveRemoveGlyph(like, 3);

    await expect(f.dialogChip(like)).toHaveCount(0);
  });
});
