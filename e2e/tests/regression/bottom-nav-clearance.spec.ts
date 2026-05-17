import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ADR-005 regression guard. The bottom-nav must clear two sources of
 * bottom-edge obstruction:
 *
 *   1. The home indicator on Face-ID iPhones in PWA standalone mode
 *      → `env(safe-area-inset-bottom)`
 *   2. iOS Safari's *bottom* URL/tab bar
 *      → `--sd-chrome-bottom`, set by `trackBottomChrome()` in
 *        `frontend/projects/saturdaze/src/main.ts` using the
 *        `VisualViewport` DOM API.
 *
 * History: BUG-047 fixed (1). BUG-049 documents four wrong attempts at
 * fixing (2) in CSS (additive, max() with svh, max() with dvh) — every
 * CSS-only formula either over- or under-corrected because no CSS unit
 * isolates the *bottom* chrome from the *top* chrome on iOS Safari
 * with `viewport-fit=cover`. The JS hook is the only correct approach.
 *
 * These static-source assertions catch the specific regression mode
 * that actually happens in practice: someone removes the JS hook
 * because it looks weird in `main.ts`, or simplifies the SCSS calc
 * back to one of the broken pure-CSS forms.
 */

const REPO_ROOT = join(__dirname, "..", "..", "..");
const BOTTOM_NAV_SCSS = join(
  REPO_ROOT,
  "frontend/projects/components/src/lib/bottom-nav/bottom-nav.scss",
);
const MAIN_TS = join(REPO_ROOT, "frontend/projects/saturdaze/src/main.ts");
const INDEX_HTML = join(REPO_ROOT, "frontend/projects/saturdaze/src/index.html");
const GLOBAL_SCSS = join(
  REPO_ROOT,
  "frontend/projects/components/src/lib/styles/_global.scss",
);

test.describe("ADR-005 — bottom-nav device chrome clearance", () => {
  test("bottom-nav.scss reads safe-area-inset-bottom for the home indicator", () => {
    const css = readFileSync(BOTTOM_NAV_SCSS, "utf8");
    expect(
      css,
      "sd-bottom-nav lost its safe-area-inset-bottom reference — see ADR-005",
    ).toMatch(/env\(safe-area-inset-bottom/);
  });

  test("bottom-nav.scss reads var(--sd-chrome-bottom) for the dynamic chrome", () => {
    const css = readFileSync(BOTTOM_NAV_SCSS, "utf8");
    expect(
      css,
      "sd-bottom-nav lost its --sd-chrome-bottom reference — see ADR-005 and BUG-049",
    ).toMatch(/var\(--sd-chrome-bottom/);
  });

  test("bottom-nav.scss does NOT use the broken CSS-only chrome formulas", () => {
    // Four wrong CSS-only formulations have been tried and rejected.
    // Each was independently broken on real iOS Safari. The JS hook
    // is the only correct approach. See BUG-049 history.
    const css = readFileSync(BOTTOM_NAV_SCSS, "utf8");
    expect(
      css,
      "sd-bottom-nav uses `100lvh - 100svh` — that's the worst-case viewport, not the current one (BUG-049 pass 2)",
    ).not.toMatch(/100lvh\s*-\s*100svh/);
    expect(
      css,
      "sd-bottom-nav uses `100lvh - 100dvh` — that's combined top+bottom chrome on iOS Safari (BUG-049 pass 3)",
    ).not.toMatch(/100lvh\s*-\s*100dvh/);
  });

  test("main.ts wires `trackBottomChrome()` before bootstrapApplication", () => {
    const ts = readFileSync(MAIN_TS, "utf8");
    expect(
      ts,
      "main.ts is missing the trackBottomChrome() function — see ADR-005",
    ).toMatch(/function\s+trackBottomChrome/);
    expect(
      ts,
      "main.ts is not calling trackBottomChrome() — see ADR-005",
    ).toMatch(/trackBottomChrome\(\s*\)/);
    expect(
      ts,
      "main.ts must write --sd-chrome-bottom — see ADR-005",
    ).toMatch(/--sd-chrome-bottom/);
    expect(
      ts,
      "main.ts must use visualViewport — that's the whole point — see ADR-005",
    ).toMatch(/visualViewport/);
  });

  test("index.html viewport meta still opts into viewport-fit=cover", () => {
    const html = readFileSync(INDEX_HTML, "utf8");
    expect(
      html,
      "viewport-fit=cover is required for env(safe-area-inset-*) to resolve — see ADR-005",
    ).toMatch(/viewport-fit\s*=\s*cover/);
  });

  test(".sd-frame reserves bottom space that includes the safe-area inset", () => {
    const css = readFileSync(GLOBAL_SCSS, "utf8");
    const frameBlock = css.match(/\.sd-frame\s*{[^}]*}/);
    expect(
      frameBlock,
      ".sd-frame block not found in _global.scss",
    ).not.toBeNull();
    expect(
      frameBlock![0],
      ".sd-frame padding-bottom must include env(safe-area-inset-bottom) so scrolled-to-end content cannot hide behind the nav — see ADR-005",
    ).toMatch(/env\(safe-area-inset-bottom/);
  });
});
