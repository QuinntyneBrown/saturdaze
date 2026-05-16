import { test, expect } from "../fixtures/sd-test.js";
import { ROUTES, RouteKey } from "../fixtures/routes.js";

/**
 * Cross-page navigation: bottom-nav links and back arrows must route to the
 * right URLs. The Angular implementation should map the mock hrefs
 * (home.html etc.) to its own clean routes; this test asserts the
 * destination, not the literal href.
 */

test.describe("Navigation chrome", () => {
  test("bottom-nav 'home' lands on the home route", async ({ page, goto, pages }) => {
    await goto("activities");
    await pages.activities.navLink("home").click();
    await expect(page).toHaveURL(new RegExp(`${escape(ROUTES.home.app)}$`));
  });

  test("bottom-nav 'activities' lands on the activities route", async ({ page, goto, pages }) => {
    await goto("home");
    await pages.home.navLink("activities").click();
    await expect(page).toHaveURL(/activities/);
  });

  test("bottom-nav 'saved' lands on the saved route", async ({ page, goto, pages }) => {
    await goto("home");
    await pages.home.navLink("saved").click();
    await expect(page).toHaveURL(/saved/);
  });

  test("bottom-nav 'profile' lands on the profile route", async ({ page, goto, pages }) => {
    await goto("home");
    await pages.home.navLink("profile").click();
    await expect(page).toHaveURL(/profile/);
  });

  for (const route of [
    "itinerary",
    "activities",
    "restaurants",
    "events",
    "errand",
    "profile",
  ] as RouteKey[]) {
    test(`${route}: back link returns to the previous page`, async ({ page, goto, pages }) => {
      await goto("home");
      await goto(route);
      const back = pages.home.topBarBackLink();
      // Pages with `back` attribute on sd-top-bar render the back link;
      // this list of routes are the ones that do.
      await expect(back).toBeVisible();
      await back.click();
      await expect(page).not.toHaveURL(new RegExp(route));
    });
  }
});

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
