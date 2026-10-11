import { test, expect } from "../fixtures/sd-test.js";

/**
 * Block actions on touch screens (L2-028 AC4, drift D21). From 720px a
 * weekend block swaps its chevron for inline Why this / Swap / Lock actions.
 * A pointer that hovers reveals them on hover or focus; a touch tablet has
 * no hover, so they are always shown there.
 */

const BELOW_720 = "below 720px blocks expose their actions through the chevron";

test.describe("Block actions on a touch tablet", () => {
  // A touch screen: Chromium then matches (hover: none) and (pointer: coarse).
  test.use({ hasTouch: true });
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 720, BELOW_720);

  test("Given a touch tablet, when the weekend plan is shown, then each planner block's actions are visible without hover or focus", async ({
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await goto("weekend");
    await w.waitForPlan();

    const block = w.actionableBlocks("Saturday").first();
    expect(await w.blockActionsShowing(block)).toBe(true);
  });
});

test.describe("Block actions with a pointer that hovers", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 720, BELOW_720);

  test("Given a pointer that hovers, when the weekend plan is shown, then a block's actions stay hidden until the block is hovered", async ({
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await goto("weekend");
    await w.waitForPlan();
    await w.movePointerAway();

    const block = w.actionableBlocks("Saturday").first();
    expect(await w.blockActionsShowing(block)).toBe(false);
    await w.hoverBlock(block);
    expect(await w.blockActionsShowing(block)).toBe(true);
  });
});
