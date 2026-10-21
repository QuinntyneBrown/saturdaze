import { test, expect } from "../fixtures/sd-test.js";
import { API_URL, apiLogin, SEEDED_USER, stopCalendarFeed } from "../fixtures/auth.js";

/**
 * The family's private subscription link (L2-179, L2-178): created from the
 * Calendar section on Family, shown once in D33 with Copy, and stopped
 * through D34. Runs against the real API.
 */

test.describe("Calendar subscription link", () => {
  test.beforeEach(async ({ request, goto, pages }) => {
    await stopCalendarFeed(request, await apiLogin(request, SEEDED_USER));
    await goto("family");
    await pages.family.waitForReady();
  });

  // Traces to: L2-179 AC1, L2-173 AC1
  test("Given no link, when the member subscribes, then D33 shows a webcal URL once and the section says the link is on", async ({ pages, request }) => {
    const f = pages.family;
    await expect(f.subscribeRow()).toBeVisible();

    await f.createFeedFrom(f.subscribeRow());

    await expect(f.dialogTitle()).toHaveText("Subscribe from another calendar");
    await expect(f.dialogSubtitle()).toHaveText("Copy it now. For your privacy it is not shown again.");
    await expect(f.feedUrl()).toHaveText(/^webcal:\/\/.+\/api\/calendar\/feed\/[\w-]+\.ics$/);
    const url = (await f.feedUrl().textContent())!.trim().replace(/^webcal:\/\/[^/]+/, API_URL);
    expect((await request.get(url)).status()).toBe(200);
    await expect(f.dialogBody()).toContainText("Apple Calendar");
    await expect(f.dialogBody()).toContainText("Outlook");
    await expect(f.dialogBody()).toContainText("Google Calendar");

    await f.dialogAction("Done").click();
    await expect(f.feedOnRow()).toBeVisible();
    await expect(f.subscribeRow()).toHaveCount(0);
  });

  // Traces to: L2-179 AC2
  test("Given D33, when the member copies the link, then the clipboard holds it and the button is pressed", async ({ page, pages }) => {
    const f = pages.family;
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await f.createFeedFrom(f.subscribeRow());

    await f.copyFeedButton().click();

    await expect(f.copyFeedButton()).toHaveAttribute("aria-pressed", "true");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe((await f.feedUrl().textContent())!.trim());
  });

  // Traces to: L2-179 AC3
  test("Given a link, when the page reloads, then the section says the link is on and shows no URL", async ({ page, pages }) => {
    const f = pages.family;
    await f.createFeedFrom(f.subscribeRow());
    await f.dialogAction("Done").click();

    await page.reload();
    await f.waitForReady();

    await expect(f.feedOnRow()).toBeVisible();
    await expect(f.calendarSection()).not.toContainText("webcal://");
    await expect(f.calendarSection()).not.toContainText("/api/calendar/feed/");
  });

  // Traces to: L2-179 AC4
  test("Given a link, when the member stops it and confirms, then the section offers to subscribe again and the URL is gone", async ({ pages, request }) => {
    const f = pages.family;
    await f.createFeedFrom(f.subscribeRow());
    const url = (await f.feedUrl().textContent())!.trim().replace(/^webcal:\/\/[^/]+/, API_URL);
    await f.dialogAction("Done").click();

    await f.stopFeedButton().click();
    await expect(f.dialogTitle()).toHaveText("Stop the subscription link?");
    await expect(f.dialogSubtitle()).toHaveText("Calendars subscribed to it stop getting this weekend.");
    await f.confirmStopFeed();

    await expect(f.subscribeRow()).toBeVisible();
    await expect(f.feedOnRow()).toHaveCount(0);
    expect((await request.get(url)).status()).toBe(404);
  });

  // Traces to: L2-179 AC5
  test("Given a link, when the member asks for a new one, then D33 shows a different URL", async ({ pages }) => {
    const f = pages.family;
    await f.createFeedFrom(f.subscribeRow());
    const first = (await f.feedUrl().textContent())!.trim();
    await f.dialogAction("Done").click();

    await f.createFeedFrom(f.newFeedLinkRow());

    const second = (await f.feedUrl().textContent())!.trim();
    expect(second).not.toBe(first);
  });

  // Traces to: L2-179 AC4
  test("Given D33, when the member chooses Stop the link and confirms, then the link is stopped", async ({ pages }) => {
    const f = pages.family;
    await f.createFeedFrom(f.subscribeRow());

    await f.dialogAction("Stop the link").click();
    await expect(f.dialogTitle()).toHaveText("Stop the subscription link?");
    await f.confirmStopFeed();

    await expect(f.subscribeRow()).toBeVisible();
  });
});
