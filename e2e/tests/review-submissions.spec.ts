import { APIRequestContext } from "@playwright/test";
import { test, expect, isPhone } from "../fixtures/sd-test.js";
import { apiLogin, SEEDED_USER, submitEventSubmission } from "../fixtures/auth.js";

/**
 * Review submissions (admin) — the queue oldest-first, approve (D23 →
 * `.approved-row`), reject (D24), the back affordance and the empty state.
 *
 * Each test that consumes a submission creates its own first through the
 * API as the seeded user, so the seeded queue is never drained.
 */

async function submitEvent(request: APIRequestContext, title: string): Promise<void> {
  await submitEventSubmission(request, await apiLogin(request, SEEDED_USER), title);
}

test.describe("Review submissions", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("reviewSubmissions");
    await pages.reviewSubmissions.waitForReady();
  });

  test("header, back affordance and nav state (Family stays current)", async ({ pages }, testInfo) => {
    const r = pages.reviewSubmissions;
    await expect(r.pageTitle()).toHaveText("Review submissions");
    await expect(r.pageSubtitle()).not.toBeEmpty();
    await expect(r.backLink()).toBeVisible();
    if (isPhone(testInfo)) await expect(r.backLink()).toHaveAttribute("aria-label", "Back to Family");
    else await expect(r.backLink()).toHaveText(/Family/);
    await expect(r.activeNavLink()).toHaveAttribute("data-nav", "family");
    await expect(r.body).toHaveAttribute("data-page", "review-submissions");
  });

  test("back returns to Family", async ({ page, pages }) => {
    await pages.reviewSubmissions.backLink().click();
    await page.waitForURL("**/family");
  });

  test("the seeded Buskerfest suggestion is waiting in the queue", async ({ pages }) => {
    const r = pages.reviewSubmissions;
    await expect(r.card("Port Credit Buskerfest")).toBeVisible();
    expect(await r.cards().count()).toBeGreaterThanOrEqual(1);
  });

  test("cards show the details list, the submitter and Reject / Approve", async ({ pages }) => {
    const r = pages.reviewSubmissions;
    test.skip((await r.cards().count()) === 0, "queue is empty");
    const card = r.cards().first();
    await expect(r.dateTile(card)).toBeVisible();
    await expect(r.cardMeta(card)).not.toBeEmpty();
    await expect(card.locator(".chip--sun")).toHaveText("Pending");
    for (const label of ["Location", "Cost", "Ages", "Link", "Notes"] as const) {
      await expect(r.detail(card, label)).toBeAttached();
    }
    await expect(r.submitter(card)).toContainText("@");
    await expect(r.rejectButton(card)).toBeVisible();
    await expect(r.approveButton(card)).toBeVisible();
  });

  test("approving confirms in D23 and swaps the card for an approved row", async ({ page, pages, request }) => {
    const r = pages.reviewSubmissions;
    const title = `Approve me ${Date.now().toString(36)}`;
    await submitEvent(request, title);
    await page.reload();
    await r.waitForReady();

    const card = r.card(title);
    await r.approveButton(card).click();
    await expect(r.dialogTitle()).toHaveText(`Approve ${title}?`);
    await expect(r.dialogBody().locator(".card__meta")).toContainText(SEEDED_USER.email);

    const approved = page.waitForResponse((r2) => /\/api\/events\/submissions\/[^/]+\/approve/.test(r2.url()));
    await r.dialogAction("Approve").click();
    expect((await approved).ok()).toBeTruthy();
    await expect(r.dialog()).toHaveCount(0);
    await expect(r.card(title)).toHaveCount(0);
    await expect(r.approvedRows().filter({ hasText: title })).toHaveText(`Approved · ${title}`);
  });

  test("rejecting confirms in D24 with an optional reason and removes the card", async ({ page, pages, request }) => {
    const r = pages.reviewSubmissions;
    const title = `Reject me ${Date.now().toString(36)}`;
    await submitEvent(request, title);
    await page.reload();
    await r.waitForReady();

    await r.rejectButton(r.card(title)).click();
    await expect(r.dialogTitle()).toHaveText("Reject this suggestion?");
    await expect(r.dialogAction("Reject")).toHaveClass(/btn--danger/);
    await r.dialogField("Reason").fill("Already listed.");

    const rejected = page.waitForResponse((r2) => /\/api\/events\/submissions\/[^/]+\/reject/.test(r2.url()));
    await r.dialogAction("Reject").click();
    expect((await rejected).ok()).toBeTruthy();
    await expect(r.dialog()).toHaveCount(0);
    await expect(r.card(title)).toHaveCount(0);
  });
});

test.describe("Review submissions — empty", () => {
  test("?state=empty renders 'Queue is clear' with Back to Family", async ({ page, goto, pages }) => {
    await goto("reviewEmpty");
    await pages.reviewSubmissions.waitForReady();
    const r = pages.reviewSubmissions;
    await expect(r.emptyTitle()).toHaveText("Queue is clear");
    await expect(r.cards()).toHaveCount(0);
    await r.backToFamilyButton().click();
    await page.waitForURL("**/family");
  });
});
