import { test, expect } from "../fixtures/sd-test.js";

/**
 * Type on the scale (drift D14). Every size, weight and line height comes
 * from the type ramp: the 18px lede, step titles and date-tile day are 17px
 * (`--fontSizeBase500`), the 28px "How it works" title is the page-title size
 * (`--fontSizeHero700`), the hero title is bold (700) rather than 800, and
 * line heights are None 1 / Tight 1.2 / Snug 1.35 / Normal 1.5 / Relaxed 1.65.
 */

const BASE_500 = "17px";

test.describe("Type scale", () => {
  test("Given a suggestion waiting for review, when a person reads it, then the date tile day is 17px and the title sets tight", async ({
    goto,
    pages,
  }) => {
    await goto("reviewSubmissions");
    const r = pages.reviewSubmissions;
    await r.waitForReady();
    const card = r.card("Port Credit Buskerfest");

    expect(await r.fontSize(r.dateTileDay(card))).toBe(BASE_500);
    expect(await r.lineHeightRatio(r.cardTitle(card))).toBe(1.2);
  });

  test("Given the family page, when a person reads the title and the member rows, then the title sets tight and the row titles snug", async ({
    goto,
    pages,
  }) => {
    await goto("family");
    const f = pages.family;
    await f.waitForReady();

    expect(await f.lineHeightRatio(f.pageTitle())).toBe(1.2);
    expect(await f.lineHeightRatio(f.rowTitle(f.memberRow("Quinn")))).toBe(1.35);
  });

  test("Given the family page, when a person opens a dialog, then its title sets tight", async ({
    goto,
    pages,
  }) => {
    await goto("family");
    const f = pages.family;
    await f.waitForReady();
    await f.addMemberRow().click();

    await expect(f.dialogTitle()).toBeVisible();
    expect(await f.lineHeightRatio(f.dialogTitle())).toBe(1.2);
  });
});
