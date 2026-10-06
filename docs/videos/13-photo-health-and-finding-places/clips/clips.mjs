// Screen recordings for video 13 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the admin demo data (tools/video-record/admin-demo).
export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const chip = (t, name) => t.page.locator('sd-filter-chip button', { hasText: name });
const signedIn = (t) => t.signIn('admin@saturdaze.app');
export const setup = { health: signedIn, 'worst-first': signedIn, 'drill-down': signedIn, search: signedIn, filters: signedIn };

export const clips = {
  /** The admin home: one card per catalog (L2-112). */
  async health(t) {
    await t.go('/');
    await t.wait(2000);
    const cards = t.page.locator('sd-stat-card');
    await t.hover(cards.nth(0), 1800);
    await t.hover(cards.nth(0).getByText('without a photo'), 1200);
    await t.hover(cards.nth(0).getByText('blocked URL'), 1200);
    await t.hover(cards.nth(0).getByText('unreviewed provider photo'), 1200);
    await t.hover(cards.nth(0).getByText('missing alt text'), 1400);
    await t.hover(cards.nth(1), 1500);
    await t.hover(cards.nth(2), 1500);
    await t.hover(t.page.getByRole('link', { name: /Review 4 new photos/ }), 2200);
  },

  /** The six worst places, from the same health-first sort as Places. */
  async 'worst-first'(t) {
    await t.go('/');
    await t.wait(1200);
    await t.scroll(560, 1400);
    await t.wait(1200);
    for (const name of ['Brogue Inn', 'Cirque Mechanics']) {
      await t.hover(t.page.locator('.place-row', { hasText: name }), 1300);
    }
    await t.scroll(300, 900);
    await t.wait(1500);
    await t.hover(t.page.getByRole('link', { name: 'All places' }), 1500);
  },

  /** A flag count opens Places filtered to it (L2-112 AC1). */
  async 'drill-down'(t) {
    await t.go('/');
    await t.wait(1500);
    await t.click(t.page.locator('sd-stat-card').nth(1).getByText('without a photo'));
    await t.page.waitForURL(/flag=no-photo/);
    await t.page.waitForLoadState('networkidle');
    await t.wait(2500);
    await t.hover(chip(t, 'Restaurants'), 1200);
    await t.hover(chip(t, 'No photo'), 1500);
    await t.scroll(400, 1200);
    await t.wait(1800);
  },

  /** Search by name (L2-113 AC1, AC5). */
  async search(t) {
    await t.go('/places');
    await t.wait(1800);
    await t.type(t.page.getByLabel('Search'), 'port', 140);
    await t.wait(2600);
    await t.hover(t.page.locator('.toolbar__count'), 1200);
    await t.page.getByLabel('Search').fill('');
    await t.wait(500);
    await t.type(t.page.getByLabel('Search'), 'bronte', 120);
    await t.wait(2200);
    await t.hover(t.page.locator('.place-row', { hasText: 'Bronte Creek' }), 1500);
  },

  /** Kind, flag and source filters, the sort, and opening a place. */
  async filters(t) {
    await t.go('/places');
    await t.wait(1500);
    await t.click(chip(t, 'Restaurants'));
    await t.wait(1800);
    await t.click(chip(t, 'Unreviewed'));
    await t.wait(2200);
    await t.click(chip(t, 'Unreviewed'));
    await t.click(chip(t, 'All kinds'));
    await t.wait(800);
    await t.click(chip(t, 'Primary is curated'));
    await t.wait(2200);
    await t.moveTo(t.page.getByLabel('Sort'));
    await t.wait(500);
    await t.page.getByLabel('Sort').selectOption('name');
    await t.wait(2200);
    await t.click(t.page.locator('.place-row', { hasText: 'Royal Botanical' }));
    await t.page.waitForURL(/\/places\/Activity\//);
    await t.page.waitForLoadState('networkidle');
    await t.wait(2500);
  },
};
