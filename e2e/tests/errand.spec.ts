import { test, expect } from "../fixtures/sd-test.js";

/**
 * Shopping errand — real placement through `POST /api/weekends/{id}/errands`
 * (L2-021). Each happy-path run appends one errand to the seeded family's
 * weekend; `saturdaze reset --yes` clears them.
 */

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
    await expect(page.getByText(/I'll fit it on the way to or from/)).toBeVisible();
  });

  test("text inputs are present with hints", async ({ pages }) => {
    await expect(pages.errand.whatsNeededInput()).toBeVisible();
    await expect(pages.errand.howLongInput()).toBeVisible();
    await expect(pages.errand.howLongInput()).toHaveAttribute("hint", /10 min buffer/);
  });

  test("best-day chips offer Saturday / Sunday / Doesn't matter, defaulting to Doesn't matter", async ({ pages, page }) => {
    const chips = pages.errand.bestDayChips();
    await expect(chips).toHaveCount(3);
    await expect(chips.nth(0)).toContainText("Saturday");
    await expect(chips.nth(1)).toContainText("Sunday");
    await expect(chips.nth(2)).toContainText("Doesn't matter");
    await expect(chips.nth(2)).toHaveAttribute("tone", "primary");
    await expect(chips.nth(2)).toHaveAttribute("aria-checked", "true");

    await chips.nth(0).click();
    await expect(chips.nth(0)).toHaveAttribute("tone", "primary");
    await expect(chips.nth(2)).not.toHaveAttribute("tone", "primary");
    await expect(page.locator(".suggested-body")).toContainText(/lands on Saturday/);
  });

  test("footer offers Cancel + a disabled 'Add to weekend' until the form is valid", async ({ pages }) => {
    await expect(pages.errand.cancelButton()).toHaveAttribute("variant", "secondary");
    await expect(pages.errand.addToWeekendButton().locator("button")).toBeDisabled();

    await pages.errand.whatsNeededInput().locator("input").fill("Milk run");
    await pages.errand.howLongInput().locator("input").fill("20");
    await expect(pages.errand.addToWeekendButton().locator("button")).toBeEnabled();
  });

  test("adding an errand places it on the weekend and returns home", async ({ page, pages, goto }) => {
    const description = `Costco run e2e ${Date.now()}`;
    await pages.errand.whatsNeededInput().locator("input").fill(description);
    await pages.errand.howLongInput().locator("input").fill("45");
    await pages.errand.bestDayChips().nth(0).click(); // Saturday

    const placed = page.waitForResponse((r) => r.url().includes("/errands") && r.request().method() === "POST");
    await pages.errand.addToWeekendButton().locator("button").click();
    expect((await placed).status()).toBe(200);

    await expect(page.locator(".errand-lede h2")).toHaveText(/Added to (Saturday|Sunday|the weekend)/);
    await expect(page.locator(".suggested-title")).toHaveText(/Slotted for (Saturday|Sunday) at \d{2}:\d{2}|Added to the weekend/);
    await page.waitForURL(/\/weekend$/, { timeout: 8_000 });

    // The errand is now a real block on the itinerary.
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
    await expect(pages.itinerary.allTimelineBlocks().filter({ hasText: description }).first()).toBeAttached();
  });
});
