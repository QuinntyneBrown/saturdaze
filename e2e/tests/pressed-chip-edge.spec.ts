import { test, expect } from "../fixtures/sd-test.js";

/**
 * Pressed tinted filter chips (drift D26, WCAG 1.4.11). A tinted chip that
 * is on fills with its pale tone and also draws its edge in the tone's ink
 * colour, so "on" never rests on a pale fill alone.
 */

test.describe("Pressed tinted filter chip edge", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("ideas");
    await pages.ideas.waitForReady();
  });

  test("Given the activity ideas, when a person turns Outdoor on, then its edge is drawn in its leaf ink", async ({
    pages,
  }) => {
    const i = pages.ideas;
    const outdoor = i.filterChip("Outdoor");
    await outdoor.click();
    await expect(outdoor).toHaveAttribute("aria-pressed", "true");
    await i.settleTransitions(outdoor);
    expect(await i.borderColor(outdoor)).toBe(await i.textColor(outdoor));
  });

  test("Given the activity ideas, when a person turns Indoor on, then its edge is drawn in its indoor ink", async ({
    pages,
  }) => {
    const i = pages.ideas;
    const indoor = i.filterChip("Indoor");
    await indoor.click();
    await expect(indoor).toHaveAttribute("aria-pressed", "true");
    await i.settleTransitions(indoor);
    expect(await i.borderColor(indoor)).toBe(await i.textColor(indoor));
  });
});
