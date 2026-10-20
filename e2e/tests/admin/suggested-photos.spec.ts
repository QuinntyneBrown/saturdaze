import { test, expect } from "../../fixtures/sd-test.js";
import { stubPhotoSuggestions, stubUseSuggestedCuratedPhoto, TWO_SUGGESTIONS } from "../../fixtures/photo-suggestions.js";

/**
 * Suggested photos (AD7, L2-159): the administrator asks Claude for photos
 * of the place, picks one, checks the attribution and licence it brought,
 * and saves it as a curated photo.
 */

const PLACE = "Bronte Creek Provincial Park";

test.describe("Admin suggested photos", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
    await pages.adminPlaces.searchInput().fill("bronte");
    await expect(pages.adminPlaces.rows()).toHaveCount(1);
    await pages.adminPlaces.row(PLACE).click();
    await pages.adminPlace.waitForScreen("place");
  });

  test("a picked suggestion fills the details and saves as the primary curated photo", async ({ page, pages }) => {
    // Traces to: L2-159 AC5
    const stub = await stubPhotoSuggestions(page);
    await stubUseSuggestedCuratedPhoto(page, stub);
    const a = pages.adminPlace;
    const before = await a.tiles().count();

    await a.suggestPhotosButton().click();
    await expect(a.dialogTitle()).toHaveText("Suggested photos");
    await expect(a.suggestionQueryInput()).toHaveValue(PLACE);
    await expect(a.dialogAction("Save photo")).toBeDisabled();

    await a.findPhotosButton().click();
    await expect(a.suggestionOptions()).toHaveCount(2);
    expect(stub.searches[0]).toMatchObject({ target: "place", kind: "Activity", query: PLACE });
    await expect(a.dialogAction("Save photo")).toBeDisabled();

    await a.suggestionOption(/Lavender rows/).check();
    await expect(a.dialogField("Alt text")).toHaveValue(TWO_SUGGESTIONS[0].title);
    await expect(a.dialog().getByLabel("Attribution")).toHaveValue(TWO_SUGGESTIONS[0].attribution);
    await expect(a.dialogField("Licence")).toHaveValue("CC BY-SA 4.0");
    await expect(a.suggestionSourceLink()).toHaveAttribute("href", `https://example.org/${TWO_SUGGESTIONS[0].id}`);
    await expect(a.dialogAction("Save photo")).toBeEnabled();

    await a.dialogAction("Save photo").click();
    await expect(a.dialog()).toHaveCount(0);
    expect(stub.uses[0]).toEqual({
      suggestionId: TWO_SUGGESTIONS[0].id,
      alt: TWO_SUGGESTIONS[0].title,
      attribution: TWO_SUGGESTIONS[0].attribution,
      licence: "CC BY-SA 4.0",
    });
    await expect(a.tiles()).toHaveCount(before + 1);
    const tile = a.tile(TWO_SUGGESTIONS[0].title);
    await expect(a.tileBadges(tile)).toContainText(["Primary", "Curated"]);
  });

  test("a licence off the list arrives as Other with its text, and attribution stays required", async ({ page, pages }) => {
    // Traces to: L2-159 AC5
    const stub = await stubPhotoSuggestions(page);
    await stubUseSuggestedCuratedPhoto(page, stub);
    const a = pages.adminPlace;

    await a.suggestPhotosButton().click();
    await a.findPhotosButton().click();
    await a.suggestionOption(/Farm at dusk/).check();
    await expect(a.dialogField("Licence")).toHaveValue("Other");
    await expect(a.dialogField("Licence text")).toHaveValue("Official site");
    await a.fillPhotoDetails({ attribution: "" });
    await expect(a.dialogAction("Save photo")).toBeDisabled();
    await a.fillPhotoDetails({ attribution: "Photo · Terre Bleu" });
    await expect(a.dialogAction("Save photo")).toBeEnabled();
  });

  test("no result says so and Save stays disabled", async ({ page, pages }) => {
    // Traces to: L2-159 AC6
    await stubPhotoSuggestions(page, []);
    const a = pages.adminPlace;

    await a.suggestPhotosButton().click();
    await a.findPhotosButton().click();
    await expect(a.suggestionStatus()).toHaveText("No photos found. Try a different search.");
    await expect(a.suggestionOptions()).toHaveCount(0);
    await expect(a.dialogAction("Save photo")).toBeDisabled();
  });
});
