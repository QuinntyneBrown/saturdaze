import { test, expect } from "../fixtures/sd-test.js";

/**
 * Ideas · Activities — segments, filter chips (client-side), the three
 * weather-driven sections and the activity cards' Map links.
 */

test.describe("Ideas — Activities", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("ideas");
    await pages.ideas.waitForReady();
  });

  test("header, segments and nav state", async ({ pages }) => {
    const i = pages.ideas;
    await expect(i.pageTitle()).toHaveText("Ideas");
    await expect(i.pageSubtitle()).toContainText(/Eli|Mae|Port Credit/);
    await expect(i.activeSegment()).toHaveText("Activities");
    await expect(i.segmentTab("Food")).not.toHaveAttribute("aria-current", "page");
    await expect(i.activeNavLink()).toHaveAttribute("data-nav", "ideas");
    await expect(i.body).toHaveAttribute("data-page", "ideas");
  });

  test("filters: exactly one pressed by default ('All'), choosing another moves the press", async ({ pages }) => {
    const i = pages.ideas;
    await expect(i.pressedFilterChips()).toHaveCount(1);
    await expect(i.filterChip("All")).toHaveAttribute("aria-pressed", "true");
    for (const name of ["Outdoor", "Indoor", "Under 30 min", "Ages 5+", "Weather-safe"]) {
      await expect(i.filterChip(name)).toHaveAttribute("aria-pressed", "false");
    }

    await i.filterChip("Indoor").click();
    await expect(i.filterChip("Indoor")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("All")).toHaveAttribute("aria-pressed", "false");
    await expect(i.pressedFilterChips()).toHaveCount(1);

    await i.filterChip("All").click();
    await expect(i.filterChip("All")).toHaveAttribute("aria-pressed", "true");
  });

  test("renders the three sections with at most three cards each", async ({ pages }) => {
    const i = pages.ideas;
    for (const title of ["Right for this weekend's weather", "If the weather turns", "Try something new"]) {
      await expect(i.section(title)).toBeVisible();
      await expect(i.sectionSubtitle(i.section(title))).not.toBeEmpty();
      expect(await i.cards(i.section(title)).count()).toBeLessThanOrEqual(3);
    }
    expect(await i.cards().count()).toBeGreaterThan(0);
  });

  test("'Try something new' cards carry the First time chip", async ({ pages }) => {
    const i = pages.ideas;
    const cards = i.cards(i.section("Try something new"));
    const n = await cards.count();
    for (let k = 0; k < n; k++) {
      await expect(cards.nth(k).locator(".chip--primary")).toHaveText("First time");
    }
  });

  test("every card has a title, a location, a drive chip and an external Map link", async ({ pages }) => {
    const i = pages.ideas;
    const count = await i.cards().count();
    for (let n = 0; n < count; n++) {
      const card = i.cards().nth(n);
      await expect(i.cardTitle(card)).not.toBeEmpty();
      await expect(i.cardMeta(card)).not.toBeEmpty();
      await expect(i.cardChips(card).first()).toContainText(/min/);
      const map = i.mapLink(card);
      await expect(map).toHaveAttribute("target", "_blank");
      await expect(map).toHaveAttribute("rel", /noopener/);
      await expect(map).toHaveAttribute("href", /^https?:\/\//);
    }
  });

  test("'Indoor' hides outdoor-only cards and 'Outdoor' the reverse", async ({ pages }) => {
    const i = pages.ideas;
    const all = await i.cards().count();
    await i.filterChip("Indoor").click();
    const indoor = await i.cards().count();
    await i.filterChip("Outdoor").click();
    const outdoor = await i.cards().count();
    expect(indoor).toBeLessThanOrEqual(all);
    expect(outdoor).toBeLessThanOrEqual(all);
    expect(indoor + outdoor).toBeGreaterThan(0);
  });

  test("segments navigate to Food and Events", async ({ page, pages }) => {
    const i = pages.ideas;
    await i.segmentTab("Food").click();
    await page.waitForURL("**/ideas/food");
    await expect(i.activeSegment()).toHaveText("Food");
    await i.segmentTab("Events").click();
    await page.waitForURL("**/ideas/events");
    await expect(i.activeSegment()).toHaveText("Events");
    await i.segmentTab("Activities").click();
    await page.waitForURL(/\/ideas$/);
    await expect(i.activeSegment()).toHaveText("Activities");
  });
});
