import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Photo health (A2, L2-112): one stat card per catalog with the places that
 * have a projecting primary photo and a link per flag into the filtered
 * Places list. The bundled seed has no photos, so every catalog reads
 * "0 of N" and every place is "without a photo"; the no-photo link must
 * land on a Places list whose count matches the figure on the card.
 */

test.describe("Admin photo health", () => {
  test("is the admin home and links each flag count to the filtered Places list", async ({ page, goto, pages }) => {
    // Traces to: L2-112 AC1
    await goto("adminHome");
    const a = pages.adminHealth;
    await a.waitForScreen("health");
    await expect(a.pageTitle()).toHaveText("Photo health");
    await expect(a.activeAdminNavLink()).toHaveAttribute("data-nav", "health");
    await expect(a.statCards()).toHaveCount(3);

    // Other runs upload curated photos, so read the figures and check they agree with each other.
    const activities = a.statCard("Activities");
    await expect(a.statFigure(activities)).toHaveText(/\d+ of \d+/);
    const [, withPrimary, total] = (await a.statFigure(activities).textContent())!.match(/(\d+) of (\d+)/)!.map(Number);
    const blocked = Number(await a.statLinkCount(a.statLink(activities, "blocked URL")).textContent());
    const noPhoto = a.statLink(activities, "without a photo");
    const withoutPhoto = total - withPrimary - blocked;
    await expect(a.statLinkCount(noPhoto)).toHaveText(String(withoutPhoto));
    await expect(a.statBar(activities)).toHaveAttribute(
      "aria-label",
      `${total === 0 ? 0 : Math.round((withPrimary / total) * 100)}% with a primary photo`,
    );

    await noPhoto.click();
    await page.waitForURL(/\/places\?kind=Activity&flag=no-photo$/);
    await pages.adminPlaces.waitForScreen("places");
    await expect(pages.adminPlaces.count()).toHaveText(`${withoutPhoto} place${withoutPhoto === 1 ? "" : "s"}`);
    await expect(pages.adminPlaces.rowFlags(pages.adminPlaces.rows().first())).toHaveText(["No photo"]);
  });

  test("shows the worst places first and the Places link", async ({ page, goto, pages }) => {
    // Traces to: L2-112, L2-113 AC2
    await goto("adminHome");
    const a = pages.adminHealth;
    await a.waitForScreen("health");
    const rows = await a.worstRows().count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(6);
    await a.allPlacesLink().click();
    await page.waitForURL(/\/places$/);
    await pages.adminPlaces.waitForScreen("places");
  });

  for (const [width, columns] of [
    [390, 1],
    [820, 1],
    [1440, 3],
  ] as const) {
    test(`stacks the catalog cards in ${columns} column(s) at ${width}px with no horizontal scroll`, async ({ page, goto, pages }) => {
      // Traces to: L2-112 AC4
      await page.setViewportSize({ width, height: 900 });
      await goto("adminHome");
      const a = pages.adminHealth;
      await a.waitForScreen("health");
      expect(await a.statGridColumns()).toBe(columns);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  }
});
