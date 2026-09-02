import { test, expect } from "../fixtures/sd-test.js";

/**
 * Home / This Weekend against the seeded Brown family. Weather comes from
 * Open-Meteo, so forecast assertions accept "—" when the API is offline.
 */

test.describe("Home / This Weekend", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("home");
    await pages.home.waitForComponentsReady();
    await expect(pages.home.hero).not.toHaveAttribute("subtitle", /Pulling the latest plan/);
  });

  test("renders the top bar with calendar + share controls", async ({ pages }) => {
    await expect(pages.home.topBar).toBeVisible();
    await expect(pages.home.topBarCalendarButton()).toBeVisible();
    await expect(pages.home.topBarShareButton()).toBeVisible();
  });

  test("renders the hero greeting from the family name, a weather subtitle, and the CTA", async ({ pages }) => {
    const hero = pages.home.hero;
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute("greeting", /Morning, Browns/);
    await expect(hero).toHaveAttribute("subtitle", /Sat & Sun|Saturday|Mixed weather/);
    await expect(hero).toHaveAttribute("cta", /Plan This Weekend|Regenerate weekend/);
  });

  test("renders the forecast strip with Saturday and Sunday", async ({ pages }) => {
    await expect(pages.home.forecastSection()).toBeVisible();
    await expect(pages.home.weatherStrip()).toBeVisible();
    for (const day of ["Saturday", "Sunday"] as const) {
      await expect(pages.home.weatherDay(day)).toBeVisible();
      await expect(pages.home.weatherDay(day)).toHaveAttribute("hi", /^(-?\d+|—)$/);
      await expect(pages.home.weatherDay(day)).toHaveAttribute("icon", /.+/);
    }
  });

  test("renders the two day cards with a highlight and an itinerary link", async ({ pages }) => {
    for (const day of ["Saturday", "Sunday"] as const) {
      const card = pages.home.dayCard(day);
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute("highlight", /.+/);
      await expect(card).toHaveAttribute("href", `/itinerary?day=${day.toLowerCase()}`);
    }
  });

  test("day cards carry data-driven chips: the first locked block, driving, and the weather call", async ({ pages }) => {
    const sat = pages.home.dayCard("Saturday").locator("sd-chip");
    await expect(sat).toHaveCount(3);
    await expect(sat.first()).toContainText(/swim lessons/i); // 09:00 commitment, always locked
    await expect(sat.last()).toContainText(/Outdoor day|Indoor day/);

    const sun = pages.home.dayCard("Sunday").locator("sd-chip");
    await expect(sun.first()).toContainText(/church/i);
  });

  test("shows at least one heads-up derived from the plan", async ({ pages }) => {
    await expect(pages.home.anticipateCallouts().first()).toBeVisible();
    const count = await pages.home.anticipateCallouts().count();
    for (let i = 0; i < count; i++) {
      await expect(pages.home.anticipateCallouts().nth(i)).toHaveAttribute("headline", /.+/);
    }
  });

  test("exposes three quick-action rows", async ({ pages }) => {
    await expect(pages.home.quickAction("Regenerate the weekend")).toBeVisible();
    await expect(pages.home.quickAction("Lock what's already perfect")).toBeVisible();
    await expect(pages.home.quickAction("Share this weekend")).toBeVisible();
  });

  test("'Lock what's already perfect' enters lock mode with commitments pinned", async ({ page, pages }) => {
    await pages.home.quickAction("Lock what's already perfect").click();
    await expect(pages.home.topBarTitle()).toHaveText("Lock what's perfect");

    const commitment = page.locator("button.lock-block").filter({ hasText: "Swim lessons" });
    await expect(commitment).toBeDisabled();
    await expect(commitment).toHaveAttribute("aria-pressed", "true");

    await page.locator(".lock-footer sd-button").filter({ hasText: "Done" }).locator("button").click();
    await expect(pages.home.hero).toBeVisible();
  });

  test("tapping a day card navigates to that day's itinerary", async ({ page, pages }) => {
    await pages.home.dayCard("Saturday").click();
    await page.waitForURL(/\/itinerary\?day=saturday/);
  });

  test("bottom nav marks 'home' as active", async ({ pages }) => {
    await expect(pages.home.bottomNav).toBeVisible();
    await expect(pages.home.activeNavKey()).toHaveCount(1);
    await expect(pages.home.activeNavKey()).toHaveAttribute("href", /\/weekend$/);
  });
});

test.describe("Home — desktop split view", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ goto, pages }) => {
    await goto("home");
    await pages.home.waitForComponentsReady();
    await expect(pages.home.hero).not.toHaveAttribute("subtitle", /Pulling the latest plan/);
  });

  test("shows the live-preview detail pane with the first five Saturday blocks", async ({ pages }) => {
    await expect(pages.home.detailPane()).toBeVisible();
    await expect(pages.home.detailTimelineBlocks()).toHaveCount(5);
  });

  test("tapping a preview block opens the block-action dialog", async ({ page, pages }) => {
    const block = pages.home.detailTimelineBlocks().first();
    const title = await block.getAttribute("title");
    await block.locator('[role="button"]').click();

    const dialog = page.locator("sd-dialog").filter({ has: page.locator("h2", { hasText: title ?? "" }) });
    await expect(dialog).toBeVisible();
    await dialog.locator("sd-button").filter({ hasText: /^Close$/ }).locator("button").click();
    await expect(dialog).not.toBeVisible();
  });
});
