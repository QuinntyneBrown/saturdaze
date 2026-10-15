import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Saturdaze Admin landmarks (L2-140, drift D47, WCAG 1.3.1). The admin navigation
 * is a `navigation` landmark named "Admin": a bare `aria-label` on a host with no
 * role names nothing.
 */

test.describe("Admin landmarks", () => {
  test("Given an admin screen, when assistive technology lists the landmarks, then the navigation is named Admin", async ({
    goto,
    pages,
  }) => {
    // Traces to: L2-140 AC1
    const a = pages.adminPlaces;
    await goto("adminPlaces");
    await a.waitForScreen("places");
    await expect(a.navLandmark()).toBeVisible();
  });
});
