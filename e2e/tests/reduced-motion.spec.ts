import { test, expect } from "../fixtures/sd-test.js";

/**
 * Reduced motion (L2-131, drift D29). When the reader's system asks for
 * reduced motion, decoration stops (transitions, the skeleton shimmer) but a
 * loading spinner keeps turning: it is the only sign that work is going on.
 */

test.describe("Reduced motion", () => {
  test.beforeEach(async ({ goto, pages }) => {
    const w = pages.weekend;
    await w.preferReducedMotion();
    await goto("weekendGenerating");
    await w.waitForReady();
  });

  test("Given a system that prefers reduced motion, when the weekend is generating, then the spinner keeps turning", async ({
    pages,
  }) => {
    const w = pages.weekend;
    expect(await w.animations(w.statusSpinner())).toEqual([
      {
        name: "sd-spin",
        playState: "running",
        duration: 900,
        iterations: Infinity,
      },
    ]);
  });

  test("Given a system that prefers reduced motion, when the weekend is generating, then the skeleton rows do not shimmer", async ({
    pages,
  }) => {
    const w = pages.weekend;
    await expect(w.skeletonRows().first()).toBeVisible();

    expect(await w.animations(w.skeletonRows().first())).toEqual([]);
  });

  test("Given a system that prefers reduced motion, when a button is rendered, then its transitions are instant", async ({
    pages,
  }) => {
    const w = pages.weekend;

    expect(await w.longestTransition(w.shareButton())).toBeLessThanOrEqual(
      0.01,
    );
  });
});
