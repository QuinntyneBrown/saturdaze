import { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Review queue (A5, L2-120): provider photos ingestion brought in, newest
 * first, with Keep, Make primary (AD4) and Reject (AD6) in one step each.
 *
 * The bundled seed has no provider photos and nothing but ingestion creates
 * one, so the queue is served from a route mock; the decisions still go to
 * the real endpoint shape and the test counts exactly one call per decision.
 * The backend behaviour is covered by the API tests.
 */

const ITEM = (id: string, placeName: string, replaces: boolean) => ({
  photo: {
    id,
    url: `https://images.example.com/${id}.jpg`,
    width: 800,
    height: 600,
    alt: `Candidate photo for ${placeName}`,
    attribution: "Photo · Port Credit BIA",
    license: "Provider terms",
    source: "Provider",
    isPrimary: !replaces,
    reviewState: "Unreviewed",
    adminLocked: false,
    updatedAt: null,
    updatedBy: null,
    blocked: false,
  },
  kind: "Restaurant",
  placeId: "11111111-1111-1111-1111-111111111111",
  placeName,
  replaces: replaces
    ? { url: "https://images.example.com/current.jpg", width: 800, height: 600, alt: "", attribution: "Photo · Jo Doe" }
    : null,
});

async function serveQueue(page: Page) {
  const reviews: { id: string; body: unknown }[] = [];
  await page.route(/\/api\/admin\/photo-reviews$/, (route) =>
    route.fulfill({ json: [ITEM("harbour-grill", "Harbour Grill", true), ITEM("festival", "Port Credit Harbour Festival", false)] }),
  );
  await page.route(/\/api\/admin\/photos\/[^/]+\/review$/, (route) => {
    const id = route.request().url().split("/").at(-2)!;
    reviews.push({ id, body: route.request().postDataJSON() });
    return route.fulfill({ status: 204, body: "" });
  });
  await page.route(/\/api\/admin\/places\/Restaurant\/[^/]+\/photos$/, (route) =>
    route.fulfill({ json: { kind: "Restaurant", id: "11111111-1111-1111-1111-111111111111", name: "Harbour Grill", coverImpact: 3, photos: [] } }),
  );
  return reviews;
}

test.describe("Admin review queue", () => {
  test("lists each provider photo beside the primary it would replace", async ({ page, goto, pages }) => {
    // Traces to: L2-120 AC1
    await serveQueue(page);
    await goto("adminReviews");
    const a = pages.adminReviews;
    await a.waitForScreen("reviews");
    await expect(a.pageTitle()).toHaveText("Review queue");
    await expect(a.pageSubtitle()).toHaveText(/^Two provider photos ingestion brought in, newest first/);
    await expect(a.activeAdminNavLink()).toHaveText(/Review queue/);
    await expect(a.items()).toHaveCount(2);

    const grill = a.item("Harbour Grill");
    await expect(a.itemLink(grill)).toHaveAttribute("href", /\/places\/Restaurant\/1111/);
    await expect(a.itemMeta(grill)).toHaveText("Restaurant · Provider terms");
    await expect(a.itemCaptions(grill)).toHaveText(["New from ingestion", "Would replace"]);
    await expect(a.itemCaptions(a.item("Port Credit Harbour Festival"))).toHaveText(["New from ingestion", "Would become primary"]);
  });

  test("Reject confirms with an optional reason and makes exactly one call", async ({ page, goto, pages }) => {
    // Traces to: L2-120 AC4
    const reviews = await serveQueue(page);
    await goto("adminReviews");
    const a = pages.adminReviews;
    await a.waitForScreen("reviews");

    await a.itemAction(a.item("Harbour Grill"), "Reject").click();
    await expect(a.dialogTitle()).toHaveText("Reject this photo?");
    await expect(a.dialogSubtitle()).toContainText("Harbour Grill");
    await a.reasonField().fill("Wrong venue");
    await a.dialogAction("Reject").click();

    await expect(a.dialog()).toHaveCount(0);
    await expect(a.item("Harbour Grill")).toHaveCount(0);
    await expect(a.items()).toHaveCount(1);
    expect(reviews).toEqual([{ id: "harbour-grill", body: { decision: "reject", reason: "Wrong venue" } }]);
  });

  test("Keep and Make primary decide in one step and clear the queue", async ({ page, goto, pages }) => {
    // Traces to: L2-120 AC2, L2-117 AC2
    const reviews = await serveQueue(page);
    await goto("adminReviews");
    const a = pages.adminReviews;
    await a.waitForScreen("reviews");

    await a.itemAction(a.item("Port Credit Harbour Festival"), "Keep").click();
    await expect(a.item("Port Credit Harbour Festival")).toHaveCount(0);

    await a.itemAction(a.item("Harbour Grill"), "Make primary").click();
    await expect(a.dialogTitle()).toHaveText("Make this the primary photo?");
    await expect(a.dialogNote()).toContainText("3 weekend covers will change");
    await a.dialogAction("Make primary").click();

    await expect(a.items()).toHaveCount(0);
    await expect(a.emptyTitle()).toHaveText("Nothing to review");
    expect(reviews).toEqual([
      { id: "festival", body: { decision: "keep", reason: null } },
      { id: "harbour-grill", body: { decision: "primary", reason: null } },
    ]);
  });
});
