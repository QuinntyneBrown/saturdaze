// Acceptance Test
// Traces to: L2-130
// Description: AD9 lists a template's revisions newest first, and loading an older one puts it in the editor unsaved so saving makes it the next version.
import { test, expect } from "../../fixtures/sd-test.js";
import { createTemplate, saveSubjectOutOfBand } from "../../fixtures/email-templates.js";
import { SEEDED_ADMIN } from "../../fixtures/auth.js";

test.describe("Admin email template history", () => {
  test("History lists the revisions and loads an old one into the editor", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-130 AC1, AC4
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await saveSubjectOutOfBand(request, admin, t.id, "Second subject");
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");
    await expect(a.field("Subject")).toHaveValue("Second subject");

    await a.action("History").click();
    await expect(a.dialogTitle()).toHaveText("History");
    await expect(a.revisions()).toHaveCount(2);
    const meta = /^v(\d) · (Create|Edit|Status) · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC · (.+)$/;
    await expect(a.revisionMeta(a.revisions().nth(0))).toHaveText(meta);
    await expect(a.revisionMeta(a.revisions().nth(0))).toContainText(`v2 · Edit`);
    await expect(a.revisionMeta(a.revisions().nth(0))).toContainText(SEEDED_ADMIN.email);
    await expect(a.revisionSubject(a.revisions().nth(0))).toHaveText("Second subject");
    await expect(a.revisionMeta(a.revisions().nth(1))).toContainText("v1 · Create");
    const firstSubject = (await a.revisionSubject(a.revisions().nth(1)).textContent())!.trim();

    await a.loadRevisionButton(1).click();
    await expect(a.dialog()).toHaveCount(0);
    await expect(a.field("Subject")).toHaveValue(firstSubject);
    await expect(a.statusChips()).toContainText(["Unsaved changes"]);
    await expect(a.saveButton()).toBeEnabled();
    await expect(a.meta()).toContainText("version 2");

    await a.saveButton().click();
    await expect(a.meta()).toContainText("version 3");
    await a.action("History").click();
    await expect(a.revisions()).toHaveCount(3);
    await expect(a.revisionMeta(a.revisions().first())).toContainText("v3 · Edit");
    await expect(a.revisionSubject(a.revisions().first())).toHaveText(firstSubject);
  });
});
