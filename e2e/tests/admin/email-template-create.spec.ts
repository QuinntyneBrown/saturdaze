// Acceptance Test
// Traces to: L2-132
// Description: AD7 creates a draft from A8 with a key suggested from the name, refuses a taken key, and duplicates a template from A9.
import { test, expect } from "../../fixtures/sd-test.js";

const stamp = () => Date.now().toString(36);

test.describe("Admin new email template", () => {
  test("New template suggests the key from the name and opens the new draft's editor", async ({ page, goto, pages }) => {
    // Traces to: L2-132 AC1, AC5
    await goto("adminEmails");
    const list = pages.adminEmails;
    await list.waitForScreen("emails");
    await list.newTemplateButton().click();
    await expect(list.dialogTitle()).toHaveText("New email template");

    const id = stamp();
    await list.templateNameInput().fill(`Birthday wishes ${id}`);
    await expect(list.templateKeyInput()).toHaveValue(`birthday-wishes-${id}`);
    await list.templateCategorySelect().selectOption({ label: "Special occasion" });
    await list.dialogAction("Create template").click();
    await expect(list.dialog()).toHaveCount(0);

    await page.waitForURL(/\/email-templates\/[0-9a-f-]{36}$/);
    const editor = pages.adminEmail;
    await editor.waitForScreen("email");
    await expect(editor.pageTitle()).toHaveText(`Birthday wishes ${id}`);
    await expect(editor.statusChips().first()).toHaveText("Draft");
    await expect(editor.meta()).toContainText(`birthday-wishes-${id} · Special occasion · version 1`);
    await expect(editor.activeAdminNavLink()).toHaveAttribute("data-nav", "emails");
  });

  test("a key that is taken is refused in the dialog", async ({ goto, pages }) => {
    // Traces to: L2-132 AC4
    await goto("adminEmails");
    const list = pages.adminEmails;
    await list.waitForScreen("emails");
    await list.newTemplateButton().click();
    await list.templateNameInput().fill("Another reset");
    await list.templateKeyInput().fill("account.password-reset");
    await list.dialogAction("Create template").click();
    await expect(list.dialogAlert()).toHaveText("A template already uses this key. Choose another.");
    await expect(list.dialog()).toHaveCount(1);
  });

  test("Duplicate copies a template into a new draft with the category fixed", async ({ page, goto, pages }) => {
    // Traces to: L2-132 AC3, AC5
    await goto("adminEmails");
    const list = pages.adminEmails;
    await list.waitForScreen("emails");
    await list.rowLink(list.row("Verify your email")).click();
    const editor = pages.adminEmail;
    await editor.waitForScreen("email");
    await expect(editor.statusChips()).toContainText(["Active", "System"]);

    await editor.action("Duplicate").click();
    await expect(editor.dialogTitle()).toHaveText("Duplicate template");
    await expect(editor.templateNameInput()).toHaveValue("Copy of Verify your email");
    await expect(editor.templateCategorySelect()).toHaveValue("Account");
    await expect(editor.templateCategorySelect()).toBeDisabled();
    const key = `account.verify-copy-${stamp()}`;
    await editor.templateKeyInput().fill(key);
    await editor.dialogAction("Create template").click();

    await expect(editor.dialog()).toHaveCount(0);
    await page.waitForURL(/\/email-templates\/[0-9a-f-]{36}$/);
    await editor.waitForScreen("email");
    await expect(editor.pageTitle()).toHaveText("Copy of Verify your email");
    await expect(editor.meta()).toContainText(`${key} · Account · version 1`);
    await expect(editor.statusChips()).toHaveText(["Draft"]);
  });
});
