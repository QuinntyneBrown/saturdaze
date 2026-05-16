import { test, expect } from "../fixtures/sd-test.js";

test.describe("Dialogs & sheets gallery", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("dialogs");
    await pages.dialogs.waitForComponentsReady();
  });

  test("gallery heading renders", async ({ pages }) => {
    await expect(pages.dialogs.galleryHeading()).toBeVisible();
  });

  test("every documented dialog is open and static", async ({ pages }) => {
    const expected = [
      "Terre Bleu Lavender Farm",
      "Regenerate the weekend?",
      "Swap out Lavender Farm?",
      "Who's in for La Marina?",
      "Add a commitment",
      "Slot in an errand",
      "Your weekend is ready 🌤",
      "Send Sara the plan?",
    ];
    await expect(pages.dialogs.allDialogs()).toHaveCount(expected.length);
    for (const title of expected) {
      await expect(pages.dialogs.dialog(title)).toBeVisible();
      await expect(pages.dialogs.dialog(title)).toHaveAttribute("open", "");
      await expect(pages.dialogs.dialog(title)).toHaveAttribute("static", "");
    }
  });

  test("block-detail dialog shows 'Why I picked this' and two alternatives", async ({ pages }) => {
    const dialog = pages.dialogs.blockDetailDialog();
    await expect(dialog).toContainText("Why I picked this");
    await expect(
      dialog.locator('sd-list-item[title="Bronte Creek Park"]')
    ).toBeVisible();
    await expect(
      dialog.locator('sd-list-item[title="Royal Botanical Gardens"]')
    ).toBeVisible();
    await expect(dialog.locator("sd-button")).toHaveCount(2);
  });

  test("regenerate dialog lists the locked anchors", async ({ pages }) => {
    const dialog = pages.dialogs.regenerateDialog();
    await expect(dialog).toContainText("Keeping these locked");
    await expect(dialog).toContainText(
      /Swim 9am · Church 10:30am · Workout 5pm · Bath 8pm/
    );
  });

  test("swap dialog lists four alternatives", async ({ pages }) => {
    const dialog = pages.dialogs.swapDialog();
    await expect(dialog.locator("sd-list-item")).toHaveCount(4);
  });

  test("vote dialog renders four vote rows with the right vote attribute", async ({ pages }) => {
    const dialog = pages.dialogs.voteDialog();
    await expect(dialog.locator("sd-vote-row")).toHaveCount(4);
    await expect(dialog.locator('sd-vote-row[name="Mae"]')).toHaveAttribute(
      "vote",
      "none"
    );
  });

  test("add-commitment dialog has form fields and a 'Lock by default' toggle (checked)", async ({ pages }) => {
    const dialog = pages.dialogs.addCommitmentDialog();
    await expect(dialog.locator("sd-text-input")).toHaveCount(4);
    await expect(dialog.locator("sd-toggle")).toHaveAttribute("checked", "");
  });

  test("errand dialog shows the 'Best fit: Sunday 9:15am' callout", async ({ pages }) => {
    await expect(pages.dialogs.errandDialog()).toContainText(
      /Best fit: Sunday 9:15am/
    );
  });

  test("friday-preview dialog shows both day rows", async ({ pages }) => {
    const dialog = pages.dialogs.fridayPreviewDialog();
    await expect(dialog.locator("sd-card")).toHaveCount(2);
  });

  test("share dialog shows Sara's row with default chip", async ({ pages }) => {
    const dialog = pages.dialogs.shareDialog();
    await expect(dialog.locator('sd-list-item[title="Sara · Browns family"]')).toBeVisible();
    await expect(dialog.locator('sd-chip[tone="accent"]')).toContainText(
      "Default"
    );
  });
});
