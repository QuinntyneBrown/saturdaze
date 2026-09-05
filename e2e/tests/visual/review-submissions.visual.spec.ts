import { test, expect } from "../../fixtures/sd-test.js";
import { isBaseline } from "../../fixtures/routes.js";
import { apiLogin, SEEDED_USER, submitEventSubmission } from "../../fixtures/auth.js";

/**
 * Review submissions parity (admin) — pages/review-submissions.html (+ .empty).
 *
 * The queue is seeded (Buskerfest first), so the card body is compared;
 * relative timestamps, the date tile and the count subtitle are masked.
 * The `.approved-row` only exists after an approval, so in app mode the
 * spec submits a throwaway event through the API and approves it first.
 */

test.describe("Visual: Review submissions", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("reviewSubmissions");
    await pages.reviewSubmissions.waitForReady();
    await settle();
  });

  test("matches the mock @full-page (dated regions masked)", async ({ page, pages }) => {
    const r = pages.reviewSubmissions;
    await expect(page).toHaveScreenshot("review.full.png", {
      fullPage: true,
      mask: [
        r.pageSubtitle(),
        page.locator(".date-tile"),
        page.locator(".card__meta"),
        page.locator(".submitter"),
        page.locator(".approved-row span"),
      ],
    });
  });

  test("page header with back affordance", async ({ pages }) => {
    await expect(pages.reviewSubmissions.pageHeader).toHaveScreenshot("review.header.png", {
      mask: [pages.reviewSubmissions.pageSubtitle()],
    });
  });

  test("submission card", async ({ pages }) => {
    const r = pages.reviewSubmissions;
    const card = r.cards().first();
    await expect(card).toHaveScreenshot("review.card.png", {
      mask: [r.dateTile(card), r.cardMeta(card), r.submitter(card)],
    });
  });
});

test.describe("Visual: Review submissions — approved row", () => {
  test("approved row replaces the card", async ({ goto, pages, settle, request }) => {
    const r = pages.reviewSubmissions;
    if (!isBaseline()) {
      const title = `Approved ${Date.now().toString(36)}`;
      await submitEventSubmission(request, await apiLogin(request, SEEDED_USER), title);
      await goto("reviewSubmissions");
      await r.waitForReady();
      await r.approveButton(r.card(title)).click();
      await r.dialogAction("Approve").click();
      await expect(r.approvedRows().filter({ hasText: title })).toBeVisible();
    } else {
      await goto("reviewSubmissions");
      await r.waitForReady();
    }
    await settle();
    const row = r.approvedRows().first();
    await expect(row).toHaveScreenshot("review.approved-row.png", {
      mask: [row.locator("span")],
    });
  });
});

test.describe("Visual: Review submissions — empty", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("reviewEmpty");
    await pages.reviewSubmissions.waitForReady();
    await settle();
  });

  test("matches the mock @full-page (static copy)", async ({ page }) => {
    await expect(page).toHaveScreenshot("review.empty.full.png", { fullPage: true });
  });

  test("page header", async ({ pages }) => {
    await expect(pages.reviewSubmissions.pageHeader).toHaveScreenshot("review.empty.header.png");
  });

  test("'Queue is clear' empty state", async ({ pages }) => {
    await expect(pages.reviewSubmissions.empty).toHaveScreenshot("review.empty.state.png");
  });
});
