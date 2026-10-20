// Traces to: L2-150, L2-138
import { test, expect } from "../../fixtures/sd-test.js";

const APP = "https://app.saturdaze.ca";

test.beforeEach(async ({ goto, pages }) => {
  await goto("marketing");
  await pages.marketing.waitForReady();
});

test("Given a visitor opens the marketing page, then the hero headline and its calls to action point at the app", async ({ pages }) => {
  const marketing = pages.marketing;
  await expect(marketing.heading()).toHaveText("Two days. Already planned.");
  await expect(marketing.heroCreateAccount()).toHaveAttribute("href", `${APP}/create-account`);
  await expect(marketing.heroNote()).toHaveText("Free during the beta.");
  await expect(marketing.seeHowItWorks()).toHaveAttribute("href", "#how");
  await expect(marketing.headerOpenTheApp()).toHaveAttribute("href", `${APP}/sign-in`);
});

test("Given the marketing page, then its sections come in order and end with a call to action", async ({ pages }) => {
  const marketing = pages.marketing;
  await expect(marketing.sectionHeadings()).toHaveText([
    "Saturdaze in one minute.",
    "How a weekend comes together",
    "Inside the app",
    "Built around your family.",
    "Your next weekend, already drafted.",
  ]);
  await expect(marketing.finalLink("Create your account")).toHaveAttribute("href", `${APP}/create-account`);
  await expect(marketing.finalLink("Sign in")).toHaveAttribute("href", `${APP}/sign-in`);
});

test("Given the how-it-works section, then it lists the three steps of a weekend", async ({ pages }) => {
  await expect(pages.marketing.stepTitles()).toHaveText([
    "Tell us who is in the family",
    "Lock what does not move",
    "Get a weekend every Friday",
  ]);
});

test("Given the for-families grid, then it covers commitments, nearby ideas, errands and the weather", async ({ pages }) => {
  await expect(pages.marketing.familyCards()).toHaveText([/commitments/i, /drive/i, /errands/i, /weather/i]);
});

test('Given each section explains why it is worth it, when a visitor wants more, then "Try it free" opens create-account', async ({ pages }) => {
  const links = pages.marketing.sectionTryItFree();
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) await expect(link).toHaveAttribute("href", `${APP}/create-account`);
});

test("Given the watch section, then the brand video is served by the site with a poster and controls, and does not play on its own", async ({ pages }) => {
  await expect(pages.marketing.video()).toHaveCount(1);
  expect(await pages.marketing.videoReport()).toEqual({
    controls: true,
    autoplay: false,
    poster: { ok: true, type: expect.stringMatching(/^image\//) },
    file: { ok: true, type: expect.stringMatching(/^video\/mp4/) },
    src: expect.stringMatching(/\.mp4$/),
  });
});

test("Given the inside-the-app gallery, then four screenshots load, are described and keep their shape", async ({ pages }) => {
  const report = await pages.marketing.screenshotReport();
  expect(report).toHaveLength(4);
  for (const shot of report) expect(shot).toEqual({ alt: expect.stringMatching(/.{20,}/), loaded: true, distorted: false });
});

test("Given the footer, then it is the page's contentinfo outside main, links to the app's legal pages and shows this year", async ({ pages }) => {
  const marketing = pages.marketing;
  await expect(marketing.footer).toHaveCount(1);
  await expect(marketing.footerInMain).toHaveCount(0);
  await expect(marketing.footerLink("Terms")).toHaveAttribute("href", `${APP}/legal`);
  await expect(marketing.footerLink("Privacy")).toHaveAttribute("href", `${APP}/legal#privacy`);
  await expect(marketing.footerLink("Sign in")).toHaveAttribute("href", `${APP}/sign-in`);
  await expect(marketing.footerYear()).toHaveText(String(new Date().getFullYear()));
});
