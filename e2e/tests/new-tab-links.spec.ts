import { test, expect } from "../fixtures/sd-test.js";

/**
 * Links that open a new tab say so (L2-133, drift D31; WCAG 2.4.4, 3.2.5
 * advisory). Each one's accessible name ends with "(opens in a new tab)";
 * address and Details links also show the external icon instead of the
 * right arrow, which reads as "go to".
 */

const NEW_TAB = "(opens in a new tab)";

test.describe("Links that open a new tab say so", () => {
  test("Given the activity ideas, when a person reaches a card's Map link, then it says it opens a new tab", async ({
    goto,
    pages,
  }) => {
    const i = pages.ideas;
    await goto("ideas");
    await i.waitForReady();
    await expect(i.mapLink(i.cards().first())).toHaveAccessibleName(`Map ${NEW_TAB}`);
  });

  test("Given the food ideas, when a person reaches a card's See menu link, then it says it opens a new tab", async ({
    goto,
    pages,
  }) => {
    const i = pages.ideas;
    await goto("ideasFood");
    await i.waitForReady();
    await expect(i.seeMenuLink(i.cards(i.lunchSection()).first())).toHaveAccessibleName(
      `See menu ${NEW_TAB}`,
    );
  });

  test("Given the event ideas, when a person reaches a card's Details link, then it says it opens a new tab and shows the external icon", async ({
    goto,
    pages,
  }) => {
    const i = pages.ideas;
    await goto("ideasEvents");
    await i.waitForReady();
    const link = i.detailsLink(i.cardsWithDetails().first());
    await expect(link).toHaveAccessibleName(`Details ${NEW_TAB}`);
    await expect(i.externalIcon(link)).toBeVisible();
  });

  test("Given the weekend plan, when a person reaches a leg's Directions link, then it says it opens a new tab", async ({
    goto,
    pages,
  }) => {
    const w = pages.weekend;
    await goto("weekend");
    await w.waitForPlan();
    await expect(w.directionsLinks().first()).toHaveAccessibleName(`Directions ${NEW_TAB}`);
  });

  test("Given the review queue, when an admin reaches a submission's link, then it says it opens a new tab and shows the external icon", async ({
    goto,
    pages,
  }) => {
    const r = pages.reviewSubmissions;
    await goto("reviewSubmissions");
    await r.waitForReady();
    const link = r.submittedLink(r.cards().first());
    await expect(link).toHaveAccessibleName(/^\S+ \(opens in a new tab\)$/);
    await expect(r.externalIcon(link)).toBeVisible();
  });
});
