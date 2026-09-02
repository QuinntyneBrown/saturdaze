import { test, expect } from "../fixtures/sd-test.js";
import { ensureCurrentWeekend } from "../fixtures/auth.js";

/**
 * Saved weekends. The seeded family has no history until a weekend is
 * planned, so each test makes sure the current weekend exists first.
 */

test.describe("Saved weekends", () => {
  test.beforeEach(async ({ goto, pages, signIn, request }) => {
    const session = await signIn();
    await ensureCurrentWeekend(request, session!);
    await goto("saved");
    await pages.saved.waitForComponentsReady();
  });

  test("top bar reads 'Saved weekends' and exposes back + more", async ({ pages }) => {
    await expect(pages.saved.topBarTitle()).toHaveText("Saved weekends");
    await expect(pages.saved.topBar.locator('sd-icon-button[icon="arrow_left"], a.back')).toBeVisible();
    await expect(pages.saved.topBar.locator('sd-icon-button[icon="more"]')).toBeVisible();
  });

  test("heading + data-driven lede are present", async ({ pages, page }) => {
    await expect(pages.saved.headingTitle()).toBeVisible();
    await expect(page.locator(".saved-lede p")).toHaveText(/\d+ weekends? planned/);
  });

  test("filter chips render in order and the active one is highlighted", async ({ pages }) => {
    await expect(pages.saved.filterChips()).toHaveCount(4);
    const labels = ["All", "Favourites", "This year", "5★ only"];
    for (let i = 0; i < labels.length; i++) {
      await expect(pages.saved.filterChips().nth(i)).toContainText(labels[i]!);
    }
    await expect(pages.saved.filterChips().nth(0)).toHaveAttribute("tone", "primary");

    await pages.saved.filterChips().nth(2).click();
    await expect(pages.saved.filterChips().nth(2)).toHaveAttribute("tone", "primary");
    await expect(pages.saved.filterChips().nth(2)).toHaveAttribute("aria-pressed", "true");
  });

  test("Recent lists the planned weekend with Remix, Repeat and Rate", async ({ pages }) => {
    const cards = pages.saved.recentSection().locator("sd-saved-card");
    await expect(cards.first()).toBeVisible();
    const card = cards.first();
    await expect(pages.saved.remixButton(card)).toBeVisible();
    await expect(pages.saved.repeatButton(card)).toBeVisible();
    await expect(pages.saved.rateButton(card)).toBeVisible();
  });

  test("heart toggles the favourite flag through the API", async ({ page, pages }) => {
    const card = pages.saved.recentSection().locator("sd-saved-card").first();
    const wasFavourite = (await card.getAttribute("favourite")) !== null;

    const first = page.waitForResponse((r) => r.url().includes("/favourite") && r.request().method() === "PUT");
    await pages.saved.heartButton(card).click();
    expect((await first).status()).toBe(200);
    if (wasFavourite) await expect(card).not.toHaveAttribute("favourite", "");
    else await expect(card).toHaveAttribute("favourite", "");

    // Restore so the run is repeatable.
    const second = page.waitForResponse((r) => r.url().includes("/favourite") && r.request().method() === "PUT");
    await pages.saved.heartButton(card).click();
    expect((await second).status()).toBe(200);
  });

  test("Rate opens the rating dialog and persists five stars; '5★ only' then shows the card", async ({ page, pages }) => {
    const card = pages.saved.recentSection().locator("sd-saved-card").first();
    const title = await card.getAttribute("title");
    await pages.saved.rateButton(card).locator("button").click();

    const dialog = page.locator('sd-dialog[title^="How was"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('button.star[aria-label="5 stars"]').click();

    const rated = page.waitForResponse((r) => r.url().includes("/rating") && r.request().method() === "PUT");
    await dialog.locator("sd-button").filter({ hasText: /^Save$/ }).locator("button").click();
    expect((await rated).status()).toBe(200);
    await expect(dialog).not.toBeVisible();
    await expect(card).toHaveAttribute("rating", "5");

    await pages.saved.filterChips().nth(3).click();
    await expect(pages.saved.savedCard(title ?? "")).toBeVisible();
  });

  test("'Favourites' with nothing favourited shows the filtered empty state", async ({ page, pages }) => {
    await pages.saved.filterChips().nth(1).click();
    const anyFavourite = await pages.saved.favouriteCards().count();
    if (anyFavourite === 0) {
      await expect(page.locator("sd-empty")).toBeVisible();
      await expect(page.locator("sd-empty")).toHaveAttribute("title", "Nothing matches this filter");
    } else {
      await expect(pages.saved.recentSection().locator("sd-saved-card")).toHaveCount(anyFavourite);
    }
  });

  test("bottom nav active=saved", async ({ pages }) => {
    await expect(pages.saved.activeNavKey()).toHaveAttribute("href", /\/saved$/);
  });
});
