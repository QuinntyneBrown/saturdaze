import { test, expect } from "../fixtures/sd-test.js";

/**
 * Errands — the "Add an errand" ghost row → D7 (What / How long / Which day)
 * → the API places it → D9 confirms where it landed → a `.block--errand`
 * row with a "Mark … done" action.
 */

const errandName = () => `Costco run ${Date.now().toString(36)}`;

test.describe("Add an errand", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("weekend");
    await pages.weekend.waitForPlan();
  });

  test("ghost row opens D7 with the three fields and 'Either' preselected", async ({ pages }) => {
    const w = pages.weekend;
    await w.addErrandRow("Saturday").click();
    await expect(w.dialogTitle()).toHaveText("Add an errand");
    await expect(w.dialogField("What is it")).toBeFocused();
    await expect(w.dialogField("Roughly how long")).toBeVisible();
    await expect(w.dialog().getByRole("radiogroup", { name: "Which day" })).toBeVisible();
    await expect(w.dialog().getByRole("radio", { name: "Either" })).toBeChecked();
    await expect(w.dialogAction("Add to weekend")).toBeDisabled();
    await w.dialogAction("Cancel").click();
    await expect(w.dialog()).toHaveCount(0);
  });

  test("submitting places the errand, confirms in D9, and adds an errand block", async ({ page, pages }) => {
    const w = pages.weekend;
    const name = errandName();
    const before = await w.errandBlocks().count();

    await w.addErrandRow("Sunday").click();
    await w.dialogField("What is it").fill(name);
    await w.dialogField("Roughly how long").selectOption({ label: "30 min" });
    await w.dialog().getByRole("radio", { name: "Sunday" }).check();

    const placed = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/errands/.test(r.url()) && r.request().method() === "POST");
    await w.dialogAction("Add to weekend").click();
    expect((await placed).ok()).toBeTruthy();

    await expect(w.dialogTitle()).toHaveText(/^Added to Sunday at \d/);
    await expect(w.dialogBody().locator(".list__title").first()).toHaveText(name);
    await w.dialogAction("Done").click();
    await expect(w.dialog()).toHaveCount(0);

    await expect(w.errandBlocks()).toHaveCount(before + 1);
    const block = w.block(name, "Sunday");
    await expect(block).toHaveClass(/block--errand/);
    await expect(w.blockChips(block).first()).toHaveText("Errand");
    await expect(w.doneButton(name, "Sunday")).toBeVisible();
    await expect(w.swapButton(name, "Sunday")).toHaveCount(0);
  });

  test("'Either' lets the planner pick the day", async ({ page, pages }) => {
    const w = pages.weekend;
    const name = errandName();

    await w.addErrandRow("Saturday").click();
    await w.dialogField("What is it").fill(name);
    const placed = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/errands/.test(r.url()) && r.request().method() === "POST");
    await w.dialogAction("Add to weekend").click();
    expect((await placed).ok()).toBeTruthy();

    await expect(w.dialogTitle()).toHaveText(/^Added to (Saturday|Sunday) at \d/);
    await w.dialogAction("Done").click();
    await expect(w.block(name)).toHaveClass(/block--errand/);
  });

  test("marking an errand done sets the done modifier", async ({ page, pages }) => {
    const w = pages.weekend;
    const name = errandName();
    await w.addErrandRow("Saturday").click();
    await w.dialogField("What is it").fill(name);
    await w.dialog().getByRole("radio", { name: "Saturday" }).check();
    await w.dialogAction("Add to weekend").click();
    await expect(w.dialogTitle()).toHaveText(/^Added to Saturday/);
    await w.dialogAction("Done").click();

    const done = page.waitForResponse((r) => /\/api\/(errands|blocks)\/[^/]+/.test(r.url()) && r.request().method() !== "GET");
    await w.doneButton(name, "Saturday").click();
    expect((await done).ok()).toBeTruthy();
    await expect(w.block(name, "Saturday")).toHaveClass(/block--done/);
  });
});
