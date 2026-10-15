import type { Locator } from "@playwright/test";

import { test, expect } from "../fixtures/sd-test.js";
import { contrast } from "../fixtures/colour.js";

/**
 * Selected segment edge (drift D46, WCAG 1.4.11). The selected segment of a
 * track (the Weekend day tabs, the "Will they sign in?" choice) differs from
 * the track by only a small luminance step, so it draws a 1px inset edge in
 * `--colorNeutralStrokeAccessible` and that edge must reach 3:1 on the track.
 */

const INSET_EDGE = /(rgba?\([^)]*\))\s+0px 0px 0px 1px inset/;

async function edgeOnTrack(selected: Locator, track: Locator): Promise<number> {
  const shadow = await selected.evaluate((el) => getComputedStyle(el).boxShadow);
  const edge = INSET_EDGE.exec(shadow)?.[1];
  expect(edge, `no 1px inset edge in box-shadow: ${shadow}`).toBeTruthy();
  const trackColour = await track.evaluate((el) => getComputedStyle(el).backgroundColor);
  return contrast(edge!, trackColour);
}

test.describe("Selected segment edge", () => {
  test("Given the Weekend screen, when a person looks at the day tabs, then the selected tab has an edge of at least 3:1 on the track", async ({
    goto,
    pages,
  }) => {
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    expect(await edgeOnTrack(w.dayTab("Saturday"), w.dayTabTrack())).toBeGreaterThanOrEqual(3);
  });

  test("Given the Add a family member dialog, when a person looks at Will they sign in?, then the chosen option has an edge of at least 3:1 on the track", async ({
    goto,
    pages,
  }) => {
    await goto("family");
    const f = pages.family;
    await f.addMemberRow().click();
    expect(await edgeOnTrack(f.selectedSignInOption(), f.signInTrack())).toBeGreaterThanOrEqual(3);
  });
});
