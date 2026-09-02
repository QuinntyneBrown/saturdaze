import { test, expect } from "../fixtures/sd-test.js";

/**
 * Restaurant picker. Picks, votes and locks are real API state for the
 * seeded family: votes and locks persist between runs, so assertions are
 * data-driven rather than pinned to a particular restaurant.
 */

const SEEDED_MEMBERS = ["Quinn", "Sara", "Eli", "Mae"];

test.describe("Restaurant picker (Food)", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("restaurants");
    await pages.restaurants.waitForComponentsReady();
    await expect(pages.restaurants.topPickSection().locator("sd-restaurant-card").first()).toBeVisible();
  });

  test("top bar reads Food and has back link + refresh button", async ({ pages }) => {
    await expect(pages.restaurants.topBarTitle()).toHaveText("Food");
    await expect(pages.restaurants.topBarBackLink()).toBeVisible();
    await expect(pages.restaurants.refreshButton()).toBeVisible();
  });

  test("renders heading and the four filter chips", async ({ pages }) => {
    await expect(pages.restaurants.headingTitle()).toBeVisible();
    await expect(pages.restaurants.filterChips()).toHaveCount(4);
    const labels = ["Lunch", "Dinner", "Wife-approved only", "< 15 min"];
    for (let i = 0; i < labels.length; i++) {
      await expect(pages.restaurants.filterChips().nth(i)).toContainText(labels[i]!);
    }
    await expect(pages.restaurants.filterChips().nth(0)).toHaveAttribute("tone", "primary");
  });

  test("top pick is a single card with the seeded family as voters", async ({ pages }) => {
    const cards = pages.restaurants.topPickSection().locator("sd-restaurant-card");
    await expect(cards).toHaveCount(1);
    const card = cards.first();
    await expect(card).toHaveAttribute("drive", /^\d+ min$/);
    await expect(card.locator("sd-chip").filter({ hasText: "Top pick" })).toBeVisible();

    await expect(card.locator("sd-vote-row")).toHaveCount(SEEDED_MEMBERS.length);
    for (const name of SEEDED_MEMBERS) {
      await expect(pages.restaurants.voteRow(card, name)).toHaveAttribute("vote", /^(up|down|none)$/);
    }
  });

  test("top pick exposes See menu + Lock it in", async ({ pages }) => {
    const section = pages.restaurants.topPickSection();
    await expect(section.locator("a.menu-link", { hasText: "See menu" })).toBeVisible();
    await expect(section.locator("sd-button").filter({ hasText: /Lock it in|Locked/ })).toBeVisible();
  });

  test("other-picks lists up to three more restaurants and Sunday dinner has a pick", async ({ pages }) => {
    const others = pages.restaurants.otherPicksSection().locator("sd-restaurant-card");
    await expect(others.first()).toBeVisible();
    expect(await others.count()).toBeLessThanOrEqual(3);
    await expect(pages.restaurants.sundayDinnerSection().locator("sd-restaurant-card").first()).toBeVisible();
  });

  test("'Wife-approved only' narrows every card to approved restaurants", async ({ pages }) => {
    await pages.restaurants.filterChips().nth(2).click();
    await expect(pages.restaurants.filterChips().nth(2)).toHaveAttribute("tone", "primary");
    const cards = pages.restaurants.allRestaurantCards();
    const n = await cards.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(cards.nth(i)).toHaveAttribute("wifeapproved", "");
  });

  test("'Dinner' switches the page to Sunday dinner", async ({ pages, page }) => {
    await pages.restaurants.filterChips().nth(1).click();
    await expect(page.locator(".rest-lede h2")).toHaveText("Sunday food");
    await expect(page.locator('sd-section[title="Top pick for dinner"]')).toBeVisible();
  });

  test("a family vote is saved and reflected on the row", async ({ pages, page }) => {
    const card = pages.restaurants.topPickSection().locator("sd-restaurant-card").first();
    const saved = page.waitForResponse((r) => r.url().includes("/vote") && r.status() < 300);
    await pages.restaurants.voteButton(card, "Quinn", "up").click();
    await saved;
    await expect(pages.restaurants.voteRow(card, "Quinn")).toHaveAttribute("vote", "up");
    await expect(page.locator(".rest-lede p")).toHaveText(/Quinn voted on/);
  });

  test("'Lock it in' locks the Saturday lunch pick", async ({ pages, page }) => {
    const button = pages.restaurants.lockItInButton();
    if ((await button.count()) === 0) {
      // Already locked by an earlier run — the state is what we want.
      await expect(pages.restaurants.topPickSection().locator("sd-chip").filter({ hasText: "Locked" })).toBeVisible();
      return;
    }
    await button.locator("button").click();
    const confirm = page.locator("sd-dialog").filter({ hasText: "I'll stop offering alternatives" });
    await expect(confirm).toBeVisible();
    const locked = page.waitForResponse((r) => r.url().includes("/lock") && r.request().method() === "POST");
    await confirm.locator("sd-button").filter({ hasText: "Lock it in" }).locator("button").click();
    expect((await locked).status()).toBeLessThan(300);
    await expect(pages.restaurants.topPickSection().locator("sd-chip").filter({ hasText: "Locked" })).toBeVisible();
    await expect(pages.restaurants.topPickSection()).toHaveAttribute("subtitle", /Locked for Saturday lunch/);
  });
});
