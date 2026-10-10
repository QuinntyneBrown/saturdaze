import { test, expect, isPhone } from "../fixtures/sd-test.js";

/**
 * Minimum text size (drift D12). No text is set below 12px
 * (`--fontSizeBase200`): the bottom-nav labels, the date tile's month, the
 * small avatar's initials and the landing preview's browser-frame URL were
 * 10 or 11px, too small to read comfortably on a phone.
 */

const MIN_TEXT = "12px";

test.describe("Minimum text size", () => {
  test("Given a phone, when a person reads the bottom-nav labels, then they are 12px", async ({
    goto,
    pages,
  }, testInfo) => {
    test.skip(!isPhone(testInfo), "The bottom nav shows below 720px only.");
    await goto("weekend");
    const w = pages.weekend;
    await w.waitForReady();

    expect(await w.fontSize(w.bottomNavLink("weekend"))).toBe(MIN_TEXT);
    expect(await w.fontSize(w.bottomNavLink("family"))).toBe(MIN_TEXT);
  });

  test("Given a suggestion waiting for review, when a person reads its date tile month and the submitter's initials, then they are 12px", async ({
    goto,
    pages,
  }) => {
    await goto("reviewSubmissions");
    const r = pages.reviewSubmissions;
    await r.waitForReady();
    const card = r.card("Port Credit Buskerfest");

    expect(await r.fontSize(r.dateTileMonth(card))).toBe(MIN_TEXT);
    expect(await r.fontSize(r.submitterAvatar(card))).toBe(MIN_TEXT);
  });

  test("Given the landing page, when a person reads the preview's browser URL, then it is 12px", async ({
    goto,
    pages,
  }) => {
    await goto("landing", { anonymous: true });
    const l = pages.landing;
    await l.waitForReady();

    expect(await l.fontSize(l.previewUrl())).toBe(MIN_TEXT);
  });
});
