// Screen recordings for video 27 (tools/video-record/record-clips.mjs). The Angular app is
// built twice with `ng build saturdaze --configuration production`: the commit before the D05
// fix is served on :4401 and the fix on :4402 (any static server with an index.html fallback).
// Legal, sign-in and the landing page are anonymous, so no API is needed. The page is zoomed
// to 135% so the secondary text reads at video size. The cursor never rests on the resting
// "Privacy" segment, because hovering it switches it to the content ink.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function zoom(t) {
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.35'));
}

async function tour(t, base) {
  // Legal: the Terms · Privacy segments on their recessed well.
  await t.go(`${base}/legal`);
  await zoom(t);
  await t.page.mouse.move(1380, 760);
  await t.wait(1200);
  await t.hover(t.page.locator('.doc-switch .segments__tab[aria-current="page"]'));
  await t.wait(2200);
  await t.hover(t.page.locator('.prose__updated').first());
  await t.wait(2000);
  // Sign-in: the subtitle under the card title and the "New here?" line.
  await t.go(`${base}/sign-in`);
  await zoom(t);
  await t.wait(800);
  await t.hover(t.page.locator('.auth-card__sub'));
  await t.wait(2400);
  // Landing: the eyebrow and lede beside the call to action.
  await t.go(`${base}/`);
  await zoom(t);
  await t.wait(800);
  await t.hover(t.page.locator('.hero__lede'));
  await t.wait(2600);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
