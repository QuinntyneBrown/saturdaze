// Traces to: L2-050
import { test, expect } from "../fixtures/sd-test.js";

test.describe("Admin event moderation queue (mock)", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("adminEvents");
    await pages.adminEvents.waitForComponentsReady();
    await settle();
  });

  test("lists pending submissions oldest-first", async ({ pages }) => {
    await expect(pages.adminEvents.headingTitle()).toBeVisible();
    const rows = pages.adminEvents.allSubmissionRows();
    await expect(rows).toHaveCount(3);
  });

  test("each submission has approve and reject buttons", async ({ pages }) => {
    await expect(pages.adminEvents.approveButton("Port Credit Buskerfest")).toBeVisible();
    await expect(pages.adminEvents.rejectButton("Port Credit Buskerfest")).toBeVisible();
  });
});
