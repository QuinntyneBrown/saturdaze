import { test, expect, isPhone } from "../fixtures/sd-test.js";

/**
 * Weekend behaviour against the seeded Brown family (API on :5100).
 *
 * The planner output is non-deterministic, so assertions target structure
 * and the seeded anchors (Swim lessons Sat 9:00, Church Sun 10:30, Workout
 * window Sat 17:00) rather than specific planner picks.
 */

test.describe("Weekend", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("weekend");
    await pages.weekend.waitForPlan();
  });

  test("renders the header with Share, Add to calendar and More", async ({ pages }) => {
    const w = pages.weekend;
    await expect(w.pageTitle()).toHaveText("This weekend");
    await expect(w.pageSubtitle()).not.toBeEmpty();
    await expect(w.shareButton()).toBeVisible();
    await expect(w.addToCalendarButton()).toBeVisible();
    await expect(w.moreButton()).toBeVisible();
  });

  test("renders Saturday and Sunday with weather meta and day actions", async ({ pages }) => {
    const w = pages.weekend;
    for (const day of ["Saturday", "Sunday"] as const) {
      await expect(w.dayTitle(day)).toHaveText(day);
      await expect(w.dayMeta(day)).not.toBeEmpty();
      await expect(w.dayWeatherDisc(day)).toBeVisible();
      await expect(w.regenerateDayButton(day)).toBeVisible();
      await expect(w.lockDayButton(day)).toHaveAttribute("aria-pressed", /true|false/);
      await expect(w.ghostRow(day)).toBeVisible();
    }
  });

  test("seeded commitments appear as locked commitment blocks at their times", async ({ pages }) => {
    const w = pages.weekend;
    const swim = w.block("Swim lessons", "Saturday");
    await expect(swim).toHaveClass(/block--commitment/);
    await expect(w.blockClock(swim)).toHaveText("9:00");
    await expect(w.blockChips(swim).first()).toContainText("Commitment");
    await expect(w.whyButton("Swim lessons", "Saturday")).toHaveAttribute("aria-label", "About Swim lessons");
    await expect(w.swapButton("Swim lessons", "Saturday")).toHaveCount(0);
    await expect(w.lockButton("Swim lessons", "Saturday")).toHaveCount(0);

    const church = w.block("Church", "Sunday");
    await expect(church).toHaveClass(/block--commitment/);
    await expect(w.blockClock(church)).toHaveText("10:30");
  });

  test("planner blocks carry Why this / Swap / Lock actions; drives carry none", async ({ pages }) => {
    const w = pages.weekend;
    const first = w.actionableBlocks("Saturday").first();
    const title = (await w.blockTitle(first).textContent())!.trim();
    await expect(w.whyButton(title, "Saturday")).toHaveAttribute("aria-label", `Why this: ${title}`);
    await expect(w.swapButton(title, "Saturday")).toBeVisible();
    await expect(w.lockButton(title, "Saturday")).toHaveAttribute("aria-pressed", /true|false/);

    const drives = w.driveBlocks();
    if ((await drives.count()) > 0) {
      await expect(drives.first().locator(".block__actions")).toHaveCount(0);
      await expect(drives.first().locator(".block__chev")).toHaveCount(0);
    }
  });

  test("block chevron shows below 720px only", async ({ pages }, testInfo) => {
    const w = pages.weekend;
    const first = w.actionableBlocks("Saturday").first();
    if (isPhone(testInfo)) {
      await expect(w.blockChevron(first)).toBeVisible();
    } else {
      await expect(w.blockChevron(first)).toBeHidden();
    }
  });

  test("locking a block toggles aria-pressed, the label and the locked modifier", async ({ page, pages }) => {
    const w = pages.weekend;
    const first = w.actionableBlocks("Saturday").first();
    const title = (await w.blockTitle(first).textContent())!.trim();
    const lock = w.lockButton(title, "Saturday");
    const before = await lock.getAttribute("aria-pressed");

    const saved = page.waitForResponse((r) => /\/api\/blocks\/[^/]+\/lock/.test(r.url()) && r.request().method() !== "GET");
    await lock.click();
    expect((await saved).ok()).toBeTruthy();

    const after = before === "true" ? "false" : "true";
    await expect(lock).toHaveAttribute("aria-pressed", after);
    await expect(lock).toHaveAttribute("aria-label", after === "true" ? `Unlock ${title}` : `Lock ${title}`);
    if (after === "true") await expect(w.block(title, "Saturday")).toHaveClass(/block--locked/);
    else await expect(w.block(title, "Saturday")).not.toHaveClass(/block--locked/);

    // restore
    await lock.click();
    await expect(lock).toHaveAttribute("aria-pressed", before!);
  });

  test("locking a day toggles the day button and the locked modifier", async ({ page, pages }) => {
    const w = pages.weekend;
    const btn = w.lockDayButton("Sunday");
    const before = await btn.getAttribute("aria-pressed");

    const saved = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/days\/[^/]+\/lock/.test(r.url()));
    await btn.click();
    expect((await saved).ok()).toBeTruthy();

    const after = before === "true" ? "false" : "true";
    await expect(btn).toHaveAttribute("aria-pressed", after);
    await expect(btn).toHaveAttribute("aria-label", after === "true" ? "Unlock Sunday" : "Lock Sunday");
    if (after === "true") await expect(w.day("Sunday")).toHaveClass(/day--locked/);
    else await expect(w.day("Sunday")).not.toHaveClass(/day--locked/);

    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", before!);
  });

  test("'Why this' opens the block dialog (D1) with the reason and Swap / Lock actions", async ({ pages }) => {
    const w = pages.weekend;
    const first = w.actionableBlocks("Saturday").first();
    const title = (await w.blockTitle(first).textContent())!.trim();
    await w.whyButton(title, "Saturday").click();

    await expect(w.dialog()).toBeVisible();
    await expect(w.dialogTitle()).toHaveText(title);
    await expect(w.dialogBody().locator(".well__title")).toContainText("Why this");
    await expect(w.dialogAction("Swap for something else")).toBeVisible();
    await expect(w.dialogAction("Lock this block").or(w.dialogAction("Unlock"))).toBeVisible();

    await w.dialogClose().click();
    await expect(w.dialog()).toHaveCount(0);
  });

  test("a commitment's dialog explains it and links to Family", async ({ page, pages }) => {
    const w = pages.weekend;
    await w.whyButton("Swim lessons", "Saturday").click();
    await expect(w.dialogTitle()).toHaveText("Swim lessons");
    await expect(w.dialogBody().locator(".well--accent")).toContainText("recurring commitment");
    await w.dialogAction("Edit on Family").click();
    await page.waitForURL("**/family");
  });

  test("Swap replaces the block with a server-chosen alternative", async ({ page, pages }) => {
    const w = pages.weekend;
    const first = w.actionableBlocks("Sunday").first();
    const title = (await w.blockTitle(first).textContent())!.trim();
    const countBefore = await w.blocks("Sunday").count();

    const swapped = page.waitForResponse((r) => /\/api\/blocks\/[^/]+\/swap/.test(r.url()));
    await w.swapButton(title, "Sunday").click();
    expect((await swapped).ok()).toBeTruthy();

    await w.waitForPlan();
    await expect(w.blocks("Sunday")).toHaveCount(countBefore);
  });

  test("Share opens D5 with a copyable link to the public weekend", async ({ page, pages }) => {
    const w = pages.weekend;
    const minted = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/share$/.test(r.url()));
    await w.shareButton().click();
    expect((await minted).ok()).toBeTruthy();

    await expect(w.dialogTitle()).toHaveText("Share this weekend");
    await expect(w.dialogBody().locator(".copy-field__value")).toContainText("sample-weekend?share=");
    await expect(w.dialogBody().getByRole("button", { name: "Copy", exact: true })).toHaveAttribute("aria-pressed", "false");
    await w.dialogAction("Done").click();
    await expect(w.dialog()).toHaveCount(0);
  });

  test("Add to calendar opens D6 with the .ics file row", async ({ pages }) => {
    const w = pages.weekend;
    await w.addToCalendarButton().click();
    await expect(w.dialogTitle()).toHaveText("Add to your calendar");
    await expect(w.dialogBody().locator(".list__title")).toContainText(/\.ics$/);
    await expect(w.dialogAction("Download .ics")).toBeVisible();
    await w.dialogAction("Cancel").click();
    await expect(w.dialog()).toHaveCount(0);
  });

  test("More offers Regenerate and Add to calendar, and Regenerate confirms first", async ({ pages }) => {
    const w = pages.weekend;
    await w.moreButton().click();
    await expect(w.menuItem("Regenerate the weekend")).toBeVisible();
    await expect(w.menuItem("Add to calendar")).toBeVisible();
    await w.menuItem("Regenerate the weekend").click();

    await expect(w.dialogTitle()).toHaveText("Regenerate the weekend?");
    await expect(w.dialogBody().locator(".well__title")).toHaveText("Keeping");
    await expect(w.dialogBody().locator(".well__body")).toContainText(/Swim/);
    await w.dialogAction("Cancel").click();
    await expect(w.dialog()).toHaveCount(0);
  });

  test("Regenerate Saturday confirms (D4) and reseats the day", async ({ page, pages }) => {
    const w = pages.weekend;
    await w.regenerateDayButton("Saturday").click();
    await expect(w.dialogTitle()).toHaveText("Regenerate Saturday?");
    await expect(w.dialogSubtitle()).toHaveText("Sunday will not change.");

    const regenerated = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/days\/[^/]+\/regenerate/.test(r.url()));
    await w.dialogAction("Regenerate Saturday").click();
    expect((await regenerated).ok()).toBeTruthy();
    await w.waitForPlan();
    await expect(w.block("Swim lessons", "Saturday")).toBeVisible();
  });

  test("nav marks Weekend as current", async ({ pages }) => {
    const w = pages.weekend;
    await expect(w.activeNavLink()).toHaveCount(1);
    await expect(w.activeNavLink()).toHaveAttribute("data-nav", "weekend");
    await expect(w.body).toHaveAttribute("data-page", "weekend");
    await expect(w.body).toHaveAttribute("data-shell", "app");
  });
});
