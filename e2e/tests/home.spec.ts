import { test, expect } from "../fixtures/sd-test.js";

test.describe("Home / This Weekend", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("home");
    await pages.home.waitForComponentsReady();
  });

  test("renders the top bar with calendar + share controls", async ({ pages }) => {
    await expect(pages.home.topBar).toBeVisible();
    await expect(pages.home.topBarCalendarButton()).toBeVisible();
    await expect(pages.home.topBarShareButton()).toBeVisible();
  });

  test("renders the hero greeting, subtitle, and primary CTA", async ({ pages }) => {
    const hero = pages.home.hero;
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute("greeting", /Morning, Browns/i);
    await expect(hero).toHaveAttribute(
      "subtitle",
      /Sat & Sun are looking warm/i
    );
    await expect(hero).toHaveAttribute("cta", /Plan This Weekend/);
  });

  test("renders the forecast strip with Saturday and Sunday", async ({ pages }) => {
    await expect(pages.home.forecastSection()).toBeVisible();
    await expect(pages.home.weatherStrip()).toBeVisible();
    await expect(pages.home.weatherDay("Saturday")).toHaveAttribute("hi", "22");
    await expect(pages.home.weatherDay("Saturday")).toHaveAttribute("icon", "sun");
    await expect(pages.home.weatherDay("Sunday")).toHaveAttribute("hi", "18");
    await expect(pages.home.weatherDay("Sunday")).toHaveAttribute("icon", "cloud");
  });

  test("renders the two day cards with the right highlights", async ({ pages }) => {
    await expect(pages.home.dayCard("Saturday")).toBeVisible();
    await expect(pages.home.dayCard("Saturday")).toHaveAttribute(
      "highlight",
      /Lavender fields at Terre Bleu/
    );
    await expect(pages.home.dayCard("Sunday")).toBeVisible();
    await expect(pages.home.dayCard("Sunday")).toHaveAttribute(
      "highlight",
      /Rec Room/
    );
  });

  test("each day card carries its trio of chips", async ({ pages }) => {
    await expect(pages.home.dayCard("Saturday").locator("sd-chip")).toHaveCount(3);
    await expect(pages.home.dayCard("Sunday").locator("sd-chip")).toHaveCount(3);
  });

  test("renders both anticipated heads-up callouts", async ({ pages }) => {
    await expect(pages.home.anticipateCallouts()).toHaveCount(2);
    await expect(pages.home.anticipateCallouts().nth(0)).toHaveAttribute(
      "headline",
      /Lavender bloom peaks/
    );
    await expect(pages.home.anticipateCallouts().nth(1)).toHaveAttribute(
      "headline",
      /Sara mentioned a Costco run/
    );
  });

  test("exposes three quick-action rows", async ({ pages }) => {
    await expect(pages.home.quickAction("Regenerate the weekend")).toBeVisible();
    await expect(pages.home.quickAction("Lock what's already perfect")).toBeVisible();
    await expect(pages.home.quickAction("Share with Sara for approval")).toBeVisible();
  });

  test("tapping a day card navigates to the itinerary", async ({ page, pages }) => {
    await pages.home.dayCard("Saturday").click();
    await page.waitForURL(/\/itinerary/);
  });

  test("bottom nav marks 'home' as active and exposes 4 destinations", async ({ pages }) => {
    await expect(pages.home.bottomNav).toBeVisible();
    await expect(pages.home.activeNavKey()).toHaveCount(1);
    await expect(pages.home.activeNavKey()).toHaveAttribute("href", /home\.html$/);
  });
});

test.describe("Home — desktop split view", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ goto, pages }) => {
    await goto("home");
    await pages.home.waitForComponentsReady();
  });

  test("shows the live-preview detail pane with five timeline blocks", async ({ pages }) => {
    await expect(pages.home.detailPane()).toBeVisible();
    await expect(pages.home.detailTimelineBlocks()).toHaveCount(5);
  });
});
