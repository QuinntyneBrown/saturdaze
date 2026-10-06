import { test, expect } from "../fixtures/sd-test.js";

/**
 * Add an idea to a day — D27 (L2-107). The preview comes from the API's
 * placement for the seeded family's weekend; confirming changes that weekend.
 */

test.describe("Ideas — Add to day", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("ideas");
    await pages.ideas.waitForReady();
  });

  test("opens D27 for the idea with Saturday and Best fit chosen", async ({ pages }) => {
    // Traces to: L2-107 AC1, AC6
    const i = pages.ideas;
    const card = i.cards().first();
    const title = (await i.cardTitle(card).textContent())!.trim();
    await expect(i.addToDayButton(card)).toHaveAccessibleName(`Add to day: ${title}`);

    await i.addToDayButton(card).click();
    await expect(i.dialogTitle()).toHaveText(`Add ${title}`);
    await expect(i.dialog().locator(":focus")).toHaveCount(1);
    await expect(i.addToDayDayOption("Saturday")).toBeChecked();
    await expect(i.addToDayTiming()).toHaveValue("bestFit");
  });

  test("previews where the idea lands before confirming", async ({ pages }) => {
    // Traces to: L2-107 AC2
    const i = pages.ideas;
    await i.addToDayButton(i.cards().first()).click();
    await expect(i.addToDayPreviewTitle()).toHaveText(/^Saturday · \d{1,2}:\d{2} to \d{1,2}:\d{2}$/);

    await i.addToDayDayOption("Sunday").check();
    await expect(i.addToDayPreviewTitle()).toHaveText(/^Sunday · \d{1,2}:\d{2} to \d{1,2}:\d{2}$/);
    await expect(i.addToDayConfirm()).toHaveText(/Add to Sunday/);
  });

  test("confirming puts it on the weekend at the previewed time", async ({ goto, pages }) => {
    // Traces to: L2-107 AC3
    const i = pages.ideas;
    const card = i.cards().first();
    const title = (await i.cardTitle(card).textContent())!.trim();
    await i.addToDayButton(card).click();
    await i.addToDayDayOption("Sunday").check();
    await expect(i.addToDayPreviewTitle()).toHaveText(/^Sunday · /);
    const preview = (await i.addToDayPreviewTitle().textContent())!.trim();
    const start = /· (\d{1,2}:\d{2}) to/.exec(preview)![1];

    await i.addToDayConfirm().click();
    await expect(i.dialog()).toHaveCount(0);

    await goto("weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    await w.selectDay("Sunday");
    await expect(w.blockAt(title, "Sunday", start)).toHaveCount(1);
  });

  test("a day without room says so and cannot be confirmed", async ({ page, pages }) => {
    // Traces to: L2-107 AC4
    await page.route(/\/ideas\/preview$/, (route) =>
      route.fulfill({
        json: {
          day: "Saturday",
          startTime: "00:00:00",
          endTime: "00:00:00",
          replacedBlockTitles: [],
          fits: false,
          reason: "No slot is long enough without moving locked blocks or commitments.",
        },
      }),
    );
    const i = pages.ideas;
    await i.addToDayButton(i.cards().first()).click();
    await expect(i.addToDayPreview()).toContainText("No slot is long enough");
    await expect(i.addToDayConfirm()).toBeDisabled();
  });
});

test.describe("Ideas — Add to day on events", () => {
  test("this weekend's events offer Add to day; later ones and suggestions do not", async ({ goto, pages }) => {
    // Traces to: L2-107
    await goto("ideasEvents");
    const i = pages.ideas;
    await i.waitForReady();
    for (const title of ["Saturday", "Sunday"]) {
      for (const card of await i.cards(i.eventSection(title)).all()) {
        await expect(i.addToDayButton(card)).toBeVisible();
      }
    }
    for (const card of await i.cards(i.eventSection("Coming soon")).all()) {
      await expect(i.addToDayButton(card)).toHaveCount(0);
    }
  });
});
