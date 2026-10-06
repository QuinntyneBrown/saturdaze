import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Places (A3, L2-113): search, the kind / flag chips, the sort select and
 * the health chips on each row. The bundled seed has no photos, so every
 * row is "No photo" and the kind filter is the one that changes the list.
 */

test.describe("Admin places", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("adminPlaces");
    await pages.adminPlaces.waitForScreen("places");
  });

  test("search narrows the list to matching names in any catalog", async ({ page, pages }) => {
    // Traces to: L2-113 AC1, AC5
    const a = pages.adminPlaces;
    await a.searchInput().fill("river");
    await expect(a.row("Riverwood Conservancy")).toBeVisible();
    await expect(a.rows()).toHaveCount(1);
    await expect(a.count()).toHaveText("1 place");
    expect(new URL(page.url()).searchParams.get("q")).toBe("river");
  });

  test("rows show the thumbnail, kind, photo count and health chips", async ({ pages }) => {
    // Traces to: L2-113 AC5
    const a = pages.adminPlaces;
    const row = a.row("Riverwood Conservancy");
    await expect(a.rowThumb(row)).toBeVisible();
    await expect(a.rowMeta(row)).toHaveText("Activity · 0 photos");
    await expect(a.rowFlags(row)).toHaveText(["No photo"]);
    await expect(a.rowLink(row)).toHaveAttribute("href", /\/places\/Activity\//);
  });

  test("kind chips filter and are read back from the URL", async ({ page, pages }) => {
    // Traces to: L2-113 AC3, AC5
    const a = pages.adminPlaces;
    await a.filterChip("Restaurants").click();
    await expect(a.filterChip("Restaurants")).toHaveAttribute("aria-pressed", "true");
    await expect(a.filterChip("All kinds")).toHaveAttribute("aria-pressed", "false");
    await expect(a.rows().first()).toBeVisible();
    for (const meta of await a.rowMeta(a.rows()).allTextContents()) expect(meta).toMatch(/^Restaurant/);
    expect(new URL(page.url()).searchParams.get("kind")).toBe("Restaurant");

    await page.goto("/places?kind=LocalEvent&flag=no-photo");
    await a.waitForScreen("places");
    await expect(a.filterChip("Events")).toHaveAttribute("aria-pressed", "true");
    await expect(a.filterChip("No photo")).toHaveAttribute("aria-pressed", "true");
    for (const meta of await a.rowMeta(a.rows()).allTextContents()) expect(meta).toMatch(/^Event/);
  });

  test("the sort select switches from worst health to name", async ({ page, pages }) => {
    // Traces to: L2-113 AC2
    const a = pages.adminPlaces;
    await expect(a.sortSelect()).toHaveValue("health");
    await a.sortSelect().selectOption("name");
    await expect.poll(() => new URL(page.url()).searchParams.get("sort")).toBe("name");
    const names = await a.rowTitle(a.rows()).allTextContents();
    // The API orders by OrdinalIgnoreCase: compare lowercased code units, not locale rules.
    const lower = names.map((n) => n.toLowerCase());
    expect(lower).toEqual([...lower].sort());
  });

  test("the pager reports the page and disables both ends on one page", async ({ pages }) => {
    // Traces to: L2-113 AC4
    const a = pages.adminPlaces;
    await expect(a.pager()).toContainText("1 to 23 of 23");
    await expect(a.pagerButton("Previous")).toBeDisabled();
    await expect(a.pagerButton("Next")).toBeDisabled();
  });
});
