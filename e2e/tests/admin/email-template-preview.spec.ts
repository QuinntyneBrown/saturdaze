// Acceptance Test
// Traces to: L2-134
// Description: A9's preview renders unsaved Liquid edits with sample data in a sandboxed frame, at desktop and phone widths and as plain text, and flags placeholders without a sample.
import { test, expect } from "../../fixtures/sd-test.js";
import { createTemplate } from "../../fixtures/email-templates.js";

test.describe("Admin email template preview", () => {
  test.beforeEach(async ({ page, request, signInAsAdmin, pages }) => {
    const admin = (await signInAsAdmin())!;
    const t = await createTemplate(request, admin);
    await page.goto(`/email-templates/${t.id}`);
    await pages.adminEmail.waitForScreen("email");
  });

  test("edits show in the preview within a second, without a save", async ({ pages }) => {
    // Traces to: L2-134 AC1, AC4
    const a = pages.adminEmail;
    await a.field("Subject").fill("Hello {{recipientName}}");
    await expect(a.previewSubject()).toHaveText("Hello Alex", { timeout: 1_000 });
    await a.field("Preheader").fill("Plans for {{weekendDates}}");
    await a.fillSampleData({ weekendDates: "11 and 12 October" });
    await expect(a.previewPreheader()).toHaveText("Plans for 11 and 12 October", { timeout: 1_000 });

    await a.field("HTML body").fill("<h1>Hi {{recipientName}}</h1><p>{{note}}</p>");
    await a.fillSampleData({ weekendDates: "11 and 12 October", note: "<b>bold</b>" });
    await expect(a.previewBody()).toContainText("Hi Alex", { timeout: 1_000 });
    await expect(a.previewBody()).toContainText("<b>bold</b>");
    await expect(a.previewBody().locator("b")).toHaveCount(0);
    await expect(a.meta()).toContainText("version 1");
  });

  test("the frame is sandboxed, switches to phone width and to plain text", async ({ pages }) => {
    // Traces to: L2-134 AC5
    const a = pages.adminEmail;
    const sandbox = await a.previewFrame().getAttribute("sandbox");
    expect(sandbox).not.toBeNull();
    expect(sandbox).not.toContain("allow-scripts");
    expect(sandbox).not.toContain("allow-same-origin");

    await expect(a.previewOption("Desktop")).toBeChecked();
    const desktop = (await a.previewFrame().boundingBox())!.width;
    expect(desktop).toBeGreaterThan(375);
    expect(desktop).toBeLessThanOrEqual(600);

    await a.previewOption("Phone").check();
    await expect.poll(async () => Math.round((await a.previewFrame().boundingBox())!.width)).toBe(375);

    await a.field("Plain-text body").fill("Hi {{recipientName}}, see {{appUrl}}");
    await a.previewOption("Plain text").check();
    await expect(a.previewFrame()).toHaveCount(0);
    await expect(a.previewText()).toHaveText(/^Hi Alex, see https?:\/\/\S+$/);
  });

  test("a placeholder with no sample value is flagged", async ({ pages }) => {
    // Traces to: L2-134 AC3, AC6
    const a = pages.adminEmail;
    await a.field("Subject").fill("Your code {{giftCode}} from {{appName}}");
    await expect(a.previewPlaceholder("giftCode")).toContainText("No sample value");
    await expect(a.previewPlaceholder("appName")).toContainText("Built-in");
    await a.fillSampleData({ giftCode: "SPRING-25" });
    await expect(a.previewPlaceholder("giftCode")).toContainText("Sample");
    await expect(a.previewSubject()).toHaveText("Your code SPRING-25 from Saturdaze");
  });

  test("conditions, loops and filters render from JSON sample data", async ({ pages }) => {
    // Traces to: L2-134 AC7
    const a = pages.adminEmail;
    await a.field("HTML body").fill(
      "{% if vip %}<b>VIP</b>{% endif %}<ul>{% for idea in ideas %}<li>{{ idea.name | upcase }}</li>{% endfor %}</ul>",
    );
    await a.fillSampleData({ vip: true, ideas: [{ name: "Kite day" }, { name: "Pier walk" }] });
    await expect(a.previewElements("b")).toHaveText("VIP", { timeout: 1_000 });
    await expect(a.previewElements("li")).toHaveText(["KITE DAY", "PIER WALK"]);
    await expect(a.previewPlaceholder("ideas")).toContainText("Sample");
    await expect(a.previewPlaceholder("idea")).toHaveCount(0);
  });
});
