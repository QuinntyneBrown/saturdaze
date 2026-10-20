import { test, expect } from "../../fixtures/sd-test.js";
import { apiLogin, registerUser } from "../../fixtures/auth.js";

/**
 * Family weekend (A9, L2-159): an administrator opens a family and sees its
 * upcoming weekend as the family does, plans it when nothing is drafted, and
 * reads its past weekends. The seeded household is "The Browns"; a throwaway
 * family registered per test has no weekend until the administrator plans it.
 */

async function openFamily(
  page: import("@playwright/test").Page,
  pages: Parameters<Parameters<typeof test>[2]>[0]["pages"],
  search: string,
  name: string,
): Promise<void> {
  await page.goto(`/families?q=${encodeURIComponent(search)}`);
  const list = pages.adminFamilies;
  await list.waitForScreen("families");
  await list.rowLink(list.row(name)).click();
  await page.waitForURL(/\/families\/[0-9a-f-]{36}$/);
}

test.describe("Admin family weekend", () => {
  test("shows the seeded family's planned weekend with the Saturday tab selected", async ({ page, goto, pages }) => {
    // Traces to: L2-159 AC3
    await goto("adminFamilies");
    await openFamily(page, pages, "The Browns", "The Browns");
    const a = pages.adminFamily;
    const weekend = page.waitForResponse((r) => /\/api\/admin\/families\/[^/]+\/weekends\/current$/.test(r.url()));
    await a.waitForScreen("family");
    const res = await weekend;
    if (res.status() === 404) {
      await a.planButton().click();
    }
    await a.waitForPlan();

    await expect(a.pageTitle()).toHaveText("The Browns");
    await expect(a.pageSubtitle()).toContainText("4 members · 2 accounts · Weekend of");
    await expect(a.dayTab("Saturday")).toHaveAttribute("aria-selected", "true");
    await expect(a.day("Saturday")).toBeVisible();
    await expect(a.dayMeta("Saturday")).toContainText(/\d+ \w+/);

    const current = await page.evaluate(async () => {
      const raw = localStorage.getItem("sd.auth.token") ?? sessionStorage.getItem("sd.auth.token");
      const token = raw ? (JSON.parse(raw) as { value: string }).value : "";
      const id = location.pathname.split("/").pop();
      const res = await fetch(`http://localhost:5100/api/admin/families/${id}/weekends/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (await res.json()) as { blocks: { day: string; kind: string }[] };
    });
    // Drives are travel legs in the timeline, not rows (L2-102).
    const saturday = current.blocks.filter((b) => b.day === "Saturday" && b.kind !== "Drive").length;
    await expect(a.blocks("Saturday")).toHaveCount(saturday);

    await a.dayTab("Sunday").click();
    await expect(a.day("Sunday")).toBeVisible();
    await expect(a.day("Saturday")).toHaveCount(0);
    await expect(a.backLink()).toHaveAttribute("href", /\/families$/);
  });

  test("a family with nothing drafted shows the empty state and Plan this weekend plans it once", async ({ page, request, goto, pages }) => {
    // Traces to: L2-159 AC1, AC4
    const creds = await registerUser(request, "e2e-family");
    await goto("adminFamilies");
    await openFamily(page, pages, creds.email, "Unnamed family");
    const a = pages.adminFamily;
    await a.waitForScreen("family");
    await expect(a.emptyTitle()).toHaveText("Nothing is drafted for Unnamed family yet");
    await expect(a.noPastWeekends()).toHaveText("No past weekends yet");

    const plans: string[] = [];
    page.on("request", (req) => {
      if (/\/weekends\/plan$/.test(req.url()) && req.method() === "POST") plans.push(req.url());
    });
    await a.planButton().click();
    await a.waitForPlan();
    expect(plans).toHaveLength(1);
    expect(await a.blocks("Saturday").count()).toBeGreaterThan(0);
    await expect(a.empty).toHaveCount(0);

    // The family sees the plan the administrator made (L2-158 AC1).
    const family = await apiLogin(request, creds);
    const theirs = await request.get("http://localhost:5100/api/weekends/current", {
      headers: { Authorization: `Bearer ${family.accessToken}` },
    });
    expect(theirs.ok()).toBeTruthy();
    expect(((await theirs.json()) as { blocks: unknown[] }).blocks.length).toBeGreaterThan(0);
  });

  test("lists past weekends newest first", async ({ page, request, goto, pages }) => {
    // Traces to: L2-159 AC6
    const creds = await registerUser(request, "e2e-past");
    const family = await apiLogin(request, creds);
    for (const weekendOf of ["2026-05-02", "2026-05-09"]) {
      const res = await request.post("http://localhost:5100/api/weekends/plan", {
        headers: { Authorization: `Bearer ${family.accessToken}` },
        data: { weekendOf },
      });
      expect(res.ok()).toBeTruthy();
    }
    await goto("adminFamilies");
    await openFamily(page, pages, creds.email, "Unnamed family");
    const a = pages.adminFamily;
    await a.waitForScreen("family");
    await expect(a.pastRows()).toHaveCount(2);
    await expect(a.pastRows().first().locator(".list__title")).toContainText("9 – 10 May");
    await expect(a.pastRows().nth(1).locator(".list__title")).toContainText("2 – 3 May");
  });

  for (const width of [390, 820, 1440] as const) {
    test(`fits ${width}px with working day tabs and no horizontal overflow`, async ({ page, goto, pages }) => {
      // Traces to: L2-159 AC5
      await page.setViewportSize({ width, height: 900 });
      await goto("adminFamilies");
      await openFamily(page, pages, "The Browns", "The Browns");
      const a = pages.adminFamily;
      await a.waitForScreen("family");
      if ((await a.empty.count()) > 0) await a.planButton().click();
      await a.waitForPlan();
      await a.dayTab("Sunday").click();
      await expect(a.day("Sunday")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
});
