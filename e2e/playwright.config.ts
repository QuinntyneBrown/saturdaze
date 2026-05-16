import { defineConfig, devices } from "@playwright/test";

/**
 * Two-server configuration:
 *
 *   - The Angular dev server (the implementation under test) runs on
 *     http://localhost:4200. Tests target it via `app` fixture.
 *
 *   - The mock skeleton (docs/mocks) is served on http://localhost:5173 by
 *     `http-server`. Visual baselines are captured from it once with
 *     `npm run e2e:baseline` and then committed. Subsequent runs compare
 *     the Angular implementation against those baselines pixel-by-pixel.
 *
 * Snapshot path convention: tests under `tests/visual/` use
 * `toHaveScreenshot()` whose baselines live in
 * `tests/visual/<spec>.spec.ts-snapshots/<name>-<project>.png`. The baseline
 * project (`baseline-capture`) shares the same project name as the verify
 * project for that viewport so they read/write the same file.
 */

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
} as const;

const isBaselineCapture = process.env.SD_BASELINE === "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      // Saturdaze targets pixel-perfect parity with the mocks. A handful of
      // sub-pixel rasterisation diffs (font hinting, anti-aliasing) are
      // unavoidable across runs, so we allow a tiny ratio but no per-pixel
      // colour drift.
      maxDiffPixelRatio: 0.005,
      threshold: 0.05,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: isBaselineCapture
      ? "http://localhost:5173"
      : "http://localhost:4200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: isBaselineCapture
    ? {
        command:
          "npx http-server ../docs/mocks -p 5173 -c-1 --cors --silent",
        url: "http://localhost:5173/index.html",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        cwd: __dirname,
      }
    : {
        command: "npm run start -- --port 4200",
        url: "http://localhost:4200",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        cwd: `${__dirname}/../frontend`,
      },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.mobile },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.tablet },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.desktop },
    },
  ],
});

export { VIEWPORTS };
