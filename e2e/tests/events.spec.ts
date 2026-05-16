import { test, expect } from "../fixtures/sd-test.js";

test.describe("Local events feed", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("events");
    await pages.events.waitForComponentsReady();
  });

  test("top bar reads 'Local events' with back link", async ({ pages }) => {
    await expect(pages.events.topBarTitle()).toHaveText("Local events");
    await expect(pages.events.topBarBackLink()).toBeVisible();
  });

  test("heading + filter chips render", async ({ pages }) => {
    await expect(pages.events.headingTitle()).toBeVisible();
    await expect(pages.events.filterChips()).toHaveCount(7);
    await expect(pages.events.filterChips().nth(0)).toContainText(
      "This weekend"
    );
  });

  test("Saturday section lists three events", async ({ pages }) => {
    await expect(
      pages.events.saturdaySection().locator("sd-event-card")
    ).toHaveCount(3);
    await expect(
      pages.events.eventCard("Terre Bleu — Lavender Bloom Opening")
    ).toHaveAttribute("tag", "Seasonal");
  });

  test("Sunday section lists two events", async ({ pages }) => {
    await expect(
      pages.events.sundaySection().locator("sd-event-card")
    ).toHaveCount(2);
  });

  test("Coming soon shows two future events", async ({ pages }) => {
    await expect(
      pages.events.comingSoonSection().locator("sd-event-card")
    ).toHaveCount(2);
    await expect(
      pages.events.eventCard("Pumpkin patch — early access")
    ).toHaveAttribute("date-mon", "SEP");
  });

  test("event cards expose date pill via date-day / date-mon attributes", async ({ pages }) => {
    const card = pages.events.eventCard(
      "Terre Bleu — Lavender Bloom Opening"
    );
    await expect(card).toHaveAttribute("date-day", "17");
    await expect(card).toHaveAttribute("date-mon", "MAY");
    await expect(card).toHaveAttribute("drive", "45 min");
  });
});
