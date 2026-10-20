import { test, expect } from "../../fixtures/sd-test.js";
import { SEEDED_ADMIN, SEEDED_USER } from "../../fixtures/auth.js";

/**
 * Families (A8, L2-157, L2-162): every family with who signs in and whether the
 * upcoming weekend is planned, searchable, each row opening the family's weekend.
 * The seeded household is "The Browns" with the seeded user and administrator.
 */

test.describe("Admin families", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("adminFamilies");
    await pages.adminFamilies.waitForScreen("families");
  });

  test("lists the seeded family with its members, accounts and upcoming chip, with Families current", async ({ pages }) => {
    // Traces to: L2-157 AC5, L2-162 AC1
    const a = pages.adminFamilies;
    await expect(a.pageTitle()).toHaveText("Families");
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "families");
    await expect(a.adminNavLink("families")).toHaveText("Families");

    const row = a.row("The Browns");
    await expect(row).toBeVisible();
    await expect(a.rowMeta(row)).toHaveText(/^4 members · 2 accounts · Port Credit/);
    await expect(a.rowAccounts(row)).toContainText(SEEDED_USER.email);
    await expect(a.rowAccounts(row)).toContainText(SEEDED_ADMIN.email);
    await expect(a.rowFlags(row).first()).toHaveText(/^\s*(Planned · \d+ blocks|Not planned)\s*$/);
    await expect(a.rowLink(row)).toHaveAttribute("href", /\/families\/[0-9a-f-]{36}$/);
    await expect(a.count()).toHaveText(/^\d+ famil(y|ies)$/);
    await expect(a.pagerText()).toHaveText(/^1 to \d+ of \d+$/);
  });

  test("search narrows the list and writes q to the URL", async ({ page, pages }) => {
    // Traces to: L2-157 AC2, AC5
    const a = pages.adminFamilies;
    await a.searchInput().fill(SEEDED_ADMIN.email);
    await expect(a.row("The Browns")).toBeVisible();
    await expect(a.rows()).toHaveCount(1);
    await expect(a.count()).toHaveText("1 family");
    await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe(SEEDED_ADMIN.email);

    await page.goto("/families?q=no-such-family-anywhere");
    await a.waitForScreen("families");
    await expect(a.emptyTitle()).toHaveText("No families match");
  });

  for (const [width, chrome] of [
    [390, "bar"],
    [820, "bar"],
    [1024, "side"],
    [1440, "side"],
  ] as const) {
    test(`shows the ${chrome} navigation at ${width}px with no horizontal overflow`, async ({ page, goto, pages }) => {
      // Traces to: L2-162 AC2
      await page.setViewportSize({ width, height: 900 });
      await goto("adminFamilies");
      const a = pages.adminFamilies;
      await a.waitForScreen("families");
      await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "families");
      if (chrome === "side") await expect(a.adminNavEmail()).toBeVisible();
      else await expect(a.adminNavEmail()).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
});
