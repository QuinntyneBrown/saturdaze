import { test, expect } from "../fixtures/sd-test.js";
import { contrast, luminance } from "../fixtures/colour.js";

/**
 * The tooltip bubble (L2-132, drift D30). A tooltip is the inverse of the
 * surface so it reads over any card: a dark bubble with light text in the
 * light theme, a light bubble with dark text in the dark theme, its text
 * meeting 4.5:1 on the fill either way.
 */

const BELOW_720 = "below 720px blocks expose their actions through the chevron";
const OPAQUE = /^rgb\(/;

test.describe("Tooltip bubble", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 720, BELOW_720);

  test("Given the light theme, when a person hovers a block's Swap button, then its tooltip is an opaque dark bubble with light text", async ({
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await w.preferColorScheme("light");
    await goto("weekend");
    await w.waitForPlan();

    const bubble = await w.hoverForTooltip(w.firstSwapButton("Saturday"));
    const fill = await w.fillColor(bubble);
    const text = await w.textColor(bubble);
    expect(fill).toMatch(OPAQUE);
    expect(luminance(fill)).toBeLessThan(luminance(text));
    expect(contrast(text, fill)).toBeGreaterThanOrEqual(4.5);
  });

  test("Given the dark theme, when a person hovers a block's Swap button, then its tooltip is an opaque light bubble with dark text", async ({
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await w.preferColorScheme("dark");
    await goto("weekend");
    await w.waitForPlan();

    const bubble = await w.hoverForTooltip(w.firstSwapButton("Saturday"));
    const fill = await w.fillColor(bubble);
    const text = await w.textColor(bubble);
    expect(fill).toMatch(OPAQUE);
    expect(luminance(fill)).toBeGreaterThan(luminance(text));
    expect(contrast(text, fill)).toBeGreaterThanOrEqual(4.5);
  });
});
