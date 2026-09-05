import { test, expect, isPhone } from "../../fixtures/sd-test.js";

/**
 * Shell chrome parity — THE P4 ENTRY GATE.
 *
 * The top bar (≥720px) and bottom nav (<720px) appear on every app screen,
 * and the sitebar on every public screen. If these three regions are not
 * pixel-identical to docs/mocks-v2, nothing downstream can be: every
 * component-level baseline shares their tokens, fonts and host-element
 * box model. Run this spec first against the app; fix in the components.
 *
 * Baselines: `npm run baseline` (SD_BASELINE=1 → docs/mocks-v2 on :5173).
 */

test.describe("Visual: shell", () => {
  test("top bar with Weekend active", async ({ goto, pages, settle }, testInfo) => {
    test.skip(isPhone(testInfo), ".topbar is display:none below 720px");
    await goto("weekend");
    await pages.weekend.waitForReady();
    await settle();
    await expect(pages.weekend.topbar).toHaveScreenshot("shell.topbar.weekend.png");
  });

  test("top bar with Family active", async ({ goto, pages, settle }, testInfo) => {
    test.skip(isPhone(testInfo), ".topbar is display:none below 720px");
    await goto("family");
    await pages.family.waitForReady();
    await settle();
    await expect(pages.family.topbar).toHaveScreenshot("shell.topbar.family.png");
  });

  test("bottom nav with Weekend active", async ({ goto, pages, settle }, testInfo) => {
    test.skip(!isPhone(testInfo), ".bottom-nav is display:none at 720px and above");
    await goto("weekend");
    await pages.weekend.waitForReady();
    await settle();
    await expect(pages.weekend.bottomNav).toHaveScreenshot("shell.bottom-nav.weekend.png");
  });

  test("bottom nav with Family active", async ({ goto, pages, settle }, testInfo) => {
    test.skip(!isPhone(testInfo), ".bottom-nav is display:none at 720px and above");
    await goto("family");
    await pages.family.waitForReady();
    await settle();
    await expect(pages.family.bottomNav).toHaveScreenshot("shell.bottom-nav.family.png");
  });

  test("site bar on the landing page", async ({ goto, pages, settle }) => {
    await goto("landing");
    await pages.landing.waitForReady();
    await settle();
    await expect(pages.landing.sitebar).toHaveScreenshot("shell.sitebar.landing.png");
  });

  test("site bar on the legal page (no account CTA)", async ({ goto, pages, settle }) => {
    await goto("legal");
    await pages.legal.waitForReady();
    await settle();
    await expect(pages.legal.sitebar).toHaveScreenshot("shell.sitebar.legal.png");
  });
});
