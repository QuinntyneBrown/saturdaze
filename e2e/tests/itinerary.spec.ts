import { test, expect } from "../fixtures/sd-test.js";

test.describe("Itinerary detail", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
  });

  test("top bar shows the day name with a back link and trailing controls", async ({ pages }) => {
    await expect(pages.itinerary.topBarTitle()).toHaveText("Saturday");
    await expect(pages.itinerary.topBarBackLink()).toBeVisible();
    await expect(
      pages.itinerary.topBar.locator('sd-icon-button[icon="refresh"]')
    ).toBeVisible();
    await expect(
      pages.itinerary.topBar.locator('sd-icon-button[icon="more"]')
    ).toBeVisible();
  });

  test("header presents date eyebrow, weather title, sub-line, and sun icon", async ({ pages }) => {
    await expect(pages.itinerary.eyebrow()).toHaveText(/17 May 2026/);
    await expect(pages.itinerary.title()).toHaveText(/Sunny & 22°/);
    await expect(pages.itinerary.subtitle()).toHaveText(
      /In bed by 9pm — out the door by 9am/
    );
    await expect(pages.itinerary.sunIcon()).toBeVisible();
  });

  test("header tag group renders the four summary chips", async ({ pages }) => {
    await expect(pages.itinerary.headerChips()).toHaveCount(4);
    await expect(pages.itinerary.headerChips().nth(0)).toContainText(/3 locked/);
    await expect(pages.itinerary.headerChips().nth(1)).toContainText(/1h 10m driving/);
    await expect(pages.itinerary.headerChips().nth(2)).toContainText(/Outdoor/);
    await expect(pages.itinerary.headerChips().nth(3)).toContainText(/22° hi/);
  });

  test("day switcher marks Saturday active and shows Sunday as option", async ({ pages }) => {
    await expect(pages.itinerary.activeDayOption()).toContainText("Saturday");
    await expect(pages.itinerary.dayOption("Sunday")).toBeVisible();
  });

  test("weekend totals show the four stat tiles", async ({ pages }) => {
    await expect(pages.itinerary.weekendStats().locator(".stat")).toHaveCount(4);
    await expect(pages.itinerary.stat("blocks planned")).toContainText("10");
    await expect(pages.itinerary.stat("total driving")).toContainText("2h 5m");
    await expect(pages.itinerary.stat("locked anchors")).toContainText("4");
    await expect(pages.itinerary.stat("est. spend")).toContainText("$~120");
  });

  test("footer exposes Regenerate (secondary) + Lock day (primary) actions", async ({ pages }) => {
    await expect(pages.itinerary.regenerateButton()).toBeVisible();
    await expect(pages.itinerary.regenerateButton()).toHaveAttribute(
      "variant",
      "secondary"
    );
    await expect(pages.itinerary.lockDayButton()).toBeVisible();
  });
});

test.describe("Itinerary — mobile timeline", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ goto, pages }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
  });

  test("renders the full ten-block timeline below the master pane", async ({ pages }) => {
    await expect(pages.itinerary.mobileTimelineBlocks()).toHaveCount(10);
  });

  test("locked blocks carry the locked attribute and a recurring chip where applicable", async ({ pages }) => {
    const lockedSwim = pages.itinerary.mobileTimelineBlocks().filter({
      hasText: "Swim lessons",
    });
    await expect(lockedSwim).toHaveAttribute("locked", "");
    await expect(lockedSwim.locator("sd-chip")).toContainText(/Recurring/);
  });
});

test.describe("Itinerary — desktop split", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ goto, pages }) => {
    await goto("itinerary");
    await pages.itinerary.waitForComponentsReady();
  });

  test("desktop detail pane shows the full ten-block timeline", async ({ pages }) => {
    await expect(pages.itinerary.desktopTimelineBlocks()).toHaveCount(10);
  });

  test("mobile-timeline section is hidden on desktop", async ({ page }) => {
    await expect(page.locator("#mobile-timeline")).toBeHidden();
  });
});
