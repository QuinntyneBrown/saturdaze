import { test, expect } from "../fixtures/sd-test.js";

test.describe("Shopping errand", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("errand");
    await pages.errand.waitForComponentsReady();
  });

  test("top bar reads 'Add an errand'", async ({ pages }) => {
    await expect(pages.errand.topBarTitle()).toHaveText("Add an errand");
    await expect(pages.errand.topBarBackLink()).toBeVisible();
  });

  test("heading + lede render", async ({ pages, page }) => {
    await expect(pages.errand.headingTitle()).toBeVisible();
    await expect(
      page.getByText(/I'll fit it on the way to or from/)
    ).toBeVisible();
  });

  test("text inputs are present with hints", async ({ pages }) => {
    await expect(pages.errand.whatsNeededInput()).toBeVisible();
    await expect(pages.errand.howLongInput()).toBeVisible();
    await expect(pages.errand.howLongInput()).toHaveAttribute(
      "hint",
      /10 min buffer/
    );
  });

  test("best-day chips render in documented order with Sunday primary", async ({ pages }) => {
    const chips = pages.errand.bestDayChips();
    await expect(chips).toHaveCount(4);
    await expect(chips.nth(0)).toHaveAttribute("tone", "primary");
    await expect(chips.nth(0)).toContainText("Sunday morning");
    await expect(chips.nth(1)).toContainText("Saturday after swim");
    await expect(chips.nth(2)).toContainText("Friday evening");
    await expect(chips.nth(3)).toContainText("Doesn't matter");
  });

  test("suggested slot callout names Sunday 9:15am", async ({ pages, page }) => {
    await expect(pages.errand.suggestedSlotCard()).toBeVisible();
    await expect(page.getByText(/Sunday 9:15am/)).toBeVisible();
  });

  test("footer offers 'Pick a different slot' + 'Add to weekend'", async ({ pages }) => {
    await expect(pages.errand.pickDifferentSlotButton()).toHaveAttribute(
      "variant",
      "secondary"
    );
    await expect(pages.errand.addToWeekendButton()).toBeVisible();
  });
});
