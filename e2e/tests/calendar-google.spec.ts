import { test, expect } from "../fixtures/sd-test.js";
import { FAKE_CODE, FAKE_STATE, stubCalendarApi } from "../fixtures/calendar-api.js";

/**
 * Connect Google Calendar from Family (L2-174, L2-175). The calendar
 * endpoints and Google's consent screen are stood in for by
 * `fixtures/calendar-api.ts` (ADR-022, decision 7); `CalendarConnectTests`
 * cover the API. Everything in the browser runs for real: the section's
 * states, D31, the return route and D32.
 */

const CONNECTED = {
  email: "quinn.brown@gmail.com",
  status: "connected" as const,
  readCommitments: true,
  lastSyncedUtc: new Date().toISOString(),
};

test.describe("Connect Google Calendar", () => {
  // Traces to: L2-174 AC1
  test("Given Google configured and nothing connected, the section offers both ways and no switch", async ({ page, goto, pages }) => {
    await stubCalendarApi(page);
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await expect(f.connectGoogleRow()).toBeVisible();
    await expect(f.subscribeRow()).toBeVisible();
    await expect(f.readCommitmentsToggle()).toHaveCount(0);
  });

  // Traces to: L2-174 AC2
  test("Given Google not configured, only the subscription link is offered", async ({ page, goto, pages }) => {
    await stubCalendarApi(page, { googleConfigured: false });
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await expect(f.subscribeRow()).toBeVisible();
    await expect(f.connectGoogleRow()).toHaveCount(0);
  });

  // Traces to: L2-174 AC3, AC4
  test("Given the connect dialog, when the member continues and Google sends them back, then the section shows the connection", async ({ page, goto, pages }) => {
    const stub = await stubCalendarApi(page);
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await f.connectGoogleRow().click();
    await expect(f.dialogTitle()).toHaveText("Connect Google Calendar");
    await expect(f.dialogSubtitle()).toHaveText("Google asks you to confirm on the next screen.");
    await expect(f.dialogBody()).toContainText("Saturdaze writes this weekend");
    await expect(f.dialogBody()).toContainText("Saturdaze reads this weekend");
    await expect(f.dialogBody()).toContainText("Nothing else");
    await f.dialogAction("Continue to Google").click();

    await page.waitForURL(/\/family$/);
    await f.waitForReady();
    expect(stub.sent("POST", "/api/calendar/google/connect")).toEqual([{ code: FAKE_CODE, state: FAKE_STATE }]);
    await expect(f.googleRow()).toContainText("cal@example.com");
    await expect(f.googleRow()).toContainText(/synced/i);
    await expect(f.disconnectGoogleButton()).toBeVisible();
    await expect(f.readCommitmentsToggle()).toBeChecked();
    await expect(f.connectGoogleRow()).toHaveCount(0);
  });

  // Traces to: L2-174 AC5
  test("Given Google sends the member back without permission, then nothing is connected and the note says so", async ({ page, goto, pages }) => {
    const stub = await stubCalendarApi(page, { consent: "deny" });
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await f.connectGoogleRow().click();
    await f.dialogAction("Continue to Google").click();

    await page.waitForURL(/\/family(\?.*)?$/);
    await f.waitForReady();
    await expect(f.calendarBanner()).toHaveText("Google Calendar wasn't connected. Nothing was shared.");
    await expect(f.connectGoogleRow()).toBeVisible();
    expect(stub.sent("POST", "/api/calendar/google/connect")).toEqual([]);
  });

  // Traces to: L2-174 AC5
  test("Given Google refuses the code, then the member lands on Family with the same note", async ({ page, pages, signIn }) => {
    await stubCalendarApi(page, { connectError: { status: 400, code: "google_calendar_code_invalid" } });
    const f = pages.family;
    await signIn();

    await f.returnFromGoogle(`code=${FAKE_CODE}&state=${FAKE_STATE}`);

    await expect(page).toHaveURL(/\/family(\?.*)?$/);
    await expect(f.calendarBanner()).toHaveText("Google Calendar wasn't connected. Nothing was shared.");
  });

  // Traces to: L2-174 AC6
  test("Given a connection, when the member turns Plan around my calendar off, then it saves and stays off", async ({ page, goto, pages }) => {
    const stub = await stubCalendarApi(page, { google: CONNECTED });
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await f.readCommitmentsToggle().click();

    await expect.poll(() => stub.sent("PUT", "/api/calendar/google")).toEqual([{ readCommitments: false }]);
    await page.reload();
    await f.waitForReady();
    await expect(f.readCommitmentsToggle()).not.toBeChecked();
  });

  // Traces to: L2-174 AC7
  test("Given a connection that needs reconnecting, the alert shows and Reconnect opens the connect dialog", async ({ page, goto, pages }) => {
    await stubCalendarApi(page, { google: { ...CONNECTED, status: "needs_reconnect" } });
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await expect(f.calendarBanner()).toHaveAttribute("role", "alert");
    await expect(f.calendarBanner()).toHaveText(
      "Google Calendar stopped accepting updates. Reconnect to keep this weekend in sync.",
    );
    await f.reconnectGoogleButton().click();
    await expect(f.dialogTitle()).toHaveText("Connect Google Calendar");
  });

  // Traces to: L2-174 AC8
  test("Given starting the connection fails, the dialog stays open with Google's error", async ({ page, goto, pages }) => {
    await stubCalendarApi(page, { authorizeFails: 503 });
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await f.connectGoogleRow().click();
    await f.dialogAction("Continue to Google").click();

    await expect(f.dialogBanner()).toHaveText("Google didn't answer. Nothing was connected. Try again in a minute.");
    await expect(f.dialogAction("Try again")).toBeVisible();
    await expect(page).toHaveURL(/\/family$/);
  });

  // Traces to: L2-175 AC6
  test("Given a connection, when the member disconnects and confirms, then the section offers to connect again", async ({ page, goto, pages }) => {
    const stub = await stubCalendarApi(page, { google: CONNECTED });
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    await f.disconnectGoogleButton().click();
    await expect(f.dialogTitle()).toHaveText("Disconnect Google Calendar?");
    await expect(f.dialogSubtitle()).toHaveText("Saturdaze stops writing and reading it. Events already there stay.");
    await f.dialogAction("Disconnect").click();

    await expect(f.connectGoogleRow()).toBeVisible();
    expect(stub.sent("DELETE", "/api/calendar/google")).toHaveLength(1);
  });
});
