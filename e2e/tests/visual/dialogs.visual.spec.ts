import { test, expect } from "../../fixtures/sd-test.js";

test.describe("Visual: Dialogs", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("dialogs");
    await pages.dialogs.waitForComponentsReady();
    await settle();
  });

  const dialogs = [
    ["block-detail", "Terre Bleu Lavender Farm"],
    ["regenerate", "Regenerate the weekend?"],
    ["swap", "Swap out Lavender Farm?"],
    ["vote", "Who's in for La Marina?"],
    ["add-commitment", "Add a commitment"],
    ["errand", "Slot in an errand"],
    ["friday-preview", "Your weekend is ready 🌤"],
    ["share", "Send Sara the plan?"],
  ] as const;

  for (const [slug, title] of dialogs) {
    test(`${slug} dialog matches the mock`, async ({ pages }) => {
      await expect(pages.dialogs.dialog(title)).toHaveScreenshot(
        `dialog.${slug}.png`
      );
    });
  }
});
