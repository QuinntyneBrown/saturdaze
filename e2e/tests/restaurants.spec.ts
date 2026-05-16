import { test, expect } from "../fixtures/sd-test.js";

test.describe("Restaurant picker (Food)", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("restaurants");
    await pages.restaurants.waitForComponentsReady();
  });

  test("top bar reads Food and has back link + refresh button", async ({ pages }) => {
    await expect(pages.restaurants.topBarTitle()).toHaveText("Food");
    await expect(pages.restaurants.topBarBackLink()).toBeVisible();
    await expect(pages.restaurants.refreshButton()).toBeVisible();
  });

  test("renders heading and filter row", async ({ pages }) => {
    await expect(pages.restaurants.headingTitle()).toBeVisible();
    await expect(pages.restaurants.filterChips()).toHaveCount(5);
    await expect(pages.restaurants.filterChips().nth(0)).toContainText("Lunch");
    await expect(pages.restaurants.filterChips().nth(2)).toContainText(
      "Wife-approved only"
    );
  });

  test("top pick is La Marina with wife-approved flag and four vote rows", async ({ pages }) => {
    const card = pages.restaurants.restaurantCard("La Marina");
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("wifeapproved", "");
    await expect(card).toHaveAttribute("drive", "6 min");

    await expect(pages.restaurants.voteRow(card, "Quinn")).toHaveAttribute(
      "vote",
      "up"
    );
    await expect(pages.restaurants.voteRow(card, "Sara")).toHaveAttribute(
      "vote",
      "up"
    );
    await expect(pages.restaurants.voteRow(card, "Eli")).toHaveAttribute(
      "vote",
      "up"
    );
    await expect(pages.restaurants.voteRow(card, "Mae")).toHaveAttribute(
      "vote",
      "none"
    );
  });

  test("top pick exposes See menu (secondary) + Lock it in (primary)", async ({ pages }) => {
    await expect(
      pages.restaurants
        .topPickSection()
        .locator("sd-button")
        .filter({ hasText: "See menu" })
    ).toBeVisible();
    await expect(pages.restaurants.lockItInButton()).toBeVisible();
  });

  test("other-picks section lists two more restaurants", async ({ pages }) => {
    await expect(
      pages.restaurants.otherPicksSection().locator("sd-restaurant-card")
    ).toHaveCount(2);
    await expect(pages.restaurants.restaurantCard("Symposium Café")).toBeVisible();
    await expect(
      pages.restaurants.restaurantCard("The Sicilian Sidewalk Café")
    ).toBeVisible();
  });

  test("Sunday dinner section shows Jack Astor's", async ({ pages }) => {
    await expect(pages.restaurants.restaurantCard("Jack Astor's")).toBeVisible();
  });

  test("Sara votes down on The Sicilian", async ({ pages }) => {
    const card = pages.restaurants.restaurantCard("The Sicilian Sidewalk Café");
    await expect(pages.restaurants.voteRow(card, "Sara")).toHaveAttribute(
      "vote",
      "down"
    );
  });
});
