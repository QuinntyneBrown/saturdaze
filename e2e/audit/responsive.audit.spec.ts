import * as path from "node:path";
import { test, expect } from "../fixtures/sd-test.js";
import { isBaseline, RouteKey } from "../fixtures/routes.js";
import { measureHorizontalOverflow } from "../fixtures/overflow.js";
import { ANON_ROUTES, AUTHED_ROUTES, auditable } from "../fixtures/audit-routes.js";
import { AUTH_STATE, AUDIT_OUTPUT_DIR } from "./constants.js";

/**
 * Responsive audit — every screen × five viewports (xsmall → xlarge).
 *
 * Runs under `playwright.audit.config.ts` only (npm run audit /
 * audit:mocks). For each route it captures a full-page screenshot into
 * `audit-output/<app|mocks>/<route>.<viewport>.png` — identical filenames
 * across the two dirs for side-by-side review — and asserts, by
 * measurement, that nothing extends past the viewport's horizontal bounds
 * (the html/body `overflow-x: clip` would hide it from the screenshot).
 *
 * Soft assertions: one run reports every broken route × viewport combo
 * instead of stopping at the first.
 */

const outDir = path.join(AUDIT_OUTPUT_DIR, isBaseline() ? "mocks" : "app");

/** Screens whose *rendered* state is a skeleton / spinner by design. */
const STATIC_LOADING_STATES: readonly RouteKey[] = ["weekendGenerating", "verifyVerifying"];

function auditTest(key: RouteKey): void {
  test(`${key} fits the viewport`, async ({ page, goto, settle }, testInfo) => {
    await goto(key);
    await page.waitForSelector("body[data-page]", { state: "attached" });
    await settle();
    // App only: give data-driven screens time to leave their loading state so
    // a skeleton is not what gets audited. The mocks are static (and the
    // verify-email mock stacks a spinner state), so no wait there.
    if (!isBaseline() && !STATIC_LOADING_STATES.includes(key)) {
      await expect(page.locator(".skeleton-row, .spinner")).toHaveCount(0, { timeout: 20_000 }).catch(() => {});
    }
    await page.waitForTimeout(250);

    const viewport = testInfo.project.name;
    await page.screenshot({
      path: path.join(outDir, `${key}.${viewport}.png`),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });

    const report = await measureHorizontalOverflow(page);
    if (report.documentOverflowPx > 0 || report.offenders.length > 0) {
      await testInfo.attach(`overflow-${key}-${viewport}`, {
        body: JSON.stringify(report, null, 2),
        contentType: "application/json",
      });
    }
    expect
      .soft(report.documentOverflowPx, `${key}@${viewport}: document scrollWidth exceeds viewport`)
      .toBe(0);
    expect
      .soft(report.offenders, `${key}@${viewport}: elements extend past the viewport`)
      .toEqual([]);
  });
}

if (isBaseline()) {
  // Mocks: static pages, no guards, no backend; the share link has no mock.
  test.describe("Responsive audit — mocks", () => {
    for (const key of auditable([...AUTHED_ROUTES, ...ANON_ROUTES])) {
      auditTest(key);
    }
  });
} else {
  test.describe("Responsive audit — app (authed)", () => {
    test.use({ storageState: AUTH_STATE });
    for (const key of AUTHED_ROUTES) {
      auditTest(key);
    }
  });

  test.describe("Responsive audit — app (anonymous)", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    for (const key of ANON_ROUTES) {
      auditTest(key);
    }
  });
}
