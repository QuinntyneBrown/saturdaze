import { test, expect } from "../../fixtures/sd-test.js";

/**
 * Skip link in Saturdaze Admin (L2-036 AC4 and AC5, drift D22, WCAG 2.4.1).
 * The first Tab reaches "Skip to content"; Enter skips the admin navigation
 * to `<main id="main" class="admin-main">` on the same route.
 */

const SKIP = "Skip to content";

test.describe("Admin skip link", () => {
  test("Given an admin screen, when the user presses Tab once and then Enter, then focus skips the admin navigation to the main content", async ({
    goto,
    pages,
  }) => {
    // Traces to: L2-036 AC4, AC5
    const a = pages.adminPlaces;
    await goto("adminPlaces");
    await a.waitForScreen("places");

    expect(await a.isOnScreen(a.skipLink())).toBe(false);
    expect(await a.firstTabStop()).toBe(SKIP);
    expect(await a.isOnScreen(a.skipLink())).toBe(true);

    await a.skipToContent();
    expect(a.currentPath()).toBe("/places");
    expect(await a.focusIsOnMain()).toBe(true);
    await a.pressTab();
    expect(await a.focusIsInMain()).toBe(true);
  });

  test("Given the admin sign-in screen, when the user presses Tab once and then Enter, then focus moves to the main content", async ({
    goto,
    pages,
  }) => {
    // Traces to: L2-036 AC4, AC5
    const s = pages.adminSignIn;
    await goto("adminSignIn");
    await s.waitForScreen();

    expect(await s.firstTabStop()).toBe(SKIP);
    await s.skipToContent();
    expect(s.currentPath()).toBe("/sign-in");
    expect(await s.focusIsOnMain()).toBe(true);
  });
});
