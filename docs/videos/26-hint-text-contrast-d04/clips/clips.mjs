// Screen recordings for video 26 (tools/video-record/record-clips.mjs). The Angular app is
// built twice with `ng build saturdaze --configuration production`: the commit before the D04
// fix is served on :4401 and the fix on :4402 (any static server with an index.html fallback).
// Create account, sign-in and the landing page are anonymous, so no API is needed. The page is
// zoomed to 135% so the 12px hint text reads at video size.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function zoom(t) {
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.35'));
}

async function tour(t, base) {
  // Create account: the "The Browns" placeholder in the family name field.
  await t.go(`${base}/create-account`);
  await zoom(t);
  await t.page.mouse.move(1380, 760);
  await t.wait(1200);
  await t.hover(t.page.locator('.auth-card').getByLabel('Family name'));
  await t.wait(2600);
  // Sign-in: the Terms · Privacy footer under the card.
  await t.go(`${base}/sign-in`);
  await zoom(t);
  await t.wait(800);
  await t.page.locator('.auth__foot').scrollIntoViewIfNeeded();
  await t.hover(t.page.locator('.auth__foot'));
  await t.wait(2600);
  // Landing: the "Free during the beta." note next to the call to action, then the footer.
  await t.go(`${base}/`);
  await zoom(t);
  await t.wait(800);
  await t.hover(t.page.locator('.hero__note'));
  await t.wait(2600);
  await t.page.locator('.site-footer').scrollIntoViewIfNeeded();
  await t.hover(t.page.locator('.site-footer'));
  await t.wait(2600);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
