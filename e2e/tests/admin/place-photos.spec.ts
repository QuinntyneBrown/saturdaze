import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Place photos (A4, L2-114): opened from a Places row, it shows the place's
 * header, the family-app slot previews and the photo tiles. The bundled
 * seed has no photos, so the previews fall back and the grid is the
 * "No photos yet" state; tiles are covered once uploads exist (L2-115).
 */

test.describe("Admin place photos", () => {
  test("opens from the Places list with the header and the empty state", async ({ page, goto, pages }) => {
    // Traces to: L2-114 AC5
    await goto("adminPlaces");
    const list = pages.adminPlaces;
    await list.waitForScreen("places");
    await list.row("Riverwood Conservancy").click();
    await page.waitForURL(/\/places\/Activity\/[0-9a-f-]+$/);

    const a = pages.adminPlace;
    await a.waitForScreen("place");
    await expect(a.pageTitle()).toHaveText("Riverwood Conservancy");
    await expect(a.pageSubtitle()).toHaveText("Activity · 0 photos · No weekend covers follow this place");
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "places");
    await expect(a.emptyTitle()).toHaveText("No photos yet");
    await expect(a.tiles()).toHaveCount(0);
  });

  test("previews show every family-app slot, falling back without a primary", async ({ goto, pages }) => {
    // Traces to: L2-114 AC5
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
    await pages.adminPlaces.row("Riverwood Conservancy").click();
    const a = pages.adminPlace;
    await a.waitForScreen("place");

    await expect(a.preview(/Idea card/)).toBeVisible();
    await expect(a.preview(/Thumbnail/)).toBeVisible();
    await expect(a.preview(/cover/)).toBeVisible();
    await expect(a.previewCard().locator(".media--fallback")).toBeVisible();
    await expect(a.previewCard().locator(".card__title")).toHaveText("Riverwood Conservancy");
    await expect(a.previewCover().locator(".cover__sub")).toHaveText("From Riverwood Conservancy");
    await expect(a.previewCover().locator(".cover__fallback")).toBeVisible();
  });

  test("the back link returns to Places", async ({ page, goto, pages }) => {
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
    await pages.adminPlaces.row("Riverwood Conservancy").click();
    const a = pages.adminPlace;
    await a.waitForScreen("place");
    await a.backLink().click();
    await page.waitForURL("**/places");
  });
});
