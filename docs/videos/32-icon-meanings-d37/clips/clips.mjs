// Screen recordings for video 32 (tools/video-record/record-clips.mjs). Saturdaze Admin is built
// twice with `ng build admin --configuration development` (it talks to the local API on :5100):
// main before the D37 fix is served on :4401 and the fix on :4402. The clips sign in as the seeded
// administrator and visit two screens: Photo health, where "All places" ends in an arrow, and the
// Place photos screen for Bronte Creek, where the primary photo and "Make primary" carry the new
// bookmark. The page is zoomed to 140% so the 16px glyphs read at video size; the pointer only
// hovers, so the zoom cannot shift a click.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const ADMIN = 'admin@saturdaze.app';
const BRONTE = '58703286-ed42-4f2c-99e4-b6e48d1c110f';

const zoom = (t) => t.page.evaluate(() => (document.documentElement.style.zoom = '1.4'));

async function arrows(t, base) {
  await t.signIn(ADMIN);
  await t.go(`${base}/`);
  await t.page.getByRole('link', { name: /All places/ }).or(t.page.getByRole('button', { name: /All places/ })).first().waitFor();
  await zoom(t);
  const allPlaces = t.page.getByText('All places').first();
  await allPlaces.scrollIntoViewIfNeeded();
  await t.wait(800);
  await t.hover(allPlaces, 5200);
}

async function primary(t, base) {
  await t.signIn(ADMIN);
  await t.go(`${base}/places/Activity/${BRONTE}`);
  await t.page.locator('sd-photo-tile').first().waitFor();
  await zoom(t);
  const chip = t.page.locator('sd-photo-tile .photo-tile__badges', { hasText: 'Primary' }).first();
  await chip.scrollIntoViewIfNeeded();
  await t.wait(800);
  await t.hover(chip, 3200);
  const make = t.page.getByRole('button', { name: 'Make primary' }).first();
  await make.scrollIntoViewIfNeeded();
  await t.wait(600);
  await t.hover(make, 3600);
}

export const clips = {
  'before-arrow': (t) => arrows(t, 'http://localhost:4401'),
  'before-primary': (t) => primary(t, 'http://localhost:4401'),
  'after-arrow': (t) => arrows(t, 'http://localhost:4402'),
  'after-primary': (t) => primary(t, 'http://localhost:4402'),
};
