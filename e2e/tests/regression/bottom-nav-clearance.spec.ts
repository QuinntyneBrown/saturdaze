import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ADR-005 regression guard. The bottom-nav must clear three sources
 * of bottom-edge obstruction on iOS Safari:
 *
 *   1. iOS Safari's *current* URL/tab bar height  → `100lvh - 100dvh`
 *      (NOT `100lvh - 100svh` — svh is the worst-case, fully-
 *      expanded chrome; dvh is the current state. Using svh
 *      over-reserves and the nav appears "way too high".)
 *   2. The home indicator on Face-ID               → `env(safe-area-inset-bottom)`
 *   3. A visual breathing-room floor              → `12px`
 *
 * History: BUG-047 fixed (2) only. The user then observed (1)
 * overlapping the nav at scroll-top, filed as BUG-049. The combined
 * three-component clearance is the canonical implementation; this
 * test reads the SCSS source and fails fast if any component goes
 * missing in a future refactor.
 *
 * Why static source assertion rather than a runtime check:
 *   - Playwright does not simulate iOS Safari's dynamic URL bar
 *     (`window.innerHeight === 100lvh === 100svh` in headless
 *     Chrome), so a computed-style assertion would always read
 *     `bottom: 12px` regardless of whether the chrome compensation
 *     was present.
 *   - The static check catches the specific regression mode that
 *     actually happens in practice: someone simplifies the calc
 *     because it looks ugly and they don't know why it's there.
 */

const BOTTOM_NAV_SCSS = join(
  __dirname,
  "..",
  "..",
  "..",
  "frontend",
  "projects",
  "components",
  "src",
  "lib",
  "bottom-nav",
  "bottom-nav.scss",
);

const INDEX_HTML = join(
  __dirname,
  "..",
  "..",
  "..",
  "frontend",
  "projects",
  "saturdaze",
  "src",
  "index.html",
);

const GLOBAL_SCSS = join(
  __dirname,
  "..",
  "..",
  "..",
  "frontend",
  "projects",
  "components",
  "src",
  "lib",
  "styles",
  "_global.scss",
);

test.describe("ADR-005 — bottom-nav device chrome clearance", () => {
  test("bottom-nav.scss includes env(safe-area-inset-bottom) for the home indicator", () => {
    const css = readFileSync(BOTTOM_NAV_SCSS, "utf8");
    expect(
      css,
      "sd-bottom-nav lost its safe-area-inset-bottom clearance — see ADR-005",
    ).toMatch(/env\(safe-area-inset-bottom/);
  });

  test("bottom-nav.scss includes the (100lvh - 100dvh) current-chrome compensation", () => {
    const css = readFileSync(BOTTOM_NAV_SCSS, "utf8");
    expect(
      css,
      "sd-bottom-nav lost its dynamic-chrome compensation — see ADR-005 and BUG-049",
    ).toMatch(/100lvh\s*-\s*100dvh/);
  });

  test("bottom-nav.scss uses dvh (current) NOT svh (worst-case) for chrome compensation", () => {
    // svh evaluates to the worst-case (fully-expanded) chrome height,
    // which makes the nav appear too high when chrome is partially
    // collapsed. dvh tracks the current state. See BUG-049 pass 3.
    const css = readFileSync(BOTTOM_NAV_SCSS, "utf8");
    // Must not subtract svh from lvh.
    expect(
      css,
      "sd-bottom-nav must use `100lvh - 100dvh`, not `100lvh - 100svh` — see ADR-005 and BUG-049",
    ).not.toMatch(/100lvh\s*-\s*100svh/);
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
    // Find the .sd-frame block and assert its padding-bottom references the inset.
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
