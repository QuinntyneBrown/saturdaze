// Screen recordings for video 36 (tools/video-record/record-clips.mjs). The drift is in the static
// mocks' stylesheet (the app's sd-list-item was already right), so the clips open the Family mock:
// a copy of docs/mocks as it was on main is served on :4401 and the fixed one on :4402 (any static
// server; no API is needed). The page is zoomed to 140% so the 1px dividers read at video size;
// the pointer only hovers.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function family(t, base) {
  await t.go(`${base}/pages/family.html`);
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.4'));
  const members = t.page.locator('.list').first();
  await members.scrollIntoViewIfNeeded();
  await t.page.evaluate(() => {
    const el = document.querySelector('.list');
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - 160);
  });
  await t.page.mouse.move(1390, 770);
  await t.wait(5500);
  await t.scroll(260);
  await t.wait(4500);
}

export const clips = {
  before: (t) => family(t, 'http://localhost:4401'),
  after: (t) => family(t, 'http://localhost:4402'),
};
