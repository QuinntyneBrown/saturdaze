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
  test("Given the landing page, when a person reads the hero, then the title is bold at line height 1 and the lede is 17px", async ({
    goto,
    pages,
  }) => {
    await goto("landing", { anonymous: true });
    const l = pages.landing;
    await l.waitForReady();

    expect(await l.fontWeight(l.heroTitle())).toBe("700");
    expect(await l.lineHeightRatio(l.heroTitle())).toBe(1);
    expect(await l.fontSize(l.heroLede())).toBe(BASE_500);
  });

  test("Given the landing page, when a person reads how it works, then the title is page-title size and each step title is 17px", async ({
    goto,
    pages,
  }, testInfo) => {
    await goto("landing", { anonymous: true });
    const l = pages.landing;
    await l.waitForReady();

    const pageTitleSize = testInfo.project.name === "desktop" ? "30px" : "26px";
    expect(await l.fontSize(l.howTitle())).toBe(pageTitleSize);
    for (const title of await l.stepTitles().all()) {
      expect(await l.fontSize(title)).toBe(BASE_500);
    }
  });

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
