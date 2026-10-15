// Screen recordings for video 29 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration production`: the commit before the D34 fix is
// served on :4401 and the fix on :4402 (any static server). The landing page is anonymous, so no
// API is needed. The page is zoomed to 160% so the clock column reads at video size. The clip scrolls to the miniature weekend and rests on its clock column.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function tour(t, base) {
  await t.go(`${base}/`);
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.6'));
  const block = t.page.locator('.block').first();
  await block.scrollIntoViewIfNeeded();
  await t.page.evaluate(() => {
    const el = document.querySelector('.block');
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - 110);
  });
  await t.page.mouse.move(1380, 760);
  await t.wait(4200);
  await t.scroll(260);
  await t.wait(3600);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
