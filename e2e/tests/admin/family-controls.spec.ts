import { test, expect } from "../../fixtures/sd-test.js";
import { apiLogin, registerUser, SEEDED_ADMIN } from "../../fixtures/auth.js";

/**
 * Family weekend controls (A9, L2-160, L2-161): an administrator locks, swaps
 * and regenerates a family's weekend with the family's own controls, and every
 * change appears in the Changes section. Each test registers a throwaway family
 * so the seeded household stays untouched.
 */

async function openFreshFamily(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  pages: Parameters<Parameters<typeof test>[2]>[0]["pages"],
): Promise<{ email: string; password: string }> {
  const creds = await registerUser(request, "e2e-controls");
  const family = await apiLogin(request, creds);
  const planned = await request.get("http://localhost:5100/api/weekends/current", {
    headers: { Authorization: `Bearer ${family.accessToken}` },
  });
  expect(planned.ok()).toBeTruthy();
  await page.goto(`/families?q=${encodeURIComponent(creds.email)}`);
  const list = pages.adminFamilies;
  await list.waitForScreen("families");
  await list.rowLink(list.row("Unnamed family")).click();
  await pages.adminFamily.waitForPlan();
  return creds;
}

test.describe("Admin family weekend controls", () => {
  test("locks a block, the family sees it, and the Changes section records it", async ({ page, request, goto, pages }) => {
    // Traces to: L2-160 AC2, AC5, L2-161 AC4
    await goto("adminFamilies");
    const creds = await openFreshFamily(page, request, pages);
    const a = pages.adminFamily;
    await expect(a.noChanges()).toHaveText("No changes yet");

    const block = a.actionableBlocks("Saturday").first();
    const title = (await a.blockTitle(block).textContent())!.trim();
    const locked = page.waitForResponse((r) => /\/blocks\/[^/]+\/lock$/.test(r.url()) && r.request().method() === "PUT");
    await a.lockButton(block).click();
    expect((await locked).status()).toBe(200);
    await expect(a.lockButton(a.block(title, "Saturday"))).toHaveAttribute("aria-pressed", "true");
    await expect(a.blockChips(a.block(title, "Saturday"))).toContainText(["Locked"]);

    const row = a.changeRows().first();
    await expect(a.changeWho(row)).toHaveText(SEEDED_ADMIN.email);
    await expect(a.changeAction(row)).toHaveText(/Lock/);
    await expect(a.changeSummary(row)).toContainText(title);

    const family = await apiLogin(request, creds);
    const theirs = await request.get("http://localhost:5100/api/weekends/current", {
      headers: { Authorization: `Bearer ${family.accessToken}` },
    });
    const blocks = ((await theirs.json()) as { blocks: { title: string; isLocked: boolean }[] }).blocks;
    expect(blocks.find((b) => b.title === title)?.isLocked).toBe(true);
  });

  test("swaps a block with exactly one request and logs the swap", async ({ page, request, goto, pages }) => {
    // Traces to: L2-160 AC5, L2-161 AC1
    await goto("adminFamilies");
    await openFreshFamily(page, request, pages);
    const a = pages.adminFamily;
    const block = a.actionableBlocks("Saturday").filter({ has: page.locator('[aria-label^="Swap "]') }).first();
    const before = (await a.blockTitle(block).textContent())!.trim();
    const swaps: string[] = [];
    page.on("request", (req) => {
      if (/\/swap$/.test(req.url()) && req.method() === "POST") swaps.push(req.url());
    });
    const swapped = page.waitForResponse((r) => /\/swap$/.test(r.url()));
    await a.swapButton(block).click();
    expect((await swapped).status()).toBe(200);
    expect(swaps).toHaveLength(1);
    await expect(a.changeAction(a.changeRows().first())).toHaveText("Swap");
    await expect(a.changeSummary(a.changeRows().first())).toContainText(before);
  });

  test("Why this opens the block details with the planner's reason, Swap and Lock", async ({ page, request, goto, pages }) => {
    // Traces to: L2-160
    await goto("adminFamilies");
    await openFreshFamily(page, request, pages);
    const a = pages.adminFamily;
    const block = a.actionableBlocks("Saturday").first();
    const title = (await a.blockTitle(block).textContent())!.trim();
    await a.whyButton(block).click();
    await expect(a.dialogTitle()).toHaveText(title);
    await expect(a.dialogBody().locator(".well__title")).toContainText("Why this");
    await expect(a.dialogAction(/Lock this block|Unlock/)).toBeVisible();
    await a.dialogAction(/Lock this block/).click();
    await expect(a.dialog()).toHaveCount(0);
    await expect(a.lockButton(a.block(title, "Saturday"))).toHaveAttribute("aria-pressed", "true");
  });

  test("Regenerate Saturday confirms in AD7 and leaves Sunday alone", async ({ page, request, goto, pages }) => {
    // Traces to: L2-160 AC6, L2-161 AC4
    await goto("adminFamilies");
    await openFreshFamily(page, request, pages);
    const a = pages.adminFamily;
    await a.dayTab("Sunday").click();
    const sundayTitles = await a.blocks("Sunday").locator(".block__title").allTextContents();
    await a.dayTab("Saturday").click();

    await a.regenerateDayButton("Saturday").click();
    await expect(a.dialogTitle()).toHaveText("Regenerate Saturday?");
    await expect(a.dialogBody().locator(".well__title")).toContainText("Keeping");
    await a.dialogAction("Cancel").click();
    await expect(a.dialog()).toHaveCount(0);

    const regenerates: string[] = [];
    page.on("request", (req) => {
      if (/\/days\/saturday\/regenerate$/.test(req.url())) regenerates.push(req.url());
    });
    await a.regenerateDayButton("Saturday").click();
    const done = page.waitForResponse((r) => /\/days\/saturday\/regenerate$/.test(r.url()));
    await a.dialogAction("Regenerate Saturday").click();
    expect((await done).status()).toBe(200);
    expect(regenerates).toHaveLength(1);
    await a.waitForPlan();
    await expect(a.changeAction(a.changeRows().first())).toHaveText("Regenerate");
    await expect(a.changeSummary(a.changeRows().first())).toContainText("Saturday");

    await a.dayTab("Sunday").click();
    expect(await a.blocks("Sunday").locator(".block__title").allTextContents()).toEqual(sundayTitles);
  });

  test("Lock day marks every block and the header action regenerates the weekend", async ({ page, request, goto, pages }) => {
    // Traces to: L2-160 AC1
    await goto("adminFamilies");
    await openFreshFamily(page, request, pages);
    const a = pages.adminFamily;
    const lockedDay = page.waitForResponse((r) => /\/days\/saturday\/lock$/.test(r.url()));
    await a.lockDayButton("Saturday").click();
    expect((await lockedDay).status()).toBe(200);
    await expect(a.lockDayButton("Saturday")).toHaveAttribute("aria-pressed", "true");
    const saturdayTitles = await a.blocks("Saturday").locator(".block__title").allTextContents();

    await a.regenerateWeekendButton().click();
    await expect(a.dialogTitle()).toHaveText(/^Regenerate .* weekend\?$/);
    const regenerated = page.waitForResponse((r) => /\/weekends\/[^/]+\/regenerate$/.test(r.url()));
    await a.dialogAction("Regenerate").click();
    expect((await regenerated).status()).toBe(200);
    await a.waitForPlan();
    expect(await a.blocks("Saturday").locator(".block__title").allTextContents()).toEqual(saturdayTitles);
    await expect(a.changeAction(a.changeRows().first())).toHaveText("Regenerate");
  });
});
