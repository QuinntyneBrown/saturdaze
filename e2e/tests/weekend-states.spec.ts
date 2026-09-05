import { test, expect } from "../fixtures/sd-test.js";
import { registerThrowaway } from "../fixtures/auth.js";

/**
 * Weekend screen states.
 *
 *   - A brand-new family (throwaway account) sees "Your first weekend" and
 *     can plan it: empty → generating (status row + skeletons, header
 *     actions disabled) → ready.
 *   - The dev-only `?state=` override (environment.galleryRoutes) renders
 *     the static empty / generating states for the seeded family without
 *     touching its plan.
 */

test.describe("Weekend — first run", () => {
  test("empty state plans the first weekend", async ({ page, pages, request, signIn }) => {
    const account = await registerThrowaway(request, "weekend");
    await signIn(account);
    await page.goto("/weekend");
    await pages.weekend.waitForReady();

    const w = pages.weekend;
    await expect(w.pageTitle()).toHaveText("Your first weekend");
    await expect(w.emptyTitle()).toContainText("drafted around");
    await expect(w.planButton()).toBeVisible();
    await expect(w.plannedAroundRows()).toHaveCount(3);
    await w.plannedAroundRows().first().click();
    await page.waitForURL("**/family");
    await page.goBack();
    await pages.weekend.waitForReady();

    const planned = page.waitForResponse((r) => r.url().endsWith("/api/weekends/plan"));
    await w.planButton().click();
    await expect(w.statusRow()).toContainText(/Working through/);
    await expect(w.main).toHaveAttribute("aria-busy", "true");
    await expect(w.shareButton()).toBeDisabled();
    expect((await planned).ok()).toBeTruthy();

    await w.waitForPlan();
    await expect(w.pageTitle()).toHaveText("This weekend");
    await expect(w.days()).toHaveCount(2);
  });

  test("a second visit is idempotent (ADR-003): same plan, no re-plan", async ({ page, pages, request, signIn }) => {
    const account = await registerThrowaway(request, "weekend");
    await signIn(account);
    await page.goto("/weekend");
    await pages.weekend.waitForReady();
    await pages.weekend.planButton().click();
    await pages.weekend.waitForPlan();
    const titles = await pages.weekend.blocks().locator(".block__title").allTextContents();

    const plans: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith("/api/weekends/plan") || /\/regenerate$/.test(r.url())) plans.push(r.url());
    });
    await page.reload();
    await pages.weekend.waitForPlan();
    expect(await pages.weekend.blocks().locator(".block__title").allTextContents()).toEqual(titles);
    expect(plans).toEqual([]);
  });
});

test.describe("Weekend — ?state= overrides (dev only)", () => {
  test("?state=empty renders the empty state", async ({ goto, pages }) => {
    await goto("weekendEmpty");
    await pages.weekend.waitForReady();
    await expect(pages.weekend.pageTitle()).toHaveText("Your first weekend");
    await expect(pages.weekend.empty).toHaveClass(/empty--warm/);
    await expect(pages.weekend.planButton()).toBeVisible();
    await expect(pages.weekend.days()).toHaveCount(0);
  });

  test("?state=generating renders the status row, skeletons and disabled actions", async ({ goto, pages }) => {
    await goto("weekendGenerating");
    await pages.weekend.waitForReady();
    const w = pages.weekend;
    await expect(w.main).toHaveAttribute("aria-busy", "true");
    await expect(w.statusRow()).toBeVisible();
    await expect(w.skeletonRows()).toHaveCount(12);
    await expect(w.days()).toHaveCount(2);
    await expect(w.shareButton()).toBeDisabled();
    await expect(w.addToCalendarButton()).toBeDisabled();
    await expect(w.moreButton()).toBeDisabled();
  });
});
