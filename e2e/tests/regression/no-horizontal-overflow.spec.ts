import { test, expect } from "../../fixtures/sd-test.js";
import { measureHorizontalOverflow } from "../../fixtures/overflow.js";
import { isBaseline } from "../../fixtures/routes.js";
import { ANON_ROUTES, AUTHED_ROUTES, auditable } from "../../fixtures/audit-routes.js";


/**
 * Regression guard: every routed screen fits every supported width.
 *
 * Loads each route once and resizes through all five audit widths
 * (320 / 390 / 820 / 1440 / 1920 — CSS responds to resize, no reload
 * needed), asserting by measurement that nothing extends past the
 * viewport's horizontal bounds. `html, body { overflow-x: clip }` masks
 * such overflow from screenshots, so this is the check that keeps the
 * 5-viewport audit's guarantees alive. No screenshots → no baselines.
 *
 * Runs once, under the desktop project only (viewport is driven manually).
 * A single looping test keeps it to one API sign-in at `workers: 1`;
 * `expect.soft` reports every broken route × width combo in one run.
 *
 * Anonymous routes are swept first, then the seeded session (same account
 * as sign-out.spec.ts) unlocks the guarded routes; the share link is built
 * last because `goto("sharedWeekend")` mints it through the API.
 */

const WIDTHS = [
  { name: "xsmall", width: 320, height: 568 },
  { name: "small", width: 390, height: 844 },
  { name: "medium", width: 820, height: 1180 },
  { name: "large", width: 1440, height: 900 },
  { name: "xlarge", width: 1920, height: 1080 },
] as const;

test.describe("Responsive guard", () => {
  test("no horizontal overflow on any route at any width", async ({
    page,
    goto,
    settle,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "viewport is driven manually — one project is enough",
    );
    test.setTimeout(300_000);

    const sweep = async (route: string) => {
      await page.waitForSelector("body[data-page]", { state: "attached" });
      await settle();
      // App only: let data-driven screens leave their skeleton state first.
      if (!isBaseline() && route !== "weekendGenerating") {
        await expect(page.locator(".skeleton-row")).toHaveCount(0, { timeout: 20_000 }).catch(() => {});
      }
      for (const vp of WIDTHS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await settle();
        const report = await measureHorizontalOverflow(page);
        expect
          .soft(
            report.offenders,
            `${route}@${vp.name} (${vp.width}px): elements extend past the viewport`,
          )
          .toEqual([]);
      }
    };

    // Anonymous first (the share link, app mode only, is minted through the
    // API by the fixture without seeding a browser session).
    for (const key of auditable(ANON_ROUTES)) {
      await goto(key);
      await sweep(key);
    }

    // Guarded routes: the fixture signs in through the API before the first
    // guarded navigation (see fixtures/auth.ts).
    await page.setViewportSize({ width: 390, height: 844 });

    for (const key of auditable(AUTHED_ROUTES)) {
      await goto(key);
      await sweep(key);
    }
  });
});
