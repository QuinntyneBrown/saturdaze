import { test, expect } from "../../fixtures/sd-test.js";
import { SEEDED_ADMIN } from "../../fixtures/auth.js";
import { FAMILY_PHOTO } from "../../fixtures/weekend-cover.js";

/**
 * Activity log (A7, L2-122): every photo change lists who, when (UTC), the
 * place, the action and what changed, filterable by administrator. The test
 * makes a change of its own first so there is a row it can recognise.
 */

const PLACE = "Bronte Creek Provincial Park";

test.describe("Admin activity log", () => {
  test("lists an upload with the administrator, UTC time, place and change, and filters by administrator", async ({ page, goto, pages }) => {
    // Traces to: L2-122 AC2, AC4
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
    await pages.adminPlaces.searchInput().fill("bronte");
    await expect(pages.adminPlaces.rows()).toHaveCount(1);
    await pages.adminPlaces.row(PLACE).click();
    const a = pages.adminPlace;
    await a.waitForScreen("place");
    const alt = `Logged ${Date.now().toString(36)}`;
    await a.uploadButton().click();
    await a.uploadFileInput().setInputFiles(FAMILY_PHOTO);
    await a.fillPhotoDetails({ alt, attribution: "Photo · Saturdaze", licence: "CC0" });
    await a.dialogAction("Save photo").click();
    await expect(a.dialog()).toHaveCount(0);
    await expect(a.tile(alt)).toHaveCount(1);

    await a.adminNavLink("activity").click();
    const log = pages.adminActivity;
    await log.waitForScreen("activity");
    await expect(log.pageTitle()).toHaveText("Activity log");
    const row = log.rows().first();
    await expect(log.rowWho(row)).toHaveText(SEEDED_ADMIN.email);
    await expect(log.rowTime(row)).toHaveText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/);
    await expect(log.rowPlace(row)).toHaveText(PLACE);
    await expect(log.rowPlace(row)).toHaveAttribute("href", /\/places\/Activity\//);
    await expect(log.rowAction(row)).toHaveText("Upload");
    await expect(log.rowChange(row)).toHaveText(/^Added .+ · \d+ × \d+ · \d+ KB$/);

    await log.adminSelect().selectOption({ label: SEEDED_ADMIN.email });
    await page.waitForURL(/adminId=/);
    await expect(log.rows().first()).toBeVisible();
    for (const who of await log.rowWho(log.rows()).allTextContents()) {
      expect(who).toBe(SEEDED_ADMIN.email);
    }

    await log.placeSelect().selectOption({ label: PLACE });
    await page.waitForURL(/placeId=/);
    await expect(log.rowPlace(log.rows().first())).toHaveText(PLACE);
    await expect(log.pagerText()).toHaveText(/^1 to \d+ of \d+$/);
  });
});
