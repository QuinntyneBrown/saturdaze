// Acceptance Test
// Traces to: L2-129
// Description: A9 activates, archives and restores a template, never offers Archive or Delete on a system template, and deletes through AD8.
import { test, expect } from "../../fixtures/sd-test.js";
import { createTemplate } from "../../fixtures/email-templates.js";

test.describe("Admin email template lifecycle", () => {
  test("a draft is activated, archived and restored as a draft", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-129 AC1, AC3, AC5
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");
    await expect(a.statusChips().first()).toHaveText("Draft");
    await expect(a.action("Archive")).toHaveCount(0);

    await a.action("Activate").click();
    await expect(a.statusChips().first()).toHaveText("Active");
    await expect(a.meta()).toContainText("version 2");
    await expect(a.action("Activate")).toHaveCount(0);

    await a.action("Archive").click();
    await expect(a.statusChips().first()).toHaveText("Archived");
    await expect(a.action("Archive")).toHaveCount(0);

    await a.action("Restore as draft").click();
    await expect(a.statusChips().first()).toHaveText("Draft");
    await expect(a.meta()).toContainText("version 4");
    await expect(a.action("Activate")).toBeVisible();
  });

  test("a system template offers neither Archive nor Delete", async ({ goto, pages }) => {
    // Traces to: L2-129 AC6
    await goto("adminEmails");
    const list = pages.adminEmails;
    await list.waitForScreen("emails");
    await list.rowLink(list.row("Verify your email")).click();
    const a = pages.adminEmail;
    await a.waitForScreen("email");
    await expect(a.statusChips()).toContainText(["Active", "System"]);
    await expect(a.action("Save changes")).toBeVisible();
    await expect(a.action("Archive")).toHaveCount(0);
    await expect(a.action("Delete")).toHaveCount(0);
    await expect(a.action("Activate")).toHaveCount(0);
  });

  test("Delete confirms in AD8, sends one request and returns to the list", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-129 AC4, AC7
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin, { name: `Delete me ${Date.now().toString(36)}` });
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");

    const deletes: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "DELETE" && r.url().includes("/api/admin/email-templates/")) deletes.push(r.url());
    });

    await a.action("Delete").click();
    await expect(a.dialogTitle()).toHaveText(`Delete "${t.name}"?`);
    await expect(a.dialogSubtitle()).toContainText(t.key);
    await a.dialogAction("Cancel").click();
    await expect(a.dialog()).toHaveCount(0);
    expect(deletes).toHaveLength(0);

    await a.action("Delete").click();
    await a.dialogAction("Delete template").click();
    await page.waitForURL(/\/email-templates$/);
    const list = pages.adminEmails;
    await list.waitForScreen("emails");
    await expect(list.rowByKey(t.key)).toHaveCount(0);
    expect(deletes).toHaveLength(1);
  });
});
