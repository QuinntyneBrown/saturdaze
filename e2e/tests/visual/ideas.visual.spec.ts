import { test, expect } from "../../fixtures/sd-test.js";
import { isBaseline } from "../../fixtures/routes.js";
import { apiLogin, lockDinnerPick, SEEDED_USER } from "../../fixtures/auth.js";

/**
 * Ideas parity — pages/ideas.html · ideas.food.html · ideas.events.html.
 *
 * Section membership (weather), meal windows (planner), vote tallies and
 * event dates are runtime data, so no full-page baselines. Fixed chrome
 * (segments, filters, section headers with fixed copy) is compared
 * unmasked; card regions are compared for layout with their runtime text
 * masked. The locked-dinner state is produced through the API in app mode
 * (the mock renders it statically).
 */

test.describe("Visual: Ideas — Activities", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("ideas");
    await pages.ideas.waitForReady();
    await settle();
  });

  test("page header", async ({ pages }) => {
    await expect(pages.ideas.pageHeader).toHaveScreenshot("ideas.header.png", {
      mask: [pages.ideas.pageSubtitle()],
    });
  });

  test("segments with Activities active", async ({ pages }) => {
    await expect(pages.ideas.segments).toHaveScreenshot("ideas.segments.activities.png");
  });

  test("activity filters", async ({ pages }) => {
    await expect(pages.ideas.filters).toHaveScreenshot("ideas.filters.activities.png");
  });

  test("'Try something new' section header", async ({ pages }) => {
    const header = pages.ideas.section("Try something new").locator(".section-header");
    await expect(header).toHaveScreenshot("ideas.section-header.try-new.png");
  });

  test("activity card (Terre Bleu Lavender Farm) with a Map link", async ({ pages }) => {
    const card = pages.ideas.card("Terre Bleu Lavender Farm");
    await expect(card).toHaveScreenshot("ideas.card.activity.png", {
      mask: [card.locator(".card__body")],
    });
  });
});

test.describe("Visual: Ideas — Food", () => {
  test.beforeEach(async ({ goto, pages, settle, request }) => {
    if (!isBaseline()) {
      // Saturday dinner locked → `.card--locked` + `.card--dimmed` siblings,
      // matching the mock's Jack Astor's / Snug Harbour pair.
      await lockDinnerPick(request, await apiLogin(request, SEEDED_USER), "Saturday");
    }
    await goto("ideasFood");
    await pages.ideas.waitForReady();
    await settle();
  });

  test("segments with Food active", async ({ pages }) => {
    await expect(pages.ideas.segments).toHaveScreenshot("ideas.segments.food.png");
  });

  test("food filters (day ‖ slot ‖ extras)", async ({ pages }) => {
    await expect(pages.ideas.filters).toHaveScreenshot("ideas.filters.food.png");
  });

  test("Lunch section header", async ({ pages }) => {
    const section = pages.ideas.lunchSection();
    await expect(section.locator(".section-header")).toHaveScreenshot("ideas.section-header.lunch.png", {
      mask: [pages.ideas.sectionSubtitle(section)],
    });
  });

  test("top-pick food card spans the grid", async ({ pages }) => {
    const i = pages.ideas;
    const card = i.topPickCard(i.lunchSection());
    await expect(card).toHaveScreenshot("ideas.card.food.top-pick.png", {
      mask: [i.cardTitle(card), i.cardMeta(card), i.cardChips(card), i.voteRow(card)],
    });
  });

  test("regular food card", async ({ pages }) => {
    const i = pages.ideas;
    const card = i.regularCards(i.lunchSection()).first();
    await expect(card).toHaveScreenshot("ideas.card.food.regular.png", {
      mask: [i.cardTitle(card), i.cardMeta(card), i.cardChips(card), i.voteRow(card)],
    });
  });

  test("locked dinner card (Locked for dinner chip, See menu only)", async ({ pages }) => {
    const i = pages.ideas;
    const card = i.lockedCard(i.dinnerSection());
    await expect(card).toHaveScreenshot("ideas.card.food.locked.png", {
      mask: [i.cardTitle(card), i.cardMeta(card), i.cardChips(card), i.voteRow(card)],
    });
  });

  test("dimmed sibling of a locked pick (votes and Lock it in disabled)", async ({ pages }) => {
    const i = pages.ideas;
    const card = i.dimmedCards(i.dinnerSection()).first();
    await expect(card).toHaveScreenshot("ideas.card.food.dimmed.png", {
      mask: [i.cardTitle(card), i.cardMeta(card), i.cardChips(card), i.voteRow(card)],
    });
  });
});

test.describe("Visual: Ideas — Events", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("ideasEvents");
    await pages.ideas.waitForReady();
    await settle();
  });

  test("page header with 'Suggest an event'", async ({ pages }) => {
    await expect(pages.ideas.pageHeader).toHaveScreenshot("ideas.events.header.png");
  });

  test("segments with Events active", async ({ pages }) => {
    await expect(pages.ideas.segments).toHaveScreenshot("ideas.segments.events.png");
  });

  test("event filters (window ‖ categories)", async ({ pages }) => {
    await expect(pages.ideas.filters).toHaveScreenshot("ideas.filters.events.png");
  });

  test("'Your suggestion' section with a pending card", async ({ pages }) => {
    const i = pages.ideas;
    const section = i.yourSuggestionSection();
    await expect(section).toHaveScreenshot("ideas.events.your-suggestion.png", {
      mask: [section.locator(".date-tile"), section.locator(".card__meta")],
    });
  });

  test("Saturday section header", async ({ pages }) => {
    const section = pages.ideas.section("Saturday");
    await expect(section.locator(".section-header")).toHaveScreenshot("ideas.events.section-header.sat.png", {
      mask: [pages.ideas.sectionSubtitle(section)],
    });
  });

  test("event card layout with a Details link", async ({ pages }) => {
    const i = pages.ideas;
    const card = i.cardsWithDetails(i.section("Saturday")).first();
    await expect(card).toHaveScreenshot("ideas.card.event.png", {
      mask: [i.dateTile(card), i.cardTitle(card), i.cardMeta(card), i.cardChips(card)],
    });
  });

  test("coming-soon card layout (no footer)", async ({ pages }) => {
    const i = pages.ideas;
    const card = i.cards(i.section("Coming soon")).first();
    await expect(card).toHaveScreenshot("ideas.card.event.coming-soon.png", {
      mask: [i.dateTile(card), i.cardTitle(card), i.cardMeta(card), i.cardChips(card)],
    });
  });
});
