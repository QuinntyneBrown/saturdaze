import { test, expect } from "../fixtures/sd-test.js";

test.describe("Activity suggestions (Discover)", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("activities");
    await pages.activities.waitForComponentsReady();
  });

  test("top bar reads Discover, has back link and 'Try something new' action", async ({ pages }) => {
    await expect(pages.activities.topBarTitle()).toHaveText("Discover");
    await expect(pages.activities.topBarBackLink()).toBeVisible();
    await expect(pages.activities.trySomethingNewButton()).toBeVisible();
  });

  test("renders the 'Picked for the Browns' lede", async ({ pages }) => {
    await expect(pages.activities.headingTitle()).toBeVisible();
  });

  test("filter chips render in the documented order", async ({ pages }) => {
    await expect(pages.activities.filterChips()).toHaveCount(7);
    const labels = [
      "All",
      "Outdoor",
      "Indoor",
      "< 30 min",
      "Ages 5+",
      "New for us",
      "Weather-safe",
    ];
    for (let i = 0; i < labels.length; i++) {
      await expect(pages.activities.filterChips().nth(i)).toContainText(labels[i]);
    }
  });

  test("three suggestion sections appear with the right counts", async ({ pages }) => {
    await expect(
      pages.activities.weatherFitSection().locator("sd-activity-card")
    ).toHaveCount(3);
    await expect(
      pages.activities.ifWeatherTurnsSection().locator("sd-activity-card")
    ).toHaveCount(3);
    await expect(
      pages.activities.trySomethingNewSection().locator("sd-activity-card")
    ).toHaveCount(2);
  });

  test("Terre Bleu card carries the day-highlight tag and rationale", async ({ pages }) => {
    const card = pages.activities.activityCard("Terre Bleu Lavender Farm");
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("tag", "Day highlight");
    await expect(card).toHaveAttribute("drive", "45 min");
    await expect(card).toHaveAttribute(
      "why",
      /Sara loved this last summer/
    );
  });

  test("Rec Room card flags it as Eli's pick", async ({ pages }) => {
    const card = pages.activities.activityCard("The Rec Room — Square One");
    await expect(card).toHaveAttribute("tag", "Eli's pick");
    await expect(card).toHaveAttribute("tone", "indoor");
  });

  test("bottom nav highlights the activities tab", async ({ pages }) => {
    await expect(pages.activities.activeNavKey()).toHaveAttribute(
      "href",
      /activities\.html$/
    );
  });
});
