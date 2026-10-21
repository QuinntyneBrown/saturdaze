import { test, expect } from "../fixtures/sd-test.js";
import { stubCalendarApi } from "../fixtures/calendar-api.js";
import { stubCalendarBlock } from "../fixtures/weekend-data.js";

/**
 * The weekend page with a connected Google Calendar (L2-175 AC7). The
 * calendar settings are stood in for (ADR-020, decision 7); the weekend and
 * its download are the real API's.
 */

const CONNECTED = {
  email: "quinn.brown@gmail.com",
  status: "connected" as const,
  readCommitments: true,
  lastSyncedUtc: new Date().toISOString(),
};

test.describe("Weekend with a connected calendar", () => {
  // Traces to: L2-175 AC7
  test("Given Google Calendar connected, when Add to calendar opens, then D6 says the calendar already has the weekend", async ({ page, goto, pages }) => {
    await stubCalendarApi(page, { google: CONNECTED });
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForReady();

    await w.addToCalendarButton().click();

    await expect(w.dialogTitle()).toHaveText("Add to your calendar");
    await expect(w.dialogBanner()).toHaveText("Your Google Calendar already has this weekend and keeps up with changes.");
    await expect(w.dialogAction("Download .ics")).toBeVisible();
  });

  // Traces to: L2-175 AC7, L2-086
  test("Given no connection, D6 is the plain download", async ({ page, goto, pages }) => {
    await stubCalendarApi(page, { google: null });
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForReady();

    await w.addToCalendarButton().click();

    await expect(w.dialogTitle()).toHaveText("Add to your calendar");
    await expect(w.dialogBanner()).toHaveCount(0);
  });

  // Traces to: L2-176 AC6
  test("Given an event from the connected calendar on Saturday, the block shows the Commitment and Calendar chips and where it came from", async ({ page, goto, pages }) => {
    await stubCalendarApi(page, { google: CONNECTED });
    await stubCalendarBlock(page, "Saturday", "Ava's birthday party");
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForReady();

    const block = w.block("Ava's birthday party", "Saturday");
    await expect(block).toBeVisible();
    await expect(w.blockChips(block)).toHaveText(["Commitment", "Calendar"]);
    await expect(w.blockSubtitle(block)).toHaveText("From your calendar · planned around");
  });
});
