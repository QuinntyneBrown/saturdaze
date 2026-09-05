import { test, expect } from "../../fixtures/sd-test.js";
import { DIALOG_SLUGS, DialogSlug } from "../../pages/dialogs.page.js";

/**
 * Dialog gallery parity — pages/dialogs.html ↔ `/dialogs` (dev only).
 *
 * Thirty specimens rendered statically inline from fixed fixtures. Every
 * dialog is a bottom sheet below 720px and a centred modal above, so two
 * viewports cover both layouts: mobile and desktop (tablet is skipped).
 * Dated subtitles and the share URL are the only runtime-looking text in
 * the fixtures and are masked in case the app's fixtures format them.
 */

const MASKS: Partial<Record<DialogSlug, string[]>> = {
  block: [".dialog__sub"],
  "block-locked": [".dialog__sub"],
  "block-commitment": [".dialog__sub"],
  rate: [".dialog__sub"],
  rename: [".dialog__sub"],
  share: [".copy-field__value"],
  calendar: [".dialog__sub", ".list__title", ".list__sub"],
};

test.describe("Visual: Dialogs", () => {
  test.beforeEach(async ({ goto, pages, settle }, testInfo) => {
    test.skip(testInfo.project.name === "tablet", "sheet (<720) and modal (≥720) layouts are covered by mobile + desktop");
    await goto("dialogs");
    await pages.dialogs.waitForReady();
    await settle();
  });

  for (const slug of DIALOG_SLUGS) {
    test(`#dialog-${slug} matches the mock`, async ({ pages }) => {
      const panel = pages.dialogs.panel(slug);
      await expect(panel).toHaveScreenshot(`dialog.${slug}.png`, {
        mask: (MASKS[slug] ?? []).map((sel) => panel.locator(sel)),
      });
    });
  }
});
