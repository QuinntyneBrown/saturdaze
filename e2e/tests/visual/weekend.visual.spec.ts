import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Weekend parity — pages/weekend.html (+ .empty / .generating).
 *
 * The planner and live weather make the block list non-deterministic, so
 * there is deliberately NO full-page baseline for the ready state. Regions
 * whose copy is fixed or seed-derived are compared; dated / weather text
 * (`.day__meta`, the weather disc, the header subtitle) and planner prose
 * (`.block__sub`) are masked so layout still has to match.
 */

test.describe("Visual: Weekend", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("weekend");
    await pages.weekend.waitForReady();
    await settle();
  });

  test("page header", async ({ pages }) => {
    const w = pages.weekend;
    await expect(w.pageHeader).toHaveScreenshot("weekend.header.png", {
      mask: [w.pageSubtitle()],
    });
  });

  test("Saturday day header", async ({ pages }) => {
    const w = pages.weekend;
    await expect(w.dayHeader("Saturday")).toHaveScreenshot("weekend.day-header.sat.png", {
      mask: [w.dayMeta("Saturday"), w.dayWeatherDisc("Saturday")],
    });
  });

  test("Sunday day header", async ({ pages }) => {
    const w = pages.weekend;
    await expect(w.dayHeader("Sunday")).toHaveScreenshot("weekend.day-header.sun.png", {
      mask: [w.dayMeta("Sunday"), w.dayWeatherDisc("Sunday")],
    });
  });

  test("commitment block (Swim lessons, seeded Saturday 9:00)", async ({ pages }) => {
    const w = pages.weekend;
    const block = w.block("Swim lessons", "Saturday");
    await expect(block).toHaveScreenshot("weekend.block.commitment.png", {
      mask: [w.blockSubtitle(block)],
    });
  });

  test("add-an-errand ghost row", async ({ pages }) => {
    await expect(pages.weekend.ghostRow("Saturday")).toHaveScreenshot("weekend.ghost-row.png");
  });
});

test.describe("Visual: Weekend — empty", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("weekendEmpty");
    await pages.weekend.waitForReady();
    await settle();
  });

  test("matches the mock @full-page (static, seed-derived copy)", async ({ page }) => {
    await expect(page).toHaveScreenshot("weekend.empty.full.png", { fullPage: true });
  });

  test("page header", async ({ pages }) => {
    await expect(pages.weekend.pageHeader).toHaveScreenshot("weekend.empty.header.png");
  });

  test("warm empty state", async ({ pages }) => {
    await expect(pages.weekend.empty).toHaveScreenshot("weekend.empty.state.png");
  });

  test("planned-around list", async ({ pages }) => {
    await expect(pages.weekend.plannedAroundSection()).toHaveScreenshot("weekend.empty.planned-around.png");
  });
});

test.describe("Visual: Weekend — generating", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("weekendGenerating");
    await pages.weekend.waitForReady();
    await settle();
  });

  test("matches the mock @full-page (shimmer frozen)", async ({ page, pages }) => {
    const w = pages.weekend;
    await expect(page).toHaveScreenshot("weekend.generating.full.png", {
      fullPage: true,
      mask: [w.dayMeta("Saturday"), w.dayMeta("Sunday"), w.dayWeatherDisc("Saturday"), w.dayWeatherDisc("Sunday")],
    });
  });

  test("page header with disabled actions", async ({ pages }) => {
    await expect(pages.weekend.pageHeader).toHaveScreenshot("weekend.generating.header.png");
  });

  test("status row", async ({ pages }) => {
    await expect(pages.weekend.statusRow()).toHaveScreenshot("weekend.generating.status-row.png");
  });

  test("Saturday skeleton day", async ({ pages }) => {
    const w = pages.weekend;
    await expect(w.day("Saturday")).toHaveScreenshot("weekend.generating.day.sat.png", {
      mask: [w.dayMeta("Saturday"), w.dayWeatherDisc("Saturday")],
    });
  });
});
