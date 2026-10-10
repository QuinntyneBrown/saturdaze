import { test, expect } from "../fixtures/sd-test.js";

/**
 * Spacing on the 4px grid (drift D15). Wells and banners pad 12 × 16px,
 * dialog and auth-form gaps are 16px, the auth card gaps 16px and pads 24px on
 * phones and 32px from 720px, large buttons pad 24px inline and the footer
 * spaces its links 12px apart. Fluent's 2, 6 and 10px nudges stay.
 */

test.describe("Spacing on the grid", () => {
  test("Given the sign-in error state, when a person reads the card, then the card, form and banner sit on the 4px grid", async ({
    goto,
    pages,
  }, testInfo) => {
    await goto("signInError");
    const s = pages.signIn;
    await s.waitForReady();

    const cardPadding = testInfo.project.name === "mobile" ? "24px" : "32px";
    expect(await s.padding(s.card())).toBe(cardPadding);
    expect(await s.gap(s.card())).toBe("16px");
    expect(await s.gap(s.cardForm())).toBe("16px");
    expect(await s.padding(s.errorBanner())).toBe("12px 16px");
  });

  test("Given the family page, when a person opens a dialog, then the panel and its form gap 16px", async ({
    goto,
    pages,
  }) => {
    await goto("family");
    const f = pages.family;
    await f.waitForReady();
    await f.addMemberRow().click();

    await expect(f.dialogPanel()).toBeVisible();
    expect(await f.gap(f.dialogPanel())).toBe("16px");
    expect(await f.gap(f.dialogForm())).toBe("16px");
  });

  test("Given the landing page, when a person reads the call to action and the footer, then the large button pads 24px and the footer links sit 12px apart", async ({
    goto,
    pages,
  }) => {
    await goto("landing", { anonymous: true });
    const l = pages.landing;
    await l.waitForReady();

    expect(await l.padding(l.heroCta())).toBe("0px 24px");
    expect(await l.gap(l.footer)).toBe("6px 12px");
  });
});

/**
 * Landing hero padding on the spacing scale (drift D16): 40 × 24px on phones,
 * 56 × 40px from 720px and 64 × 56px (`--layoutSpacePage`) from 1024px.
 */
test.describe("Landing hero padding on the scale", () => {
  test("Given the landing page, when a person reads the hero, then it pads on the spacing scale at every width", async ({
    goto,
    pages,
  }, testInfo) => {
    await goto("landing", { anonymous: true });
    const l = pages.landing;
    await l.waitForReady();

    const expected = { mobile: "40px 24px", tablet: "56px 40px", desktop: "64px 56px" }[testInfo.project.name];
    expect(await l.padding(l.hero)).toBe(expected);
  });
});
