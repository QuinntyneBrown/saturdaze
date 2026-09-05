import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Past weekends parity — pages/past.html (+ .empty).
 *
 * History is user data (dates, titles, ratings, highlights), so cards are
 * compared for layout with their text masked; chrome and the empty state
 * are compared verbatim.
 */

test.describe("Visual: Past", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("past");
    await pages.past.waitForReady();
    await settle();
  });

  test("page header", async ({ pages }) => {
    await expect(pages.past.pageHeader).toHaveScreenshot("past.header.png", {
      mask: [pages.past.pageSubtitle()],
    });
  });

  test("history filters", async ({ pages }) => {
    await expect(pages.past.filters).toHaveScreenshot("past.filters.png");
  });

  test("'Skipping next time' strip", async ({ pages }) => {
    await expect(pages.past.strip).toHaveScreenshot("past.strip.png", {
      mask: [pages.past.stripChips()],
    });
  });

  test("past-weekend card layout", async ({ pages }) => {
    const p = pages.past;
    const card = p.cards().first();
    await expect(card).toHaveScreenshot("past.card.png", {
      mask: [p.cardEyebrow(card), p.cardTitle(card), p.starsButton(card), p.highlights(card)],
    });
  });
});

test.describe("Visual: Past — empty", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("pastEmpty");
    await pages.past.waitForReady();
    await settle();
  });

  test("matches the mock @full-page (static copy)", async ({ page }) => {
    await expect(page).toHaveScreenshot("past.empty.full.png", { fullPage: true });
  });

  test("page header", async ({ pages }) => {
    await expect(pages.past.pageHeader).toHaveScreenshot("past.empty.header.png");
  });

  test("empty state", async ({ pages }) => {
    await expect(pages.past.empty).toHaveScreenshot("past.empty.state.png");
  });
});
