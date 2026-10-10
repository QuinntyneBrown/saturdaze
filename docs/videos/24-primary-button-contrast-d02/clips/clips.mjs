// Screen recordings for video 24 (tools/video-record/record-clips.mjs). The Angular app is
// built twice with `ng build saturdaze --configuration production`: the commit before the D02
// fix is served on :4401 and the fix on :4402 (any static server with an index.html fallback).
// Landing and sign-in are anonymous, so no API is needed.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function tour(t, base) {
  await t.go(`${base}/`);
  await t.wait(1500);
  await t.hover(t.page.locator('.hero .btn--primary').first(), 1500);
  await t.hover(t.page.locator('.brand-mark').first(), 1500);
  await t.go(`${base}/sign-in`);
  await t.wait(1200);
  await t.hover(t.page.locator('.btn--primary').first(), 1800);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
