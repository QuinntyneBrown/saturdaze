import { test, expect } from "../fixtures/sd-test.js";
import { addDaysIso, dateTile, upcomingSaturdayIso } from "../fixtures/dates.js";

/**
 * Local events feed. `saturdaze seed` anchors the bundled events on the
 * upcoming Saturday at seed time, so a fresh stack (Start-FreshStack.ps1)
 * puts three events on Saturday, two on Sunday and one seven days out.
 */

test.describe("Local events feed", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("events");
    await pages.events.waitForComponentsReady();
    await expect(pages.events.allEventCards().first()).toBeVisible();
  });

  test("top bar reads 'Local events' with back link and a submit action", async ({ pages }) => {
    await expect(pages.events.topBarTitle()).toHaveText("Local events");
    await expect(pages.events.topBarBackLink()).toBeVisible();
    await expect(pages.events.topBar.locator('a[href="/events/submit"]')).toBeVisible();
  });

  test("heading + filter chips render with This weekend active", async ({ pages }) => {
    await expect(pages.events.headingTitle()).toBeVisible();
    await expect(pages.events.filterChips()).toHaveCount(7);
    await expect(pages.events.filterChips().nth(0)).toContainText("This weekend");
    await expect(pages.events.filterChips().nth(0)).toHaveAttribute("tone", "primary");
    await expect(pages.events.filterChips().nth(1)).toContainText("Next weekend");
  });

  test("Saturday section lists three events dated on the upcoming Saturday", async ({ pages }) => {
    await expect(pages.events.saturdaySection().locator("sd-event-card")).toHaveCount(3);
    const card = pages.events.eventCard("Terre Bleu — Lavender Bloom Opening");
    await expect(card).toHaveAttribute("tag", "Seasonal");
    await expect(card).toHaveAttribute("drive", "45 min");
    const tile = dateTile(upcomingSaturdayIso());
    await expect(card).toHaveAttribute("date-day", tile.day);
    await expect(card).toHaveAttribute("date-mon", tile.mon);
  });

  test("Sunday section lists two events; a multi-day event stays on Saturday", async ({ pages }) => {
    await expect(pages.events.sundaySection().locator("sd-event-card")).toHaveCount(2);
    await expect(pages.events.sundaySection().locator("sd-event-card").filter({ hasText: "Spring Tulip Festival" })).toHaveCount(0);
    await expect(pages.events.saturdaySection().locator("sd-event-card").filter({ hasText: "Spring Tulip Festival" })).toHaveCount(1);
  });

  test("Coming soon shows only events inside the two-week window", async ({ pages }) => {
    await expect(pages.events.comingSoonSection().locator("sd-event-card")).toHaveCount(1);
    const card = pages.events.eventCard("Strawberry-picking opens");
    const tile = dateTile(addDaysIso(upcomingSaturdayIso(), 7));
    await expect(card).toHaveAttribute("date-day", tile.day);
    await expect(pages.events.eventCard("Pumpkin patch — early access")).toHaveCount(0);
  });

  test("a category chip narrows every card to that category", async ({ pages }) => {
    const seasonal = pages.events.filterChips().filter({ hasText: "Seasonal" });
    await seasonal.click();
    await expect(seasonal).toHaveAttribute("tone", "primary");
    const cards = pages.events.allEventCards();
    const n = await cards.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(cards.nth(i)).toHaveAttribute("tag", "Seasonal");
  });

  test("'Next weekend' shows the following weekend's events", async ({ pages }) => {
    await pages.events.filterChips().nth(1).click();
    await expect(pages.events.filterChips().nth(1)).toHaveAttribute("tone", "primary");
    await expect(pages.events.eventCard("Strawberry-picking opens")).toBeVisible();
  });

  test("the FAB opens the quick-add dialog", async ({ page }) => {
    await page.locator("button.events-fab").click();
    const dialog = page.locator("sd-dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});
