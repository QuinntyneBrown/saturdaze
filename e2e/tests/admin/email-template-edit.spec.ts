// Acceptance Test
// Traces to: L2-127
// Description: A9 edits a template's content, keeps Save disabled until something changed, shows refusals, and offers a reload when someone else saved first.
import { test, expect } from "../../fixtures/sd-test.js";
import { createTemplate, saveSubjectOutOfBand } from "../../fixtures/email-templates.js";

test.describe("Admin email template editor", () => {
  test("saving a changed subject bumps the version and disables Save again", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-127 AC1, AC7
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");
    await expect(a.meta()).toContainText("version 1");
    await expect(a.saveButton()).toBeDisabled();

    await a.field("Subject").fill("Your weekend is planned");
    await expect(a.statusChips()).toContainText(["Unsaved changes"]);
    await expect(a.saveButton()).toBeEnabled();
    await a.saveButton().click();

    await expect(a.meta()).toContainText("version 2");
    await expect(a.saveButton()).toBeDisabled();
    await expect(a.statusChips()).not.toContainText(["Unsaved changes"]);
    await page.reload();
    await a.waitForScreen("email");
    await expect(a.field("Subject")).toHaveValue("Your weekend is planned");
  });

  test("a script in the HTML body is refused with an explanation", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-127 AC3, AC7
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");
    await a.field("HTML body").fill("<p>Hi</p><script>alert(1)</script>");
    await a.saveButton().click();
    await expect(a.alert()).toHaveText(
      "Scripts, frames, forms, on… event attributes and the raw filter aren't allowed in an email. Remove them and save again.",
    );
    await expect(a.meta()).toContainText("version 1");
  });

  test("a stale copy says someone else changed the template and reloads theirs", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-127 AC2, AC7
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");

    await saveSubjectOutOfBand(request, admin, t.id, "Changed elsewhere");
    await a.field("Subject").fill("Changed here");
    await a.saveButton().click();
    await expect(a.alert()).toContainText("Someone else changed this template.");

    await a.reloadButton().click();
    await expect(a.field("Subject")).toHaveValue("Changed elsewhere");
    await expect(a.meta()).toContainText("version 2");
    await expect(a.alert()).toHaveCount(0);
  });

  test("sample data is one JSON object saved with the template", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-127 AC7, L2-124
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");

    await a.field("Subject").fill("{{ giftCode }} for {{ recipientName }}");
    await a.fillSampleData({ giftCode: "SPRING-25", ideas: [{ name: "Kite day" }] });
    await a.saveButton().click();
    await expect(a.meta()).toContainText("version 2");

    await page.reload();
    await a.waitForScreen("email");
    expect(await a.sampleDataValue()).toEqual({ giftCode: "SPRING-25", ideas: [{ name: "Kite day" }] });
  });

  test("sample data that is not a JSON object is flagged and nothing is sent", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-127 AC8
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");

    await expect(a.previewSubject()).not.toHaveText("");
    const previews = a.countPreviewRequests();
    await a.sampleData().fill('{ "giftCode": ');
    await expect(a.sampleDataError()).toHaveText("Sample data must be a JSON object");
    await expect(a.saveButton()).toBeDisabled();
    await a.field("Subject").fill("Your code {{ giftCode }}");
    await page.waitForTimeout(1_000);
    expect(previews()).toBe(0);

    await a.sampleData().fill('["SPRING-25"]');
    await expect(a.sampleDataError()).toHaveText("Sample data must be a JSON object");

    await a.fillSampleData({ giftCode: "SPRING-25" });
    await expect(a.sampleDataError()).toHaveCount(0);
    await expect(a.saveButton()).toBeEnabled();
    await expect(a.previewSubject()).toHaveText("Your code SPRING-25", { timeout: 1_000 });
  });

  test("invalid Liquid is refused naming the field and position", async ({ page, request, signInAsAdmin, pages }) => {
    // Traces to: L2-127 AC4, L2-131 AC1
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    const a = pages.adminEmail;
    await a.waitForScreen("email");

    await a.field("Subject").fill("Hi {{ first name }}");
    await a.saveButton().click();
    await expect(a.alert()).toHaveText(/^Subject: .* at \(1:\d+\)$/);
    await expect(a.meta()).toContainText("version 1");
  });

  test("a system template explains why it stays active and keeps its link", async ({ goto, pages }) => {
    // Traces to: L2-127 AC5
    await goto("adminEmails");
    const list = pages.adminEmails;
    await list.waitForScreen("emails");
    await list.rowLink(list.row("Reset your password")).click();
    const a = pages.adminEmail;
    await a.waitForScreen("email");
    await expect(a.note()).toContainText("{{resetLink}}");
  });
});
