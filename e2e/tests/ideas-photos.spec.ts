import { test, expect } from "../fixtures/sd-test.js";
import { photoAlt, photoCredit, stubPlacePhotos } from "../fixtures/place-photos.js";

/**
 * Photo-led idea cards (L2-106, L2-101). Catalog responses are rewritten so
 * places cycle through: a loading photo, no photo, and a photo that 404s.
 */

const EXPECTED_COLUMNS: Record<string, number> = { mobile: 1, tablet: 2, desktop: 3 };

test.describe("Ideas — photo-led activity cards", () => {
  test.beforeEach(async ({ page, goto, pages }) => {
    await stubPlacePhotos(page, "activities");
    await goto("ideas");
    await pages.ideas.waitForReady();
  });

  test("a place with a photo leads its card with the image and its attribution", async ({ pages }) => {
    // Traces to: L2-106 AC1
    const i = pages.ideas;
    const card = i.cardsWithPhoto().first();
    const title = (await i.cardTitle(card).textContent())!.trim();

    await expect(i.cardImage(card)).toHaveAttribute("alt", photoAlt(title));
    await expect(i.cardCredit(card)).toBeVisible();
    await expect(i.cardCredit(card)).toHaveText(photoCredit(title));
  });

  test("a place without a usable photo shows an aria-hidden tile as tall as the photos", async ({ pages }) => {
    // Traces to: L2-106 AC3, L2-101 AC5 (the 404 photo falls back too)
    const i = pages.ideas;
    const fallbacks = i.cardsWithFallback();
    await expect(fallbacks.first()).toBeVisible();
    expect(await fallbacks.count()).toBeGreaterThanOrEqual(2);

    const tile = i.cardMedia(fallbacks.first());
    await expect(tile).toHaveAttribute("aria-hidden", "true");
    await expect(i.cardImage(fallbacks.first())).toHaveCount(0);

    const photoBox = await i.cardMedia(i.cardsWithPhoto().first()).boundingBox();
    const tileBox = await tile.boundingBox();
    expect(Math.abs(photoBox!.height - tileBox!.height)).toBeLessThanOrEqual(1);
  });

  test("photos keep 16:9 and the grid has the right column count", async ({ pages }, testInfo) => {
    // Traces to: L2-106 AC2
    const i = pages.ideas;
    expect(await i.gridColumnCount()).toBe(EXPECTED_COLUMNS[testInfo.project.name]);

    const box = await i.cardMedia(i.cardsWithPhoto().first()).boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
  });

  test("card images are lazy-loaded with explicit dimensions", async ({ pages }) => {
    // Traces to: L2-101 AC1, AC2
    const images = pages.ideas.cardImages();
    await expect(images.first()).toBeVisible();
    for (const img of await images.all()) {
      await expect(img).toHaveAttribute("loading", "lazy");
      await expect(img).toHaveAttribute("width", /\d+/);
      await expect(img).toHaveAttribute("height", /\d+/);
    }
  });
});

test.describe("Ideas — photo-led food and event cards", () => {
  test("restaurant cards lead with a photo or the fallback tile", async ({ page, goto, pages }) => {
    // Traces to: L2-106
    await stubPlacePhotos(page, "restaurants", ["photo", "none"]);
    await goto("ideasFood");
    await pages.ideas.waitForReady();

    await expect(pages.ideas.cardsWithPhoto().first()).toBeVisible();
    await expect(pages.ideas.cardsWithFallback().first()).toBeVisible();
    expect(await pages.ideas.mediaCards().count()).toBe(await pages.ideas.cards().count());
  });

  test("event cards lead with a photo or the fallback tile", async ({ page, goto, pages }) => {
    // Traces to: L2-106
    await stubPlacePhotos(page, "events", ["photo", "none"]);
    await goto("ideasEvents");
    await pages.ideas.waitForReady();

    await expect(pages.ideas.cardsWithPhoto().first()).toBeVisible();
    await expect(pages.ideas.cardsWithFallback().first()).toBeVisible();
  });
});
