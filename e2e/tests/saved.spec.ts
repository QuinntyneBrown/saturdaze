import { test, expect } from "../fixtures/sd-test.js";

test.describe("Saved weekends", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("saved");
    await pages.saved.waitForComponentsReady();
  });

  test("top bar reads 'Saved weekends' and exposes back + more", async ({ pages }) => {
    await expect(pages.saved.topBarTitle()).toHaveText("Saved weekends");
    await expect(
      pages.saved.topBar.locator('sd-icon-button[icon="arrow_left"]')
    ).toBeVisible();
    await expect(
      pages.saved.topBar.locator('sd-icon-button[icon="more"]')
    ).toBeVisible();
  });

  test("heading + lede are present", async ({ pages, page }) => {
    await expect(pages.saved.headingTitle()).toBeVisible();
    await expect(page.getByText(/12 weekends planned/)).toBeVisible();
  });

  test("filter chips render in order", async ({ pages }) => {
    await expect(pages.saved.filterChips()).toHaveCount(4);
    await expect(pages.saved.filterChips().nth(0)).toContainText("All");
    await expect(pages.saved.filterChips().nth(1)).toContainText("Favourites");
    await expect(pages.saved.filterChips().nth(2)).toContainText("This year");
    await expect(pages.saved.filterChips().nth(3)).toContainText("5★ only");
  });

  test("Recent section shows three saved-weekend cards", async ({ pages }) => {
    await expect(
      pages.saved.recentSection().locator("sd-saved-card")
    ).toHaveCount(3);
  });

  test("first card is favourite and rated 5", async ({ pages }) => {
    const card = pages.saved.savedCard("Bronte Creek + Rec Room");
    await expect(card).toHaveAttribute("favourite", "");
    await expect(card).toHaveAttribute("rating", "5");
  });

  test("each saved card has Remix + Repeat buttons", async ({ pages }) => {
    const card = pages.saved.savedCard("Bronte Creek + Rec Room");
    await expect(pages.saved.remixButton(card)).toBeVisible();
    await expect(pages.saved.repeatButton(card)).toBeVisible();
  });

  test("avoid-repeating section lists Rec Room with a warn chip", async ({ pages }) => {
    const item = pages.saved
      .avoidSection()
      .locator('sd-list-item[title="Rec Room — Square One"]');
    await expect(item).toBeVisible();
    await expect(item.locator('sd-chip[tone="warn"]')).toContainText("Skip");
  });

  test("bottom nav active=saved", async ({ pages }) => {
    await expect(pages.saved.activeNavKey()).toHaveAttribute(
      "href",
      /saved\.html$/
    );
  });
});
