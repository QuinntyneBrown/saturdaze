// Traces to: L2-050
import { test, expect } from "../fixtures/sd-test.js";

/**
 * Admin moderation queue. `goto("adminEvents")` signs in as the seeded
 * admin (`admin@saturdaze.app`); the three pending rows come from
 * `saturdaze seed`. Nothing here approves or rejects, so the queue is
 * stable between runs.
 */

test.describe("Admin event moderation queue", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("adminEvents");
    await pages.adminEvents.waitForComponentsReady();
    await settle();
  });

  test("lists the seeded pending submissions", async ({ pages, page }) => {
    await expect(pages.adminEvents.headingTitle()).toBeVisible();
    await expect(pages.adminEvents.allSubmissionRows()).toHaveCount(3);
    await expect(page.locator(".admin-lede p")).toHaveText(/3 in queue/);
    await expect(pages.adminEvents.submissionRow("Port Credit Buskerfest")).toBeVisible();
  });

  test("each submission has approve and reject buttons and a real link", async ({ pages }) => {
    await expect(pages.adminEvents.approveButton("Port Credit Buskerfest")).toBeVisible();
    await expect(pages.adminEvents.rejectButton("Port Credit Buskerfest")).toBeVisible();
    const link = pages.adminEvents.submissionRow("Port Credit Buskerfest").locator("a.link-button");
    await expect(link).toHaveAttribute("href", /^https?:\/\//);
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("reject opens a dialog that can be cancelled", async ({ pages, page }) => {
    await pages.adminEvents.rejectButton("Port Credit Buskerfest").locator("button").click();
    const dialog = page.locator('sd-dialog[title="Reject this submission?"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('sd-button[variant="secondary"] button').click();
    await expect(dialog).not.toBeVisible();
    await expect(pages.adminEvents.allSubmissionRows()).toHaveCount(3);
  });

  test("approve opens a dialog that can be cancelled", async ({ pages, page }) => {
    await pages.adminEvents.approveButton("Port Credit Buskerfest").locator("button").click();
    const dialog = page.locator("sd-dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('sd-button[variant="secondary"] button').click();
    await expect(dialog).not.toBeVisible();
    await expect(pages.adminEvents.allSubmissionRows()).toHaveCount(3);
  });
});
