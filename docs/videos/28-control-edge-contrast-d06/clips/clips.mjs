// Screen recordings for video 28 (tools/video-record/record-clips.mjs). The Angular app is
// built twice with `ng build saturdaze --configuration production`: the commit before the D06
// fix is served on :4401 and the fix on :4402 (any static server with an index.html fallback).
// Sign-in and create-account are anonymous, so no API is needed. The page is zoomed to 135% so
// the 1px field borders read at video size. The pointer rests in a corner (zoom shifts hit
// targets), and the "Remember me" switch is turned off from script so its off track shows.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function zoom(t) {
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.35'));
}

async function tour(t, base) {
  // Sign-in: the email and password borders, then the Remember me switch turned off.
  await t.go(`${base}/sign-in`);
  await zoom(t);
  await t.page.mouse.move(1380, 760);
  await t.wait(3200);
  await t.page.getByRole('switch', { name: 'Remember me' }).evaluate((el) => el.click());
  await t.wait(3400);
  // Create account: a stack of empty fields.
  await t.go(`${base}/create-account`);
  await zoom(t);
  await t.wait(3600);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
