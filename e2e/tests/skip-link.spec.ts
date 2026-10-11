import { test, expect } from "../fixtures/sd-test.js";

/**
 * Skip link (L2-036 AC4 and AC5, drift D22, WCAG 2.4.1 Bypass Blocks).
 * Every page starts with "Skip to content": the first Tab reaches it and it
 * appears; Enter moves focus to `<main id="main">` without leaving the
 * route, so the next Tab lands in the content, not the navigation.
 */

const SKIP = "Skip to content";

test.describe("Skip link in the app shell", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("ideas");
    await pages.ideas.waitForReady();
  });

  test("Given a signed-in page, when the user presses Tab once, then the skip link is focused and visible", async ({
    pages,
  }) => {
    const p = pages.ideas;
    expect(await p.isOnScreen(p.skipLink())).toBe(false);
    expect(await p.firstTabStop()).toBe(SKIP);
    expect(await p.isOnScreen(p.skipLink())).toBe(true);
  });

  test("Given the skip link has focus, when the user presses Enter, then focus moves to the main content on the same route", async ({
    pages,
  }) => {
    const p = pages.ideas;
    const path = p.currentPath();
    await p.skipToContent();

    expect(p.currentPath()).toBe(path);
    expect(await p.focusIsOnMain()).toBe(true);
    expect(await p.mainOutlineStyle()).toBe("none");
    expect(await p.isOnScreen(p.skipLink())).toBe(false);

    await p.pressTab();
    expect(await p.focusIsInMain()).toBe(true);
  });
});

test.describe("Skip link on a bare (auth) page", () => {
  test("Given the sign-in screen, when the user presses Tab once and then Enter, then the skip link shows and focus moves to the main content", async ({
    goto,
    pages,
  }) => {
    const s = pages.signIn;
    await goto("signIn");
    await s.waitForReady();

    expect(await s.firstTabStop()).toBe(SKIP);
    await s.skipToContent();
    expect(s.currentPath()).toBe("/sign-in");
    expect(await s.focusIsOnMain()).toBe(true);
  });
});

test.describe("Skip link on a public (site) page", () => {
  test("Given the landing page, when the user presses Tab once and then Enter, then focus skips the site bar to the main content", async ({
    goto,
    pages,
  }) => {
    const l = pages.landing;
    await goto("landing", { anonymous: true });
    await l.waitForReady();

    expect(await l.firstTabStop()).toBe(SKIP);
    await l.skipToContent();
    expect(l.currentPath()).toBe("/");
    expect(await l.focusIsOnMain()).toBe(true);
  });
});
