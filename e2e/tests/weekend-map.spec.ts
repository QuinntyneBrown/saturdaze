import { test, expect, isPhone } from "../fixtures/sd-test.js";
import { drivingLabel, stubHomeDay } from "../fixtures/weekend-data.js";
import { measureHorizontalOverflow } from "../fixtures/overflow.js";

/**
 * Weekend — one day at a time beside its map, numbered stops and travel legs
 * (L2-090 → L2-093). The planner's picks vary, so assertions hold for whatever
 * Saturday it planned for the seeded family.
 */

test.describe("Weekend — map and travel legs", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("weekend");
    await pages.weekend.waitForPlan();
  });

  test("opens on Saturday and shows one day and its map at a time", async ({ pages }) => {
    // Traces to: L2-093 AC5, L2-092 AC4
    const w = pages.weekend;
    await expect(w.dayTab("Saturday")).toHaveAttribute("aria-selected", "true");
    await expect(w.days()).toHaveCount(1);
    await expect(w.dayTitle("Saturday")).toBeVisible();
    await expect(w.dayMap("Saturday")).toBeVisible();

    await w.selectDay("Sunday");
    await expect(w.dayTab("Sunday")).toHaveAttribute("aria-selected", "true");
    await expect(w.dayTab("Saturday")).toHaveAttribute("aria-selected", "false");
    await expect(w.days()).toHaveCount(1);
    await expect(w.dayMap("Sunday")).toBeVisible();
    await expect(w.dayMap("Saturday")).toHaveCount(0);
  });

  test("travel legs replace drive blocks and are named for assistive tech", async ({ pages }) => {
    // Traces to: L2-090 AC1, AC4
    const w = pages.weekend;
    await expect(w.driveBlocks()).toHaveCount(0);
    await expect(w.legs().first()).toBeVisible();
    for (const leg of await w.legs().all()) {
      await expect(w.legText(leg)).toHaveText(/^\s*\d+ min · [\d.]+ km( home)?( Directions)?\s*$/);
      await expect(leg).toHaveAttribute("aria-label", /^Travel: \d+ minutes, [\d.]+ kilometres (to .+|home)$/);
    }
  });

  test("only legs over ten minutes offer directions, opening a new tab", async ({ pages }) => {
    // Traces to: L2-090 AC3, AC6
    const w = pages.weekend;
    const minutes = await w.legMinutes();
    const legs = await w.legs().all();
    expect(legs.length).toBeGreaterThan(0);
    for (const [i, leg] of legs.entries()) {
      if (minutes[i] > 10) {
        await expect(w.directionsLink(leg)).toHaveAttribute("target", "_blank");
        await expect(w.directionsLink(leg)).toHaveAttribute("rel", /noopener/);
      } else {
        await expect(w.directionsLink(leg)).toHaveCount(0);
      }
    }
  });

  test("the day meta counts stops and totals the driving", async ({ pages }) => {
    // Traces to: L2-090 AC5
    const w = pages.weekend;
    const stops = await w.stopDiscs().count();
    const total = (await w.legMinutes()).reduce((a, b) => a + b, 0);
    await expect(w.dayMeta("Saturday")).toContainText(`${stops} stop${stops === 1 ? "" : "s"}`);
    await expect(w.dayMeta("Saturday")).toContainText(`${drivingLabel(total)} driving`);
  });

  test("stops are numbered in order and pinned on the map with home and attribution", async ({ pages }) => {
    // Traces to: L2-091 AC1, AC3
    const w = pages.weekend;
    const discs = await w.stopDiscs().allTextContents();
    expect(discs.length).toBeGreaterThan(0);
    expect(discs.map((d) => d.trim())).toEqual(discs.map((_, i) => String(i + 1)));

    await expect(w.mapPins("Saturday")).toHaveCount(discs.length);
    for (let n = 1; n <= discs.length; n++) {
      const title = (await w.blockTitle(w.stopBlock(n)).textContent())!.trim();
      await expect(w.mapPin("Saturday", n)).toHaveAccessibleName(`Stop ${n}: ${title}`);
    }
    await expect(w.homePin("Saturday")).toBeVisible();
    await expect(w.mapAttribution("Saturday")).toBeVisible();
    await expect(w.mapAttribution("Saturday")).toContainText("OpenStreetMap");
  });

  test("pointing at or focusing a stop highlights its pin", async ({ page, pages }, testInfo) => {
    // Traces to: L2-092 AC1, AC2
    test.skip(isPhone(testInfo), "hover is a pointer-device affordance; focus is covered on wider screens");
    const w = pages.weekend;
    await w.stopBlock(1).hover();
    await expect(w.stopBlock(1)).toHaveClass(/block--active/);
    await expect(w.mapPin("Saturday", 1)).toHaveClass(/map__pin--active/);

    await page.mouse.move(0, 0);
    await w.stopBlock(1).getByRole("button").first().focus();
    await expect(w.mapPin("Saturday", 1)).toHaveClass(/map__pin--active/);
  });

  test("activating a pin brings its stop into view and focuses it", async ({ pages }) => {
    // Traces to: L2-092 AC3
    const w = pages.weekend;
    const last = await w.mapPins("Saturday").count();
    await w.mapPin("Saturday", last).click();
    await expect(w.stopBlock(last)).toBeFocused();
    await expect(w.stopBlock(last)).toBeInViewport();
    await expect(w.stopBlock(last)).toHaveClass(/block--active/);
  });

  test("the map sits beside the timeline from 1024px and above it below", async ({ pages }, testInfo) => {
    // Traces to: L2-093 AC1, AC2
    const w = pages.weekend;
    const wide = (testInfo.project.use.viewport?.width ?? 1440) >= 1024;
    expect(await w.plannerColumnCount()).toBe(wide ? 2 : 1);

    const map = await w.dayMap("Saturday").boundingBox();
    const timeline = await w.timeline().boundingBox();
    if (wide) {
      expect(map!.x).toBeGreaterThan(timeline!.x);
      await expect(w.openMapButton()).toBeHidden();
    } else {
      expect(map!.y).toBeLessThan(timeline!.y);
      await w.openMapButton().click();
      await expect(w.dialog()).toBeVisible();
      await expect(w.dialog().getByRole("complementary", { name: "Saturday map" })).toBeVisible();
    }
  });
});

test.describe("Weekend — responsive", () => {
  test("no horizontal overflow from 320 to 1920px", async ({ page, goto, pages }, testInfo) => {
    // Traces to: L2-093 AC3
    test.skip(testInfo.project.name !== "desktop", "one project walks every width");
    await goto("weekend");
    await pages.weekend.waitForPlan();
    for (const width of [320, 390, 820, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const report = await measureHorizontalOverflow(page);
      expect(report.offenders, `overflow at ${width}px`).toEqual([]);
      expect(report.documentOverflowPx, `document overflow at ${width}px`).toBe(0);
    }
  });
});

test.describe("Weekend — a home day", () => {
  test("a day with no stops away from home says so instead of a map", async ({ page, goto, pages }) => {
    // Traces to: L2-091 AC2
    await stubHomeDay(page, "Saturday");
    await goto("weekend");
    await pages.weekend.waitForPlan();
    await expect(pages.weekend.homeDayMessage("Saturday")).toBeVisible();
    await expect(pages.weekend.mapPins("Saturday")).toHaveCount(0);
  });
});
