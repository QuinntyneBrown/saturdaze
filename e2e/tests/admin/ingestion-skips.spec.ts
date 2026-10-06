import { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Ingestion photo skips (A6, L2-120 AC5): each run's skip reasons under its
 * start time, with a place that exists linking to its photos. Only the
 * ingestion worker writes runs, so the screen is served from a route mock;
 * the endpoint itself is covered by the API tests.
 */

const PLACE_ID = "22222222-2222-2222-2222-222222222222";

async function serveRuns(page: Page) {
  await page.route(/\/api\/admin\/ingestion-runs\/photo-skips$/, (route) =>
    route.fulfill({
      json: [
        {
          runId: "r1",
          startedUtc: "2026-10-06T04:12:00+00:00",
          type: "Events",
          status: "Succeeded",
          skips: [
            { placeName: "Port Credit Harbour Festival", url: "https://images.example.com/harbourfest-2024.jpg", reason: "previously rejected", kind: "LocalEvent", placeId: PLACE_ID },
            { placeName: "Port Credit Harbour Festival", url: "https://cdn.example.org/festival/hero.jpg", reason: "missing attribution or licence", kind: "LocalEvent", placeId: PLACE_ID },
          ],
        },
        {
          runId: "r2",
          startedUtc: "2026-10-05T04:11:00+00:00",
          type: "Activities",
          status: "Failed",
          skips: [{ placeName: "Lakeside Climbing Gym", url: "https://photos.example.net/climb.jpg", reason: "missing attribution or licence", kind: null, placeId: null }],
        },
      ],
    }),
  );
}

test.describe("Admin ingestion photo skips", () => {
  test("lists each run's skips under its start time and links the places that exist", async ({ page, goto, pages }) => {
    // Traces to: L2-120 AC5
    await serveRuns(page);
    await goto("adminSkips");
    const a = pages.adminSkips;
    await a.waitForScreen("ingestion-skips");
    await expect(a.pageTitle()).toHaveText("Ingestion photo skips");
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "skips");
    await expect(a.runs()).toHaveCount(2);

    const events = a.run("Events");
    await expect(a.runMeta(events)).toHaveText("6 Oct 2026, 04:12 UTC · 2 photo skips");
    await expect(a.runStatus(events)).toHaveText("Succeeded");
    await expect(a.skips(events)).toHaveCount(2);
    const first = a.skips(events).first();
    await expect(a.skipReason(first)).toHaveText("previously rejected");
    await expect(a.skipUrl(first)).toHaveText("https://images.example.com/harbourfest-2024.jpg");
    await expect(a.skipPlaceLink(first)).toHaveAttribute("href", `/places/LocalEvent/${PLACE_ID}`);

    const activities = a.run("Activities");
    await expect(a.runStatus(activities)).toHaveText("Failed");
    const gone = a.skips(activities).first();
    await expect(a.skipPlaceName(gone)).toHaveText("Lakeside Climbing Gym");
    await expect(a.skipPlaceLink(gone)).toHaveCount(0);
  });
});
