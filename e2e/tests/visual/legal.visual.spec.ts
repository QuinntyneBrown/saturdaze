import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Legal parity — pages/legal.html, Terms (default) and Privacy (`#privacy`).
 * Copy is fixed; only the "Last updated" line is masked.
 */

test.describe("Visual: Legal — Terms", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("legal");
    await pages.legal.waitForReady();
    await settle();
  });

  test("matches the mock @full-page", async ({ page, pages }) => {
    await expect(page).toHaveScreenshot("legal.terms.full.png", {
      fullPage: true,
      mask: [pages.legal.proseUpdated("terms")],
    });
  });

  test("document switch with Terms active", async ({ pages }) => {
    await expect(pages.legal.docSwitch).toHaveScreenshot("legal.doc-switch.terms.png");
  });

  test("Terms article", async ({ pages }) => {
    await expect(pages.legal.article("terms")).toHaveScreenshot("legal.terms.article.png", {
      mask: [pages.legal.proseUpdated("terms")],
    });
  });

  test("site footer", async ({ pages }) => {
    await expect(pages.legal.footer).toHaveScreenshot("legal.footer.png");
  });
});

test.describe("Visual: Legal — Privacy", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("legalPrivacy");
    await pages.legal.waitForReady();
    await settle();
  });

  test("matches the mock @full-page", async ({ page, pages }) => {
    await expect(page).toHaveScreenshot("legal.privacy.full.png", {
      fullPage: true,
      mask: [pages.legal.proseUpdated("privacy")],
    });
  });

  test("document switch with Privacy active", async ({ pages }) => {
    await expect(pages.legal.docSwitch).toHaveScreenshot("legal.doc-switch.privacy.png");
  });

  test("Privacy article", async ({ pages }) => {
    await expect(pages.legal.article("privacy")).toHaveScreenshot("legal.privacy.article.png", {
      mask: [pages.legal.proseUpdated("privacy")],
    });
  });
});
