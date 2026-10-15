// Screen recordings for video 31 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the D36 fix is served on :4401 and the fix on :4402. The clips sign in as
// the seeded demo account and open the Weekend page. The page is zoomed to 140% so the meta line
// reads at video size; nothing is clicked, so the zoom cannot shift a hit target.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const EMAIL = 'quinntynebrown@gmail.com';

// Bring the visible day header (title and meta line) near the top of the clip.
async function scrollToDay(t) {
  await t.page.evaluate(() => {
    const header = Array.from(document.querySelectorAll('.day__header')).find((h) => h.offsetParent !== null);
    if (header) window.scrollBy(0, header.getBoundingClientRect().top - 110);
  });
  await t.wait(500);
}

async function tour(t, base) {
  await t.signIn(EMAIL);
  await t.go(`${base}/weekend`);
  await t.page.locator('.day__meta').first().waitFor();
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.4'));
  await scrollToDay(t);
  await t.page.mouse.move(1390, 770);
  await t.wait(5500);
  // The other day, through its tab (the page shows one day at a time on narrow layouts).
  const sunday = t.page.getByRole('tab', { name: 'Sunday' });
  if (await sunday.count()) await sunday.first().evaluate((el) => el.click());
  await t.wait(600);
  await scrollToDay(t);
  await t.wait(5500);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
