import { test, expect } from "../fixtures/sd-test.js";

/**
 * Itinerary detail for the seeded family's current weekend. Block titles
 * come from the planner, so assertions are structural except for the
 * seeded commitments (Swim lessons, Church) which are always present and
 * always locked (L2-011).
 */

const STAT_LABELS = ["blocks planned", "total driving", "locked anchors", /errands? to run/];

test.describe("Itinerary detail", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
    await expect(pages.itinerary.allTimelineBlocks().first()).toBeAttached();
  });

  test("top bar shows the day name with a back link and trailing controls", async ({ pages }) => {
    await expect(pages.itinerary.topBarTitle()).toHaveText("Saturday");
    await expect(pages.itinerary.topBarBackLink()).toBeVisible();
    await expect(pages.itinerary.topBar.locator('sd-icon-button[icon="refresh"]')).toBeVisible();
    await expect(pages.itinerary.topBar.locator('sd-icon-button[icon="more"]')).toBeVisible();
  });

  test("header presents the date eyebrow, a weather title, sub-line, and the weather icon", async ({ pages }) => {
    await expect(pages.itinerary.eyebrow()).toHaveText(/^\d{1,2} \w{3} \d{4}$/);
    await expect(pages.itinerary.title()).not.toBeEmpty();
    await expect(pages.itinerary.subtitle()).not.toBeEmpty();
    await expect(pages.itinerary.sunIcon()).toBeVisible();
  });

  test("header tag group summarises locks, driving and the weather call", async ({ pages }) => {
    const chips = pages.itinerary.headerChips();
    expect(await chips.count()).toBeGreaterThanOrEqual(2);
    await expect(chips.filter({ hasText: /\d+ locked/ })).toHaveCount(1);
    await expect(chips.filter({ hasText: /^(Outdoor|Indoor)$/ })).toHaveCount(1);
  });

  test("day switcher marks Saturday active and switches to Sunday", async ({ pages, page }) => {
    await expect(pages.itinerary.activeDayOption()).toContainText("Saturday");
    await expect(pages.itinerary.dayOption("Sunday")).toBeVisible();

    await pages.itinerary.dayOption("Sunday").click();
    await expect(page).toHaveURL(/day=sunday/);
    await expect(pages.itinerary.topBarTitle()).toHaveText("Sunday");
    await expect(pages.itinerary.activeDayOption()).toContainText("Sunday");
    await expect(pages.itinerary.allTimelineBlocks().filter({ hasText: "Church" }).first()).toBeAttached();
  });

  test("weekend totals show the four stat tiles", async ({ pages }) => {
    await expect(pages.itinerary.weekendStats().locator(".stat")).toHaveCount(4);
    const labels = pages.itinerary.weekendStats().locator(".stat .lab");
    for (let i = 0; i < STAT_LABELS.length; i++) await expect(labels.nth(i)).toHaveText(STAT_LABELS[i]!);
    await expect(pages.itinerary.weekendStats().locator(".stat .num").first()).toHaveText(/^\d+$/);
  });

  test("footer exposes Regenerate (secondary) + Lock day (primary) actions", async ({ pages }) => {
    await expect(pages.itinerary.regenerateButton()).toBeVisible();
    await expect(pages.itinerary.regenerateButton()).toHaveAttribute("variant", "secondary");
    await expect(pages.itinerary.lockDayButton()).toBeVisible();
    await expect(pages.itinerary.lockDayButton()).toHaveText(/Lock day|Unlock day/);
  });
});

test.describe("Itinerary — mobile timeline", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ goto, pages }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
    await expect(pages.itinerary.mobileTimelineBlocks().first()).toBeVisible();
  });

  test("renders the full Saturday timeline below the master pane", async ({ pages }) => {
    expect(await pages.itinerary.mobileTimelineBlocks().count()).toBeGreaterThanOrEqual(5);
  });

  test("the seeded commitment is locked and cannot be unlocked from the block dialog", async ({ pages, page }) => {
    const swim = pages.itinerary.mobileTimelineBlocks().filter({ hasText: "Swim lessons" });
    await expect(swim).toHaveAttribute("locked", "");

    await swim.locator('[role="button"]').click();
    const dialog = page.locator('sd-dialog[title="Swim lessons"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("sd-chip").filter({ hasText: "Locked" })).toBeVisible();
    await expect(dialog.locator("sd-button").filter({ hasText: "Swap for another" }).locator("button")).toBeDisabled();
    await dialog.locator("sd-button").filter({ hasText: /^Close$/ }).locator("button").click();
    await expect(dialog).not.toBeVisible();
  });

  test("an activity block can be locked and unlocked from the block dialog", async ({ pages, page }) => {
    const block = pages.itinerary.mobileTimelineBlocks().locator(":scope:not([locked]):not([tone])").first();
    await expect(block).toBeVisible();
    const title = (await block.getAttribute("title")) ?? "";

    await block.locator('[role="button"]').click();
    let dialog = page.locator(`sd-dialog[title="${title}"]`);
    await expect(dialog).toBeVisible();
    let saved = page.waitForResponse((r) => r.url().includes("/lock") && r.request().method() === "PUT");
    await dialog.locator("sd-button").filter({ hasText: "Lock this block" }).locator("button").click();
    expect((await saved).status()).toBe(200);
    await expect(dialog).not.toBeVisible();
    const locked = pages.itinerary.mobileTimelineBlocks().filter({ hasText: title }).first();
    await expect(locked).toHaveAttribute("locked", "");

    await locked.locator('[role="button"]').click();
    dialog = page.locator(`sd-dialog[title="${title}"]`);
    await expect(dialog).toBeVisible();
    saved = page.waitForResponse((r) => r.url().includes("/lock") && r.request().method() === "PUT");
    await dialog.locator("sd-button").filter({ hasText: /^Unlock$/ }).locator("button").click();
    expect((await saved).status()).toBe(200);
    await expect(pages.itinerary.mobileTimelineBlocks().filter({ hasText: title }).first()).not.toHaveAttribute("locked", "");
  });

  test("'Swap for another' asks the planner for an alternative", async ({ pages, page }) => {
    const block = pages.itinerary.mobileTimelineBlocks().locator(":scope:not([locked]):not([tone])").first();
    const title = (await block.getAttribute("title")) ?? "";
    await block.locator('[role="button"]').click();
    const dialog = page.locator(`sd-dialog[title="${title}"]`);
    await expect(dialog).toBeVisible();

    const swapped = page.waitForResponse((r) => r.url().includes("/swap") && r.request().method() === "POST");
    await dialog.locator("sd-button").filter({ hasText: "Swap for another" }).locator("button").click();
    expect((await swapped).status()).toBe(200);
    await expect(dialog).not.toBeVisible();
    expect(await pages.itinerary.mobileTimelineBlocks().count()).toBeGreaterThanOrEqual(5);
  });
});

test.describe("Itinerary — desktop split", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ goto, pages }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
    await expect(pages.itinerary.desktopTimelineBlocks().first()).toBeVisible();
  });

  test("desktop detail pane shows the same timeline the mobile section renders", async ({ pages }) => {
    const desktop = await pages.itinerary.desktopTimelineBlocks().count();
    expect(desktop).toBeGreaterThanOrEqual(5);
    expect(await pages.itinerary.mobileTimelineBlocks().count()).toBe(desktop);
  });

  test("mobile-timeline section is hidden on desktop", async ({ page }) => {
    await expect(page.locator("#mobile-timeline")).toBeHidden();
  });
});
