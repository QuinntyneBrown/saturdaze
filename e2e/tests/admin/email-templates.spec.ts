// Acceptance Test
// Traces to: L2-131
// Description: the Email templates screen lists templates with their chips, filters by category and search, and keeps the filters in the URL.
import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Email templates (A8, L2-131). The seed always carries the two system
 * templates, so they anchor the assertions; other tests may add drafts.
 */

test.describe("Admin email templates", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("adminEmails");
    await pages.adminEmails.waitForScreen("emails");
  });

  test("lists the system templates with their category, status and system chips", async ({ pages }) => {
    // Traces to: L2-131 AC4
    const a = pages.adminEmails;
    await expect(a.pageTitle()).toHaveText("Email templates");
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "emails");
    await expect(a.activeAdminNavLink()).toHaveAttribute("aria-current", "page");
    for (const [name, key] of [
      ["Verify your email", "account.verify-email"],
      ["Reset your password", "account.password-reset"],
    ] as const) {
      const row = a.row(name);
      await expect(row).toHaveCount(1);
      await expect(a.rowKey(row)).toHaveText(key);
      await expect(a.rowChips(row)).toHaveText(["Account", "Active", "System"]);
      await expect(a.rowUpdated(row)).toHaveText(/^Updated \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC by .+$/);
      await expect(a.rowLink(row)).toHaveAttribute("href", /\/email-templates\/[0-9a-f-]{36}$/);
    }
  });

  test("the category filter narrows the list and lives in the URL", async ({ page, pages }) => {
    // Traces to: L2-131 AC5
    const a = pages.adminEmails;
    await a.categorySelect().selectOption({ label: "Account" });
    await expect.poll(() => new URL(page.url()).searchParams.get("category")).toBe("Account");
    await expect(a.row("Verify your email")).toHaveCount(1);
    await expect(a.row("Reset your password")).toHaveCount(1);
    await expect.poll(async () => (await a.rowCategories()).every((c) => c.trim() === "Account")).toBe(true);
    await expect(a.count()).toHaveText(`${await a.rows().count()} templates`);

    await a.categorySelect().selectOption({ label: "Marketing" });
    await expect.poll(() => new URL(page.url()).searchParams.get("category")).toBe("Marketing");
    await expect.poll(async () => (await a.rowCategories()).every((c) => c.trim() === "Marketing")).toBe(true);

    await page.goto("/email-templates?category=Account&status=Active");
    await a.waitForScreen("emails");
    await expect(a.categorySelect()).toHaveValue("Account");
    await expect(a.statusSelect()).toHaveValue("Active");
    await expect(a.row("Reset your password")).toHaveCount(1);
    await expect.poll(async () => (await a.rowCategories()).every((c) => c.trim() === "Account")).toBe(true);
  });

  test("search matches name, key or subject and says when nothing matches", async ({ page, pages }) => {
    // Traces to: L2-131 AC2, AC5
    const a = pages.adminEmails;
    await a.searchInput().fill("password-reset");
    await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("password-reset");
    await expect(a.rowByKey("account.password-reset")).toHaveCount(1);
    for (const key of await a.rowKey(a.rows()).allTextContents()) expect(key).toContain("password-reset");
    await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("password-reset");

    await a.searchInput().fill("zz-no-such-template");
    await expect(a.emptyTitle()).toHaveText("No templates match");
    await expect(a.rows()).toHaveCount(0);
  });

  test("rows stack at 390px without horizontal scroll", async ({ page, pages }) => {
    // Traces to: L2-131 AC6
    await page.setViewportSize({ width: 390, height: 844 });
    const a = pages.adminEmails;
    await expect(a.row("Verify your email")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
});
