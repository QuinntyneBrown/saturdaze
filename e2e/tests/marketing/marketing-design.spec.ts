// Design drift rules that guarded the in-app landing page (D05, D04, D12, D14,
// D15), now held by the marketing site that replaced it (ADR-018).
import { test, expect } from "../../fixtures/sd-test.js";

const SOFT_SLATE = "rgb(91, 98, 112)"; // #5B6270, --colorNeutralForeground2
const HINT_SLATE = "rgb(99, 106, 119)"; // #636A77, --colorNeutralForeground3
const BASE_500 = "17px";

test.beforeEach(async ({ goto, pages }) => {
  await pages.marketing.preferColorScheme("light");
  await goto("marketing");
  await pages.marketing.waitForReady();
});

test("Given the hero, when a person reads the lede and the note, then they are the AA soft and hint slates", async ({ pages }) => {
  const m = pages.marketing;
  expect(await m.textColor(m.heroLede())).toBe(SOFT_SLATE);
  expect(await m.textColor(m.heroNote())).toBe(HINT_SLATE);
});

test("Given the hero, when a person reads it, then the title is bold at line height 1 and the lede is 17px", async ({ pages }) => {
  const m = pages.marketing;
  expect(await m.fontWeight(m.heroTitle())).toBe("700");
  expect(await m.lineHeightRatio(m.heroTitle())).toBe(1);
  expect(await m.fontSize(m.heroLede())).toBe(BASE_500);
});

test("Given a desktop, when a person reads how it works, then its title is the page-title size", async ({ pages }) => {
  expect(await pages.marketing.fontSize(pages.marketing.howTitle())).toBe("30px");
});

test("Given the hero's call to action, when a person reads it, then the large button pads 24px inline", async ({ pages }) => {
  expect(await pages.marketing.padding(pages.marketing.heroCreateAccount())).toBe("0px 24px");
});

test("Given the hero's browser frame, when a person reads its URL, then it is 12px", async ({ pages }) => {
  expect(await pages.marketing.fontSize(pages.marketing.previewUrl())).toBe("12px");
});
