import { test, expect } from "../../fixtures/sd-test.js";
import { FAMILY_PHOTO } from "../../fixtures/weekend-cover.js";

/**
 * Photo actions on a place (A4): upload a curated photo (AD1, L2-115), make
 * another one primary (AD4, L2-117) and edit its details (AD3, L2-118).
 * Each test uploads what it needs, so the place accumulates photos across
 * runs and every assertion is relative to what was there before.
 */

const PLACE = "Bronte Creek Provincial Park";

test.describe("Admin place photo actions", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
    await pages.adminPlaces.searchInput().fill("bronte");
    await expect(pages.adminPlaces.rows()).toHaveCount(1);
    await pages.adminPlaces.row(PLACE).click();
    await pages.adminPlace.waitForScreen("place");
  });

  test("uploads a curated photo that becomes a reviewed tile and fills the previews", async ({ page, pages }) => {
    // Traces to: L2-115 AC1, AC4
    const a = pages.adminPlace;
    const before = await a.tiles().count();
    const alt = `Creek bend ${Date.now().toString(36)}`;

    await a.uploadButton().click();
    await expect(a.dialogTitle()).toHaveText("Upload a photo");
    await expect(a.dialogAction("Save photo")).toBeDisabled();
    await a.uploadFileInput().setInputFiles(FAMILY_PHOTO);
    await a.fillPhotoDetails({ alt, attribution: "", licence: "CC BY 4.0" });
    await expect(a.dialogAction("Save photo")).toBeDisabled();
    await a.fillPhotoDetails({ attribution: "Photo · Saturdaze" });
    await expect(a.dialogAction("Save photo")).toBeEnabled();

    const created = page.waitForResponse((r) => /\/api\/admin\/places\/Activity\/[^/]+\/photos$/.test(r.url()) && r.request().method() === "POST");
    await a.dialogAction("Save photo").click();
    expect((await created).status()).toBe(201);
    await expect(a.dialog()).toHaveCount(0);

    await expect(a.tiles()).toHaveCount(before + 1);
    const tile = a.tile(alt);
    await expect(a.tileBadges(tile)).toContainText(["Curated", "Reviewed"]);
    await expect(a.tileDetail(tile, "Alt text")).toHaveText(alt);
    await expect(a.tileDetail(tile, "Credit")).toHaveText("Photo · Saturdaze");
    await expect(a.tileDetail(tile, "Licence")).toHaveText("CC BY 4.0");
    await expect(a.pageSubtitle()).toContainText(`${before + 1} photo`);
    await expect(a.previewCover().locator(".cover__sub")).toHaveText(`From ${PLACE}`);
  });

  test("refuses a file that is not a photo before sending", async ({ pages }) => {
    // Traces to: L2-115 AC2
    const a = pages.adminPlace;
    await a.uploadButton().click();
    await a.uploadFileInput().setInputFiles({ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
    await expect(a.dialogBanner()).toContainText("not a photo");
    await expect(a.dialogAction("Save photo")).toBeDisabled();
  });

  test("makes another photo primary after confirming the cover impact", async ({ page, pages }) => {
    // Traces to: L2-117 AC1, AC2, AC3
    const a = pages.adminPlace;
    const alt = `Trail ${Date.now().toString(36)}`;
    await a.uploadButton().click();
    await a.uploadFileInput().setInputFiles(FAMILY_PHOTO);
    await a.fillPhotoDetails({ alt, attribution: "Photo · Saturdaze", licence: "CC0" });
    await a.dialogAction("Save photo").click();
    await expect(a.dialog()).toHaveCount(0);

    const tile = a.tile(alt);
    await expect(a.tileBadges(tile)).not.toContainText(["Primary"]);
    await a.tileAction(tile, "Make primary").click();
    await expect(a.dialogTitle()).toHaveText("Make this the primary photo?");
    await expect(a.dialogBody().locator(".well__title")).toHaveText("No weekend covers follow this place");

    const calls: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/admin\/photos\/[^/]+\/primary$/.test(r.url())) calls.push(r.url());
    });
    await a.dialogAction("Make primary").click();
    await expect(a.dialog()).toHaveCount(0);
    await expect(a.tileBadges(a.tile(alt))).toContainText(["Primary"]);
    await expect(a.primaryTile()).toHaveCount(1);
    expect(calls).toHaveLength(1);
  });

  test("edits a photo's details in place", async ({ pages }) => {
    // Traces to: L2-118 AC1, AC2
    const a = pages.adminPlace;
    const alt = `Picnic ${Date.now().toString(36)}`;
    await a.uploadButton().click();
    await a.uploadFileInput().setInputFiles(FAMILY_PHOTO);
    await a.fillPhotoDetails({ alt, attribution: "Photo · Saturdaze", licence: "Saturdaze owned" });
    await a.dialogAction("Save photo").click();
    await expect(a.dialog()).toHaveCount(0);

    await a.tileAction(a.tile(alt), "Edit").click();
    await expect(a.dialogTitle()).toHaveText("Edit photo details");
    await a.fillPhotoDetails({ attribution: "" });
    await expect(a.dialogAction("Save changes")).toBeDisabled();
    const edited = `${alt} edited`;
    await a.fillPhotoDetails({ alt: edited, attribution: "Photo · Jo Doe", licence: "CC BY-SA 4.0" });
    await a.dialogAction("Save changes").click();
    await expect(a.dialog()).toHaveCount(0);

    const tile = a.tile(edited);
    await expect(a.tileDetail(tile, "Credit")).toHaveText("Photo · Jo Doe");
    await expect(a.tileDetail(tile, "Licence")).toHaveText("CC BY-SA 4.0");
  });
});
