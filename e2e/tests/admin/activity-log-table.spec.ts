import { test, expect } from "../../fixtures/sd-test.js";
import { SEEDED_ADMIN } from "../../fixtures/auth.js";
import { FAMILY_PHOTO } from "../../fixtures/weekend-cover.js";

/**
 * Activity log as a table (L2-122 AC5, drift D23, WCAG 1.3.1). From 720px
 * the log is a table whose column headers name every cell; under 720px the
 * same records stack as the activity feed and no table shows. The test
 * makes a change of its own first so the log has a row it can recognise.
 */

const PLACE = "Bronte Creek Provincial Park";

test.describe("Admin activity log table", () => {
  test("Given a photo change, when the log is wide, then it is a table with Time, Who, Place, Action and Change headers; when it is narrow, then it is a stacked feed", async ({
    page,
    goto,
    pages,
  }) => {
    // Traces to: L2-122 AC5
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
    await pages.adminPlaces.searchInput().fill("bronte");
    await expect(pages.adminPlaces.rows()).toHaveCount(1);
    await pages.adminPlaces.row(PLACE).click();
    const a = pages.adminPlace;
    await a.waitForScreen("place");
    const alt = `Tabled ${Date.now().toString(36)}`;
    await a.uploadButton().click();
    await a.uploadFileInput().setInputFiles(FAMILY_PHOTO);
    await a.fillPhotoDetails({ alt, attribution: "Photo · Saturdaze", licence: "CC0" });
    await a.dialogAction("Save photo").click();
    await expect(a.dialog()).toHaveCount(0);

    await a.adminNavLink("activity").click();
    const log = pages.adminActivity;
    await log.waitForScreen("activity");

    await expect(log.logTable()).toBeVisible();
    await expect(log.columnHeaders()).toHaveText(["Time", "Who", "Place", "Action", "Change"]);
    await expect(await log.cellUnder("Time", 0)).toHaveText(/^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}:\d{2}(am|pm) UTC$/);
    await expect(await log.cellUnder("Who", 0)).toHaveText(SEEDED_ADMIN.email);
    await expect(await log.cellUnder("Place", 0)).toHaveText(PLACE);
    await expect(await log.cellUnder("Action", 0)).toHaveText("Upload");
    await expect(await log.cellUnder("Change", 0)).toHaveText(/^Added .+ · \d+ × \d+ · \d+ KB$/);
    await expect(log.feed()).toBeHidden();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(log.logTable()).toBeHidden();
    await expect(log.feed()).toBeVisible();
    await expect(log.rowWho(log.rows().first())).toHaveText(SEEDED_ADMIN.email);
    await expect(log.rowAction(log.rows().first())).toHaveText("Upload");
  });
});
