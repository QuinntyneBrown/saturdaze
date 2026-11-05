import { test, expect } from "../fixtures/sd-test.js";
import {
  apiLogin,
  ensureCurrentWeekend,
  registerThrowaway,
} from "../fixtures/auth.js";
import { addDaysIso } from "../fixtures/dates.js";
import { planWeekend } from "../fixtures/covers.js";
import { dateFamily, stubPastDate } from "../fixtures/couple-date.js";

/**
 * A couple's date (L1-042, L2-225): planned from /weekend through D38, shown as a
 * block with who needs care, changed on its own screen through D39–D43, and listed
 * with its weekend on /past. Each test has a throwaway family on the real API.
 */

test.describe("Couples date", () => {
  // Traces to: L2-225 AC1, L2-219, L2-222 AC4
  test("Given two adults, when a Sunday dinner date is planned through D38, then its screen opens and Sunday shows the date with kids-need-care", async ({
    page,
    request,
    signIn,
    pages,
  }) => {
    await signIn(await dateFamily(request));
    await page.goto("/weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.planDateButton().click();
    await expect(w.dialogTitle()).toHaveText("Plan a date");
    await w.dialogOption("Dinner").check();
    await w.dialogOption("Sunday").check();
    await expect(w.dialogPerson("Ada")).toBeChecked();
    await expect(w.dialogPerson("Ben")).toBeChecked();
    await w.dialogAction("Plan the date").click();

    const d = pages.date;
    await d.waitForReady();
    await expect(d.pageTitle()).toHaveText("Dinner date");
    await expect(d.pageSubtitle()).toContainText("Sunday");
    await expect(d.pageSubtitle()).toContainText("Ada and Ben");
    await expect(d.mealTitle()).toHaveText(/^Dinner at /);
    await expect(d.careBanner()).toContainText("Kids need care");

    await d.backLink().click();
    await w.waitForPlan();
    await w.selectDay("Sunday");
    const block = w.dateBlock("Sunday");
    await expect(block).toHaveCount(1);
    await expect(w.blockChips(block)).toHaveText([
      "Date",
      /^\s*Kids need care \d/,
    ]);
  });

  // Traces to: L2-225 AC2, L2-219 AC4
  test("Given one adult, when Plan a date opens, then D38b says a date needs two adults and cannot be planned", async ({
    page,
    request,
    signIn,
    pages,
  }) => {
    await signIn(await dateFamily(request, "one-adult"));
    await page.goto("/weekend");
    const w = pages.weekend;
    await w.waitForPlan();

    await w.planDateButton().click();

    await expect(w.dialogWell()).toContainText("A date needs two adults");
    await expect(w.dialogAction("Plan the date")).toBeDisabled();
  });

  // Traces to: L2-225 AC3, L2-223 AC2, AC3
  test("Given a lunch date, when the restaurant is swapped through D39 and the activity dropped through D40, then both show on its screen", async ({
    page,
    request,
    signIn,
    pages,
  }) => {
    await signIn(await dateFamily(request));
    await page.goto("/weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    await w.planDateButton().click();
    await w.dialogOption("Lunch").check();
    await w.dialogOption("Saturday").check();
    await w.dialogAction("Plan the date").click();
    const d = pages.date;
    await d.waitForReady();
    const before = await d.mealTitle().innerText();

    await d.swapRestaurantButton().click();
    await expect(d.dialogTitle()).toHaveText(/^Swap /);
    await d.dialogAction("Swap restaurant").click();
    await expect(d.mealTitle()).not.toHaveText(before);

    await expect(d.activityStep()).toHaveCount(1);
    await d.changeActivityButton().click();
    await d.dialogAction("Drop activity").click();
    await expect(d.activityStep()).toHaveCount(0);
    await expect(d.addActivityButton()).toBeVisible();
  });

  // Traces to: L2-225 AC4, L2-223 AC4
  test("Given a dinner date, when it is moved to Saturday lunch through D41, then its screen shows a Saturday lunch date", async ({
    page,
    request,
    signIn,
    pages,
  }) => {
    await signIn(await dateFamily(request));
    await page.goto("/weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    await w.planDateButton().click();
    await w.dialogOption("Dinner").check();
    await w.dialogOption("Sunday").check();
    await w.dialogAction("Plan the date").click();
    const d = pages.date;
    await d.waitForReady();

    await d.moveButton().click();
    await expect(d.dialogTitle()).toHaveText("Move the date");
    await d.dialogOption("Lunch").check();
    await d.dialogOption("Saturday").check();
    await d.dialogAction("Move date").click();

    await expect(d.pageTitle()).toHaveText("Lunch date");
    await expect(d.pageSubtitle()).toContainText("Saturday");
    await expect(d.mealTitle()).toHaveText(/^Lunch at /);
  });

  // Traces to: L2-225 AC5, L2-223 AC7
  test("Given a date, when it is cancelled through D43, then /weekend shows no date", async ({
    page,
    request,
    signIn,
    pages,
  }) => {
    await signIn(await dateFamily(request));
    await page.goto("/weekend");
    const w = pages.weekend;
    await w.waitForPlan();
    await w.planDateButton().click();
    await w.dialogOption("Dinner").check();
    await w.dialogOption("Sunday").check();
    await w.dialogAction("Plan the date").click();
    const d = pages.date;
    await d.waitForReady();

    await d.cancelButton().click();
    await expect(d.dialogTitle()).toHaveText("Cancel the date?");
    await d.dialogAction("Cancel date").click();

    await page.waitForURL("**/weekend");
    await w.waitForPlan();
    await w.selectDay("Sunday");
    await expect(w.dateBlock("Sunday")).toHaveCount(0);
  });

  // Traces to: L2-225 AC7
  test("Given a past weekend that had a date, when /past opens, then its card shows the date", async ({
    page,
    request,
    signIn,
    pages,
  }) => {
    const account = await registerThrowaway(request, "past-date");
    const session = await apiLogin(request, account);
    const current = await ensureCurrentWeekend(request, session);
    await planWeekend(request, session, addDaysIso(current.weekendOf, -7));
    await stubPastDate(page);
    await signIn(account);

    await page.goto("/past");
    const p = pages.past;
    await p.waitForReady();

    await expect(p.dateLine(p.cards().first())).toHaveText(
      /Date\s*Sunday dinner at Snug Harbour · Ada and Ben/,
    );
  });
});
