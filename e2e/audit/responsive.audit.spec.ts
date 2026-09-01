import * as path from "node:path";
import { test, expect } from "../fixtures/sd-test.js";
import { RouteKey } from "../fixtures/routes.js";
import { measureHorizontalOverflow } from "../fixtures/overflow.js";
import { AUTHED_ROUTES, ANON_ROUTES } from "../fixtures/audit-routes.js";
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

const isBaseline = process.env.SD_BASELINE === "1";
const outDir = path.join(AUDIT_OUTPUT_DIR, isBaseline ? "mocks" : "app");

function auditTest(key: RouteKey): void {
  test(`${key} fits the viewport`, async ({ page, goto, settle }, testInfo) => {
    await goto(key);
    await settle();
    // Web-component upgrade cushion (same as scripts/screenshot-auth-mocks.mjs).
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

if (isBaseline) {
  // Mocks: static pages, no guards, no backend. adminEvents exists only here.
  test.describe("Responsive audit — mocks", () => {
    for (const key of [...AUTHED_ROUTES, ...ANON_ROUTES, "adminEvents" as RouteKey]) {
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

  test.describe("Responsive audit — app (unroutable)", () => {
    test("adminEvents", ({}, testInfo) => {
      testInfo.annotations.push({
        type: "skip-reason",
        description:
          "admin-events has a page component and mock but no entry in app.routes.ts — mock-mode only",
      });
      test.skip(true, "no /admin/events route in the Angular app");
    });
  });
}
